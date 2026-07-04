"""
Door scan verdict engine (Phase 5 / W2-W3).

Builds on the locked Phase 4 verification primitives — every accepted scan
verifies a server-signed payload via `tickets.credentials.verify_validation_token`
(both `typ=credential` and `typ=pkpass`) or the NFC-credential lookup with the
same refusal semantics. Serial-only validation is disallowed: a bare
`ticket_id` with no token never approves.

Verdict vocabulary is the client's locked `DoorVerificationState`
(`accessControlService.ts`) plus the flagged `duplicate_alert` extension:

  verified          approved — clean first scan (ticket becomes checked_in)
  duplicate_alert   approved — re-scan inside the duplicate window (locked
                    rule: alert, not block)
  duplicate_blocked refused — re-scan outside the window
  wrong_zone        refused — tier not authorized at this session's checkpoint
  denied            refused — every credential/status refusal (the stable
                    refusal code rides `failure_reason`)

(`security_hold` / `flagged` are Phase 8 trust states — the server never
emits them in Phase 5.)

Hot path (<500ms locked rule): signature verification is in-process crypto;
everything else is single-row indexed lookups (ticket by echo_id or
nfc_credential_id, current nonce, last approved scan by the composite scan
index). No external calls.
"""

from dataclasses import dataclass
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from door.access import DEFAULT_ACCESS_TIER, can_tier_access_zone, tier_zones
from door.models import DoorScan, DoorScanSource, DoorSession
from events.serializers import age_badge
from tickets import credentials
from tickets.models import Ticket, TicketCredential, TicketStatus

# Door-level refusal codes (extending the stable tickets.credentials set —
# extending is allowed by the Phase 4 lock; re-deriving is not).
WRONG_EVENT = "wrong_event"
WRONG_ZONE = "wrong_zone"
DUPLICATE = "duplicate"
SERIAL_ONLY = "serial_only_disallowed"
NO_CREDENTIAL = "no_credential"

# Wire verification states (client DoorVerificationState + flagged extension).
STATE_VERIFIED = "verified"
STATE_DUPLICATE_ALERT = "duplicate_alert"
STATE_DUPLICATE_BLOCKED = "duplicate_blocked"
STATE_WRONG_ZONE = "wrong_zone"
STATE_DENIED = "denied"


@dataclass(frozen=True)
class DoorVerdict:
    """Everything a DoorScanResultDTO needs, plus the persistence fields."""

    approved: bool
    verification_state: str
    refusal_code: str  # "" on clean approvals
    failure_reason: str | None
    ticket: Ticket | None
    ticket_status: str  # wire TicketStatusDTO snapshot
    tier_id: str  # access-tier key (client maps color/label locally)
    authorized_zones: list[str]
    age_badge: str


def _resolve(payload: dict) -> tuple[credentials.VerificationResult | None, str]:
    """Resolve the presented credential to a VerificationResult.

    Returns (result, refusal_code_when_result_is_None). Exactly one of the
    two carries meaning: a None result means the request never presented a
    verifiable credential (refused before any lookup).
    """
    leeway = settings.ECHO_DOOR_SCAN_LEEWAY_SECONDS

    qr_payload = payload.get("qr_payload") or ""
    if qr_payload:
        return credentials.verify_validation_token(qr_payload, leeway_seconds=leeway), ""

    nfc_credential_id = payload.get("nfc_credential_id") or ""
    if nfc_credential_id:
        return _verify_nfc(nfc_credential_id, leeway_seconds=leeway), ""

    # A bare ticket_id is serial-only validation — disallowed (locked rule).
    if payload.get("ticket_id"):
        return None, SERIAL_ONLY
    return None, NO_CREDENTIAL


