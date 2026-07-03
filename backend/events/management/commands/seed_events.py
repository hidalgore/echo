"""
Seed the event catalog from the mock-corpus snapshot (Phase 2 / W1).

The snapshot (events/seed/mock_events.json) is generated from the frontend's
mock corpus by `frontend/scripts/dump-mock-events.ts` and stores date OFFSETS,
not absolute dates — the corpus mints its dates relative to "now" so staging
always demos live/upcoming events. This command re-materializes real
datetimes at seed time.

Idempotent by natural keys: events upsert on `import_ref` (the corpus id,
e.g. "evt_001"), venues on (name, address), tiers on (event, import_ref).
Safe to re-run; a re-run refreshes content/dates. Tier capacity is only set
on first create — re-seeding never clobbers `quantity_sold` accumulated by
real sales (Phase 3).

Audit: mutations of already-live catalog rows are recorded per event
(`event.seed_updated`), plus one `catalog.seeded` summary per run (the
kickoff's "admin/seed mutation of live events" rule).
"""

import json
from datetime import timedelta
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from audit import service as audit
from events.models import DonationCampaign, Event, EventStatus, TicketTier, Venue
from events.refunds import build_refund_policy_snapshot

DEFAULT_SNAPSHOT = Path(__file__).resolve().parent.parent.parent / "seed" / "mock_events.json"

# Synthesized announce/sales lead times (the corpus has no publish schedule).
ANNOUNCE_LEAD = timedelta(days=14)
SALES_LEAD = timedelta(days=7)


def _city_from_address(address: str) -> str:
    # Corpus addresses are "street, City, ST".
    parts = [part.strip() for part in address.split(",") if part.strip()]
    return parts[-2] if len(parts) >= 2 else ""


def _status_for(now, publish_at, sales_start_at, starts_at, ends_at) -> str:
    if ends_at <= now:
        return EventStatus.ENDED
    if starts_at <= now:
        return EventStatus.LIVE
    if sales_start_at <= now:
        return EventStatus.ON_SALE
    if publish_at <= now:
        return EventStatus.SCHEDULED
    return EventStatus.DRAFT


