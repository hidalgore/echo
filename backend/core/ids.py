"""
Identifier utilities (locked platform rule).

- `echo_id`: UUIDv7 (RFC 9562) — internal immutable primary keys, time-ordered
  so b-tree inserts stay append-mostly.
- `public_id`: Crockford Base32 with a trailing check symbol — the only id
  shown to humans (Settings/Support). Never used as a database key.

Python 3.13 has no uuid.uuid7; this is a direct RFC 9562 implementation with
cryptographic randomness rather than a dependency.
"""

import secrets
import time
import uuid

# ─── UUIDv7 ──────────────────────────────────────────────────────────────────

_last_v7_state: tuple[int, int] | None = None  # (unix_ts_ms, rand_a) for monotonicity


def uuid7() -> uuid.UUID:
    """RFC 9562 UUIDv7: 48-bit unix-ms timestamp, 74 bits of randomness.

    Within a single process, same-millisecond calls increment the 12-bit
    rand_a field so ids remain monotonically sortable.
    """
    global _last_v7_state

    ts_ms = time.time_ns() // 1_000_000
    rand_a = secrets.randbits(12)

    if _last_v7_state is not None:
        last_ts, last_rand_a = _last_v7_state
        if ts_ms < last_ts:
            # Clock went backwards; keep ordering by reusing the last timestamp.
            ts_ms = last_ts
        if ts_ms == last_ts:
            rand_a = (last_rand_a + 1) & 0xFFF
            if rand_a == 0:
                # rand_a overflow within the same millisecond: bump the timestamp.
                ts_ms += 1
    _last_v7_state = (ts_ms, rand_a)

    rand_b = secrets.randbits(62)

    value = (
        ((ts_ms & 0xFFFF_FFFF_FFFF) << 80)
        | (0x7 << 76)          # version 7
        | (rand_a << 64)
        | (0b10 << 62)         # RFC 4122/9562 variant
        | rand_b
    )
    return uuid.UUID(int=value)


# ─── Crockford Base32 with check symbol ──────────────────────────────────────

_CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
_CROCKFORD_CHECK_ALPHABET = _CROCKFORD_ALPHABET + "*~$=U"  # mod-37 check symbols
_DECODE_MAP = {char: index for index, char in enumerate(_CROCKFORD_ALPHABET)}
# Crockford decoding treats easily-confused glyphs as their canonical digit.
_DECODE_MAP.update({"O": 0, "I": 1, "L": 1})
_CHECK_MODULUS = 37


def crockford_encode(value: int) -> str:
    """Encode a non-negative integer as Crockford Base32 + check symbol."""
    if value < 0:
        raise ValueError("crockford_encode requires a non-negative integer")
    digits = ""
    remaining = value
    while True:
        digits = _CROCKFORD_ALPHABET[remaining & 0x1F] + digits
        remaining >>= 5
        if remaining == 0:
            break
    check = _CROCKFORD_CHECK_ALPHABET[value % _CHECK_MODULUS]
    return digits + check


def crockford_decode(encoded: str) -> int:
    """Decode a Crockford Base32 string (with check symbol). Raises ValueError
    on bad symbols or a checksum mismatch."""
    if len(encoded) < 2:
        raise ValueError("encoded value too short")
    normalized = encoded.strip().upper().replace("-", "")
    body, check_char = normalized[:-1], normalized[-1]

    value = 0
    for char in body:
        if char not in _DECODE_MAP:
            raise ValueError(f"invalid Crockford Base32 symbol: {char!r}")
        value = (value << 5) | _DECODE_MAP[char]

    expected_check = _CROCKFORD_CHECK_ALPHABET[value % _CHECK_MODULUS]
    if check_char != expected_check:
        raise ValueError("checksum mismatch")
    return value


def new_public_id(prefix: str = "") -> str:
    """Mint a display-only public id, e.g. ``EV-4S9M2KQ...X`` (64 random bits).

    64 bits keeps ids short enough to read to support staff while leaving
    collision probability negligible at ECHO's scale; uniqueness is still
    enforced by the owning table's unique constraint.
    """
    value = secrets.randbits(64)
    encoded = crockford_encode(value)
    return f"{prefix}-{encoded}" if prefix else encoded


def is_valid_public_id(candidate: str, prefix: str = "") -> bool:
    body = candidate
    if prefix:
        if not candidate.startswith(f"{prefix}-"):
            return False
        body = candidate[len(prefix) + 1 :]
    try:
        crockford_decode(body)
    except ValueError:
        return False
    return True