def _verify_nfc(nfc_credential_id: str, *, leeway_seconds: int) -> credentials.VerificationResult:
    """NFC lookup path — the same checks `verify_validation_token` runs, in
    the same order (existence, status, freshness), against the stored current
    credential instead of a presented token. The id rotates with the
    credential, so a stale id simply no longer resolves."""
    credential = (
        TicketCredential.objects.select_related("ticket__event", "ticket__tier")
        .filter(nfc_credential_id=nfc_credential_id)
        .first()
    )
    if credential is None:
        return credentials.VerificationResult(valid=False, code=credentials.UNKNOWN_TICKET)

    ticket = credential.ticket
    if ticket.status != TicketStatus.ACTIVE:
        return credentials.VerificationResult(
            valid=False, code=credentials.TICKET_NOT_ACTIVE, ticket=ticket
        )
    if credential.expires_at + timedelta(seconds=leeway_seconds) <= timezone.now():
        return credentials.VerificationResult(
            valid=False, code=credentials.EXPIRED, ticket=ticket
        )
    return credentials.VerificationResult(valid=True, code=credentials.VALID, ticket=ticket)


def _last_approved_at(ticket: Ticket):
    return (
        DoorScan.objects.filter(ticket=ticket, approved=True)
        .order_by("-recorded_at")
        .values_list("recorded_at", flat=True)
        .first()
    )


def _ticket_fields(ticket: Ticket | None) -> tuple[str, str, list[str]]:
    """(wire ticket_status, access tier key, authorized zones). Unresolved
    scans get the mock adapter's established fallbacks: 'revoked' status,
    GA tier, no zones."""
    if ticket is None:
        return TicketStatus.REVOKED, DEFAULT_ACCESS_TIER, []
    access_tier = ticket.tier.access_tier or DEFAULT_ACCESS_TIER
    return ticket.status, access_tier, list(tier_zones(access_tier))


def evaluate_scan(session: DoorSession, payload: dict) -> DoorVerdict:
    """Produce the verdict for one scan against server truth (no side
    effects — persistence/check-in is `record_scan`'s job)."""
    result, precheck_refusal = _resolve(payload)

    if result is None:
        return DoorVerdict(
            approved=False,
            verification_state=STATE_DENIED,
            refusal_code=precheck_refusal,
            failure_reason=precheck_refusal,
            ticket=None,
            ticket_status=TicketStatus.REVOKED,
            tier_id=DEFAULT_ACCESS_TIER,
            authorized_zones=[],
            age_badge=age_badge(session.event.age_restriction),
        )

    ticket = result.ticket
    ticket_status, access_tier, zones = _ticket_fields(ticket)
    badge = age_badge(session.event.age_restriction)

    def refused(state: str, code: str, reason: str | None = None) -> DoorVerdict:
        return DoorVerdict(
            approved=False,
            verification_state=state,
            refusal_code=code,
            failure_reason=reason or code,
            ticket=ticket,
            ticket_status=ticket_status,
            tier_id=access_tier,
            authorized_zones=zones,
            age_badge=badge,
        )

    # A credential for a different event never validates at this door, no
    # matter how it verified cryptographically.
    if ticket is not None and ticket.event_id != session.event_id:
        return refused(STATE_DENIED, WRONG_EVENT)

    if not result.valid:
        if result.code == credentials.TICKET_NOT_ACTIVE and ticket is not None:
            if ticket.status == TicketStatus.CHECKED_IN:
                return _duplicate_verdict(ticket, ticket_status, access_tier, zones, badge)
        return refused(STATE_DENIED, result.code)

    # Valid credential on a live ticket: zone authorization at this checkpoint.
    if not can_tier_access_zone(access_tier, session.zone):
        return refused(
            STATE_WRONG_ZONE, WRONG_ZONE, f"{access_tier} is not authorized at {session.zone}"
        )

    return DoorVerdict(
        approved=True,
        verification_state=STATE_VERIFIED,
        refusal_code="",
        failure_reason=None,
        ticket=ticket,
        ticket_status=TicketStatus.CHECKED_IN,  # record_scan performs the transition
        tier_id=access_tier,
        authorized_zones=zones,
        age_badge=badge,
    )