class Command(BaseCommand):
    help = "Idempotently seed the event catalog from the mock-corpus snapshot."

    def add_arguments(self, parser):
        parser.add_argument(
            "--snapshot",
            default=str(DEFAULT_SNAPSHOT),
            help="Path to the mock_events.json snapshot (default: bundled).",
        )

    def handle(self, *args, **options):
        snapshot_path = Path(options["snapshot"])
        try:
            snapshot = json.loads(snapshot_path.read_text())
            records = snapshot["events"]
        except (OSError, ValueError, KeyError) as exc:
            raise CommandError(f"could not read snapshot {snapshot_path}: {exc}") from exc

        now = timezone.now()
        created = updated = unchanged = 0

        with transaction.atomic():
            for record in records:
                event, event_created, changed = self._upsert_event(record, now)
                self._upsert_tiers(event, record["ticket_types"])
                self._upsert_campaign(event, record.get("donation_campaign"))
                if event_created:
                    created += 1
                elif changed:
                    updated += 1
                    audit.record(
                        "event.seed_updated",
                        target=("event", event.echo_id),
                        metadata={"public_id": event.public_id, "import_ref": event.import_ref},
                    )
                else:
                    unchanged += 1

        audit.record(
            "catalog.seeded",
            metadata={
                "snapshot": snapshot_path.name,
                "created": created,
                "updated": updated,
                "unchanged": unchanged,
            },
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(records)} events: {created} created, {updated} updated, "
                f"{unchanged} unchanged."
            )
        )

    def _upsert_event(self, record: dict, now):
        venue, _ = Venue.objects.get_or_create(
            name=record["venue_name"],
            address=record["venue_address"],
            defaults={"city": _city_from_address(record["venue_address"])},
        )

        starts_at = now + timedelta(minutes=record["start_offset_minutes"])
        ends_at = now + timedelta(minutes=record["end_offset_minutes"])
        # Every corpus event is already announced; sales open with a lead when
        # that is in the past, otherwise (far-future events) they open on a
        # midpoint the lifecycle worker will hit — a live demo of W3.
        publish_at = min(starts_at - ANNOUNCE_LEAD, now - timedelta(days=1))
        sales_start_at = starts_at - SALES_LEAD
        if sales_start_at > now:
            sales_start_at = min(sales_start_at, now + (starts_at - now) / 2)

        fields = {
            "title": record["title"],
            "description": record["description"],
            "category": record["category"],
            "venue": venue,
            "starts_at": starts_at,
            "ends_at": ends_at,
            "publish_at": publish_at,
            "sales_start_at": sales_start_at,
            "status": _status_for(now, publish_at, sales_start_at, starts_at, ends_at),
            "image_url": record["image_url"],
            "is_featured": record["is_featured"],
            "host_name": record["host_name"],
            "host_verified": record["host_verified"],
            "age_restriction": record["age_restriction"],
            "social_energy_override": record["social_energy_override"],
            # Phase 3: nonprofit hosts get the platform-fee waiver; the corpus
            # marks them via their donation campaign (dump-mock-events.ts).
            "host_is_nonprofit": record.get("host_is_nonprofit", False),
        }

        existing = Event.objects.filter(import_ref=record["id"]).select_related("venue").first()
        if existing is None:
            event = Event(import_ref=record["id"], **fields)
            # Seeded events materialize already-published: capture the
            # refund-policy snapshot the publish transition would have taken.
            event.refund_policy_snapshot = build_refund_policy_snapshot(event.allow_refunds)
            event.save()
            return event, True, True

        changed = False
        for name, value in fields.items():
            if getattr(existing, name) != value:
                setattr(existing, name, value)
                changed = True
        if changed:
            existing.save()
        return existing, False, changed

    def _upsert_tiers(self, event: Event, tiers: list[dict]) -> None:
        for index, tier in enumerate(tiers):
            existing = TicketTier.objects.filter(event=event, import_ref=tier["id"]).first()
            if existing is None:
                TicketTier.objects.create(
                    event=event,
                    import_ref=tier["id"],
                    name=tier["name"],
                    description=tier["description"],
                    price_cents=tier["price_cents"],
                    # Corpus `available` becomes initial capacity; sold starts 0.
                    quantity_total=tier["available"],
                    sort_order=index,
                )
                continue
            # Never touch quantity_total/quantity_sold on re-runs — real sales
            # (Phase 3) own those counters once the row exists.
            existing.name = tier["name"]
            existing.description = tier["description"]
            existing.price_cents = tier["price_cents"]
            existing.sort_order = index
            existing.save(update_fields=["name", "description", "price_cents", "sort_order", "updated_at"])

    def _upsert_campaign(self, event: Event, record: dict | None) -> None:
        """Idempotent like tiers: content refreshes on re-runs, but progress
        counters (raised_cents / donor_count) are set on create only — real
        donations (Phase 3 checkout) own them once the row exists. A corpus
        that drops a campaign closes it rather than deleting attribution."""
        if record is None:
            DonationCampaign.objects.filter(event=event).update(status="closed")
            return
        fields = {
            "nonprofit_name": record["nonprofit_name"],
            "cause_title": record["cause_title"],
            "cause_description": record["cause_description"],
            "goal_cents": record["goal_cents"],
            "suggested_amounts_cents": record["suggested_amounts_cents"],
            "status": record["status"],
        }
        existing = DonationCampaign.objects.filter(event=event).first()
        if existing is None:
            DonationCampaign.objects.create(
                event=event,
                import_ref=record.get("id", ""),
                raised_cents=record.get("raised_cents", 0),
                donor_count=record.get("donor_count", 0),
                **fields,
            )
            return
        for name, value in fields.items():
            setattr(existing, name, value)
        existing.save(update_fields=[*fields.keys(), "updated_at"])
