"""
Identity flows (Phase 1 / W1): create-or-attach on provider sign-in, device
upsert, session issuance. Views stay thin; every flow audits.
"""

from django.db import transaction
from django.utils import timezone

from audit import service as audit
from identity import tokens
from identity.models import Device, User
from identity.verifiers import VerifiedIdentity


def upsert_device(device_in: dict, user: User | None) -> Device:
    """One Device row per install_id. Sign-in reattaches the install to the
    signing-in account; guest flows leave any existing owner in place."""
    device, created = Device.objects.get_or_create(
        install_id=device_in["install_id"],
        defaults={
            "user": user,
            "platform": device_in["platform"],
            "os_version": device_in.get("os_version", ""),
            "model": device_in.get("model", ""),
            "app_version": device_in.get("app_version", ""),
        },
    )
    update_fields = ["last_seen_at", "updated_at"]
    device.last_seen_at = timezone.now()
    if not created:
        for field in ("platform", "os_version", "model", "app_version"):
            value = device_in.get(field)
            if value and getattr(device, field) != value:
                setattr(device, field, value)
                update_fields.append(field)
    if user is not None and device.user_id != user.pk:
        device.user = user
        update_fields.append("user")
    device.save(update_fields=update_fields if not created else None)
    return device


@transaction.atomic
def login_with_identity(
    identity: VerifiedIdentity, device_in: dict, *, fallback_name: str = "", request=None
) -> tuple[tokens.TokenPair, User, bool]:
    """Create-or-attach the user for a verified Apple/Google identity, bind
    the device, revoke the install's previous sessions, issue a fresh pair.

    Returns (pair, user, is_new_user).
    """
    sub_field = f"{identity.provider}_sub"
    created = False

    user = User.objects.filter(**{sub_field: identity.subject}).first()
    if user is None and identity.email:
        # Same human arriving via their other provider: attach, don't duplicate.
        user = User.objects.filter(email__iexact=identity.email).first()
        if user is not None:
            setattr(user, sub_field, identity.subject)
            user.save(update_fields=[sub_field, "updated_at"])
    if user is None:
        user = User.objects.create_user(
            email=identity.email,
            name=(fallback_name or identity.name or "").strip()[:200],
            **{sub_field: identity.subject},
        )
        created = True
    elif not user.name and (fallback_name or identity.name):
        user.name = (fallback_name or identity.name or "").strip()[:200]
        user.save(update_fields=["name", "updated_at"])

    device = upsert_device(device_in, user)
    # A fresh sign-in owns the install: any session minted for this device
    # before now (previous account, stale guest) is dead.
    revoked = tokens.revoke_all_for_device(device)

    pair = tokens.issue_pair(user=user, device=device, scope="user")
    audit.record(
        "auth.login",
        request=request,
        actor=user,
        device_id=device.echo_id,
        target=("user", user.echo_id),
        metadata={"provider": identity.provider, "is_new_user": created, "revoked_sessions": revoked},
    )
    return pair, user, created


def start_guest_session(device_in: dict, *, request=None) -> tokens.TokenPair:
    device = upsert_device(device_in, user=None)
    pair = tokens.issue_pair(user=None, device=device, scope="guest")
    audit.record(
        "auth.guest_session",
        request=request,
        device_id=device.echo_id,
        target=("device", device.echo_id),
    )
    return pair