def _duplicate_verdict(
    ticket: Ticket, ticket_status: str, access_tier: str, zones: list[str], badge: str
) -> DoorVerdict:
    """Checked-in ticket re-presented: inside the window it's a tailgate-risk
    alert but the guest goes through (locked rule: alert, not block); outside
    the window it's a hard refusal."""
    window = timedelta(seconds=settings.ECHO_DOOR_DUPLICATE_WINDOW_SECONDS)
    last = _last_approved_at(ticket)
    # last=None with a checked_in ticket means the winning scan's row hasn't
    # landed yet (two doors racing on one ticket, milliseconds apart) — that
    # is inside any window, so alert-approve rather than refuse a paying
    # guest on a race.
    within = last is None or timezone.now() - last <= window
    if within:
        return DoorVerdict(
            approved=True,
            verification_state=STATE_DUPLICATE_ALERT,
            refusal_code=DUPLICATE,
            failure_reason="credential_already_used",
            ticket=ticket,
            ticket_status=ticket_status,
            tier_id=access_tier,
            authorized_zones=zones,
            age_badge=badge,
        )
    return DoorVerdict(
        approved=False,
        verification_state=STATE_DUPLICATE_BLOCKED,
        refusal_code=DUPLICATE,
        failure_reason="credential_already_used",
        ticket=ticket,
        ticket_status=ticket_status,
        tier_id=access_tier,
        authorized_zones=zones,
        age_badge=badge,
    )


def record_scan(
    session: DoorSession,
    payload: dict,
    *,
    scanned_at,
    offline: bool,
    source: str = DoorScanSource.LIVE,
) -> DoorVerdict:
    """Evaluate + persist one scan, performing the check-in transition.

    The status-guarded UPDATE decides a single check-in winner when two doors
    race on the same ticket; the loser re-evaluates and lands in the
    duplicate path (inside the window by construction -> approved + alert).
    """
    verdict = evaluate_scan(session, payload)

    if verdict.approved and verdict.verification_state == STATE_VERIFIED:
        claimed = Ticket.objects.filter(
            pk=verdict.ticket.pk, status=TicketStatus.ACTIVE
        ).update(status=TicketStatus.CHECKED_IN, updated_at=timezone.now())
        if not claimed:
            # Lost the check-in race — re-evaluate against the new status;
            # this lands in the duplicate path (approved + alert).
            verdict = evaluate_scan(session, payload)

    DoorScan.objects.create(
        session=session,
        event=session.event,
        ticket=verdict.ticket,
        approved=verdict.approved,
        verification_state=verdict.verification_state,
        refusal_code=verdict.refusal_code,
        failure_reason=verdict.failure_reason or "",
        ticket_status=verdict.ticket_status,
        offline=offline,
        source=source,
        scanned_at=scanned_at,
        recorded_at=timezone.now(),
    )
    return verdict


def record_reconciled_scan(
    session: DoorSession, payload: dict, *, scanned_at
) -> tuple[DoorVerdict | None, bool]:
    """Merge one offline-ledger entry (W3). Returns (verdict, replayed).

    Replays are detected by the reconcile unique constraint — an entry with
    the same (session, ticket, scanned_at) that already merged is skipped,
    so re-sent ledgers (new Idempotency-Key, same scans) never double-record.
    Duplicate check-ins resolve by server timestamp: whichever entry the
    server records first wins; later approvals land in the duplicate path.
    """
    # Replay check covers unresolvable entries too (ticket=None): a re-sent
    # ledger carries identical device timestamps, and the constraint can't
    # guard NULL-ticket rows (NULLs compare distinct).
    ticket = _peek_ticket(payload)
    if DoorScan.objects.filter(
        session=session,
        ticket=ticket,
        scanned_at=scanned_at,
        source=DoorScanSource.RECONCILE,
    ).exists():
        return None, True

    try:
        with transaction.atomic():
            verdict = record_scan(
                session,
                payload,
                scanned_at=scanned_at,
                offline=True,
                source=DoorScanSource.RECONCILE,
            )
    except IntegrityError:
        # Two concurrent merges of the same ledger entry — the constraint
        # picked a winner; this caller's entry is the replay.
        return None, True
    return verdict, False


def _peek_ticket(payload: dict) -> Ticket | None:
    """Best-effort ticket resolution for replay detection (no verification —
    the real verdict re-verifies everything)."""
    result, _ = _resolve(payload)
    return result.ticket if result is not None else None
