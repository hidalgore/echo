"""
Offline door bundles (Phase 5 / W3).

A bundle is the pre-signed credential cache one door device needs to produce
the SAME verdicts offline that the server would produce online: the Ed25519
public verification key (never any secret material — the Phase 4 design
reason for Ed25519) plus a per-admission snapshot of the session's event.

What offline relaxes — explicitly, by construction (documented in the bundle
itself so device firmware and audits read the same truth):

- `rotating_nonce_freshness`: the server refuses a rotating credential whose
  nonce was superseded; a device without connectivity cannot know the current
  nonce. Offline verification therefore checks signature + expiry (with the
  same leeway) + snapshot status, but NOT nonce freshness. Reconciliation
  (`POST /v1/door/reconcile`) re-derives server truth for every offline scan
  afterwards — that is the recovery path, not an afterthought.

Everything else is NOT relaxed: signatures still verify against the public
key, `typ=pkpass` barcodes still carry event-end expiry, snapshot status
still refuses revoked/expired/transferred tickets, and zone/age rules ride
the snapshot fields.

The format is versioned: devices refuse bundles whose `format_version` they
don't understand rather than guessing.
"""

from django.conf import settings
from django.utils import timezone

from door.access import DEFAULT_ACCESS_TIER, tier_zones
from door.models import DoorSession
from events.serializers import age_badge
from tickets import credentials
from tickets.models import Ticket, TicketCredential

BUNDLE_FORMAT_VERSION = 1
RELAXATIONS = ("rotating_nonce_freshness",)


def build_offline_bundle(session: DoorSession) -> dict:
    """Assemble the bundle for the session's event.

    Raises credentials.CredentialSigningNotConfigured when the environment
    has no signing key (fail closed — an offline bundle without a
    verification key would be a serial-list, which is the disallowed mode).
    """
    public_key_pem = credentials.signing_public_key_pem()

    event = session.event
    badge = age_badge(event.age_restriction)

    # One query for the admissions, one for the current NFC ids: the bundle
    # ships the *current* rotation identifier so offline NFC lookups keep
    # working (freshness is the documented relaxation).
    tickets = Ticket.objects.filter(event=event).select_related("tier").order_by("pk")
    nfc_ids = dict(
        TicketCredential.objects.filter(ticket__event=event).values_list(
            "ticket_id", "nfc_credential_id"
        )
    )

    admissions = []
    for ticket in tickets.iterator():
        access_tier = ticket.tier.access_tier or DEFAULT_ACCESS_TIER
        admissions.append(
            {
                "ticket_id": str(ticket.echo_id),
                "nfc_credential_id": nfc_ids.get(ticket.echo_id),
                "status": ticket.status,
                "tier_id": access_tier,
                "age_badge": badge,
                "authorized_zones": list(tier_zones(access_tier)),
            }
        )

    return {
        "format_version": BUNDLE_FORMAT_VERSION,
        "generated_at": timezone.now().isoformat(),
        "session_id": str(session.echo_id),
        "event_id": str(event.echo_id),
        "zone": session.zone,
        "signing_public_key_pem": public_key_pem,
        "qr_payload_prefix": credentials.QR_PAYLOAD_PREFIX,
        "scan_leeway_seconds": settings.ECHO_DOOR_SCAN_LEEWAY_SECONDS,
        "duplicate_window_seconds": settings.ECHO_DOOR_DUPLICATE_WINDOW_SECONDS,
        "relaxations": list(RELAXATIONS),
        "admissions": admissions,
    }
