"""Wire serializers for S-01 (auth/session) and S-02 (me) — snake_case,
matching the DTO conventions in frontend/types/api/."""

import re

from rest_framework import serializers

from identity.models import Device, User

_INSTALL_ID_RE = re.compile(r"^[A-Za-z0-9._-]{8,64}$")
_FLAG_KEY_RE = re.compile(r"^[a-z0-9][a-z0-9_.:-]{0,63}$")
MAX_FLAGS = 50
MAX_FLAG_STRING = 256


class DeviceInSerializer(serializers.Serializer):
    install_id = serializers.CharField()
    platform = serializers.ChoiceField(choices=[p for p, _ in Device.PLATFORMS])
    os_version = serializers.CharField(required=False, allow_blank=True, max_length=64)
    model = serializers.CharField(required=False, allow_blank=True, max_length=128)
    app_version = serializers.CharField(required=False, allow_blank=True, max_length=32)

    def validate_install_id(self, value: str) -> str:
        if not _INSTALL_ID_RE.match(value):
            raise serializers.ValidationError(
                "install_id must be 8-64 characters of [A-Za-z0-9._-]."
            )
        return value


class ProviderAuthRequestSerializer(serializers.Serializer):
    identity_token = serializers.CharField(max_length=8192, trim_whitespace=True)
    # Apple only exposes the user's name to the client on FIRST auth and never
    # puts it in the identity token — the client forwards it here.
    name = serializers.CharField(required=False, allow_blank=True, max_length=200)
    device = DeviceInSerializer()


class GuestSessionRequestSerializer(serializers.Serializer):
    device = DeviceInSerializer()


class RefreshRequestSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(max_length=128, trim_whitespace=True)


class LogoutRequestSerializer(serializers.Serializer):
    # Optional: the bearer token already names the session family; a supplied
    # refresh token lets a client with a stale access token still log out.
    refresh_token = serializers.CharField(required=False, allow_blank=True, max_length=128)


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["echo_id", "public_id", "email", "name", "phone", "avatar_url", "flags", "created_at"]
        read_only_fields = ["echo_id", "public_id", "email", "flags", "created_at"]


class MeUpdateSerializer(serializers.ModelSerializer):
    """PATCH /v1/me — profile fields only. Email is provider-owned; flags go
    through POST /v1/me/flags."""

    class Meta:
        model = User
        fields = ["name", "phone", "avatar_url"]
        extra_kwargs = {
            "name": {"required": False},
            "phone": {"required": False},
            "avatar_url": {"required": False},
        }


class FlagsRequestSerializer(serializers.Serializer):
    flags = serializers.DictField(allow_empty=False)

    def validate_flags(self, flags: dict) -> dict:
        for key, value in flags.items():
            if not isinstance(key, str) or not _FLAG_KEY_RE.match(key):
                raise serializers.ValidationError(
                    f"flag key {key!r} must match [a-z0-9][a-z0-9_.:-]{{0,63}}."
                )
            if isinstance(value, str):
                if len(value) > MAX_FLAG_STRING:
                    raise serializers.ValidationError(
                        f"flag {key!r}: string values are capped at {MAX_FLAG_STRING} characters."
                    )
            elif not isinstance(value, (bool, int, float)) and value is not None:
                raise serializers.ValidationError(
                    f"flag {key!r}: values must be boolean, number, string, or null (null deletes)."
                )
        return flags
