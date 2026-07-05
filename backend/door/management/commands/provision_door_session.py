"""
Provision a door session + door-scoped token pair (Phase 5 / W1).

This is the Phase 5 provisioning seam: the locked v1.0 registry has no
session-creation POST, host provisioning tooling is Phase 7, and a door
device becoming trusted is an operator action until then. The command
creates the device row, the session (with its hashed pause/resume passcode),
and a door-scoped token pair via the existing identity.tokens machinery —
printed ONCE, never stored in plaintext.

    manage.py provision_door_session --event <event echo_id> \
        [--zone main_entry] [--label "North door"] [--passcode 123456] \
        [--ttl-hours 24] [--platform ios]

Omitting --passcode generates one. The refresh token rotates through the
standard /v1/auth/refresh flow, so a long-running door post outlives the
15-minute access token without re-provisioning.
"""

import secrets
import uuid
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from audit import service as audit
from door.access import ZONES
from door.models import DoorSession
from events.models import Event
from identity.models import Device
from identity.tokens import issue_pair


class Command(BaseCommand):
    help = "Provision a door session: device row + hashed passcode + door-scoped tokens."

    def add_arguments(self, parser):
        parser.add_argument("--event", required=True, help="Event echo_id the door scans for.")
        parser.add_argument("--zone", default="main_entry", choices=sorted(ZONES))
        parser.add_argument("--label", default="", help='Operator label, e.g. "North door".')
        parser.add_argument(
            "--passcode", default="", help="6-digit pause/resume passcode (generated if omitted)."
        )
        parser.add_argument(
            "--ttl-hours",
            type=int,
            default=None,
            help="Session lifetime in hours (default: until 6h after the event ends).",
        )
        parser.add_argument("--platform", default="ios", choices=["ios", "android", "web"])

    def handle(self, *args, **options):
        try:
            event = Event.objects.get(echo_id=uuid.UUID(options["event"]))
        except (ValueError, Event.DoesNotExist):
            raise CommandError(f"Unknown event: {options['event']}") from None

        passcode = options["passcode"] or f"{secrets.randbelow(10**6):06d}"
        if not (passcode.isdigit() and len(passcode) == 6):
            raise CommandError("--passcode must be exactly 6 digits.")

        if options["ttl_hours"] is not None:
            expires_at = timezone.now() + timedelta(hours=options["ttl_hours"])
        else:
            expires_at = event.ends_at + timedelta(hours=6)
        if expires_at <= timezone.now():
            raise CommandError(
                "Session would already be expired (event has ended) — pass --ttl-hours."
            )

        device = Device.objects.create(
            install_id=f"door_{secrets.token_urlsafe(24)}",
            platform=options["platform"],
        )
        session = DoorSession.objects.create(
            event=event,
            device=device,
            label=options["label"],
            zone=options["zone"],
            passcode_hash=make_password(passcode),
            expires_at=expires_at,
        )
        pair = issue_pair(user=None, device=device, scope="door")

        audit.record(
            "door.session_provisioned",
            device_id=device.echo_id,
            target=("door_session", str(session.echo_id)),
            metadata={
                "event_id": str(event.echo_id),
                "zone": session.zone,
                "label": session.label,
                "expires_at": expires_at.isoformat(),
            },
        )

        self.stdout.write(self.style.SUCCESS("Door session provisioned."))
        self.stdout.write(f"  session_id:    {session.echo_id}")
        self.stdout.write(f"  event:         {event.title} ({event.echo_id})")
        self.stdout.write(f"  zone:          {session.zone}")
        self.stdout.write(f"  expires_at:    {expires_at.isoformat()}")
        self.stdout.write(f"  passcode:      {passcode}   (shown once; stored hashed)")
        self.stdout.write(f"  access_token:  {pair.access_token}")
        self.stdout.write(f"  refresh_token: {pair.refresh_token}   (shown once; stored hashed)")
