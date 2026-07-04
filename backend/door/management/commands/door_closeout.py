"""
Closeout artifacts (Phase 5 / locked scope): attendance CSV, denied-attempt
log, throughput analytics — derived from DoorScan rows. v1.0 has no closeout
routes, so this is internal tooling by design; a client-facing closeout
surface is a flagged v1.1 slot (Phase 7 host reports — do NOT invent
unregistered routes; the drift script enforces this).

    manage.py door_closeout --event <event echo_id> [--out ./closeout]

Writes three files into --out:
  attendance-<event>.csv   approved scans (check-ins + duplicate alerts)
  denied-<event>.csv       every refused attempt with its refusal code
  throughput-<event>.csv   scans per 15-minute bucket (approved/denied split)
"""

import csv
import uuid
from datetime import timedelta
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from door.models import DoorScan
from events.models import Event

BUCKET_MINUTES = 15


class Command(BaseCommand):
    help = "Write door closeout artifacts (attendance, denied attempts, throughput) as CSV."

    def add_arguments(self, parser):
        parser.add_argument("--event", required=True, help="Event echo_id to close out.")
        parser.add_argument("--out", default="closeout", help="Output directory.")

    def handle(self, *args, **options):
        try:
            event = Event.objects.get(echo_id=uuid.UUID(options["event"]))
        except (ValueError, Event.DoesNotExist):
            raise CommandError(f"Unknown event: {options['event']}") from None

        out_dir = Path(options["out"])
        out_dir.mkdir(parents=True, exist_ok=True)
        scans = (
            DoorScan.objects.filter(event=event)
            .select_related("session", "ticket__tier")
            .order_by("recorded_at")
        )

        attendance_path = out_dir / f"attendance-{event.echo_id}.csv"
        denied_path = out_dir / f"denied-{event.echo_id}.csv"
        throughput_path = out_dir / f"throughput-{event.echo_id}.csv"

        buckets: dict[str, list[int]] = {}
        approved_rows = denied_rows = 0

        with attendance_path.open("w", newline="") as att_f, denied_path.open(
            "w", newline=""
        ) as den_f:
            attendance = csv.writer(att_f)
            attendance.writerow(
                [
                    "recorded_at",
                    "scanned_at",
                    "ticket_id",
                    "tier",
                    "access_tier",
                    "verification_state",
                    "session_label",
                    "zone",
                    "offline",
                    "source",
                ]
            )
            denied = csv.writer(den_f)
            denied.writerow(
                [
                    "recorded_at",
                    "scanned_at",
                    "ticket_id",
                    "verification_state",
                    "refusal_code",
                    "failure_reason",
                    "session_label",
                    "zone",
                    "offline",
                    "source",
                ]
            )

            for scan in scans.iterator():
                bucket_start = scan.recorded_at - timedelta(
                    minutes=scan.recorded_at.minute % BUCKET_MINUTES,
                    seconds=scan.recorded_at.second,
                    microseconds=scan.recorded_at.microsecond,
                )
                counts = buckets.setdefault(bucket_start.isoformat(), [0, 0])
                counts[0 if scan.approved else 1] += 1

                if scan.approved:
                    approved_rows += 1
                    attendance.writerow(
                        [
                            scan.recorded_at.isoformat(),
                            scan.scanned_at.isoformat(),
                            scan.ticket_id or "",
                            scan.ticket.tier.name if scan.ticket else "",
                            scan.ticket.tier.access_tier if scan.ticket else "",
                            scan.verification_state,
                            scan.session.label,
                            scan.session.zone,
                            scan.offline,
                            scan.source,
                        ]
                    )
                else:
                    denied_rows += 1
                    denied.writerow(
                        [
                            scan.recorded_at.isoformat(),
                            scan.scanned_at.isoformat(),
                            scan.ticket_id or "",
                            scan.verification_state,
                            scan.refusal_code,
                            scan.failure_reason,
                            scan.session.label,
                            scan.session.zone,
                            scan.offline,
                            scan.source,
                        ]
                    )

        with throughput_path.open("w", newline="") as thr_f:
            throughput = csv.writer(thr_f)
            throughput.writerow(["bucket_start", "approved", "denied", "total"])
            for bucket_start in sorted(buckets):
                approved, refused = buckets[bucket_start]
                throughput.writerow([bucket_start, approved, refused, approved + refused])

        self.stdout.write(self.style.SUCCESS(f"Closeout written to {out_dir}/"))
        self.stdout.write(f"  attendance: {approved_rows} row(s) -> {attendance_path.name}")
        self.stdout.write(f"  denied:     {denied_rows} row(s) -> {denied_path.name}")
        self.stdout.write(f"  throughput: {len(buckets)} bucket(s) -> {throughput_path.name}")
