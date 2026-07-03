import uuid

from core.ids import (
    crockford_decode,
    crockford_encode,
    is_valid_public_id,
    new_public_id,
    uuid7,
)


class TestUuid7:
    def test_version_and_variant_bits(self):
        value = uuid7()
        assert value.version == 7
        assert value.variant == uuid.RFC_4122

    def test_time_ordering(self):
        ids = [uuid7() for _ in range(500)]
        assert ids == sorted(ids), "uuid7 ids must be monotonically sortable in-process"

    def test_uniqueness(self):
        ids = {uuid7() for _ in range(5000)}
        assert len(ids) == 5000


class TestCrockford:
    def test_round_trip(self):
        for value in (0, 1, 31, 32, 12345, 2**64 - 1):
            assert crockford_decode(crockford_encode(value)) == value

    def test_checksum_rejects_corruption(self):
        encoded = crockford_encode(123456789)
        corrupted = ("0" if encoded[0] != "0" else "1") + encoded[1:]
        try:
            crockford_decode(corrupted)
        except ValueError:
            pass
        else:
            raise AssertionError("corrupted value should fail checksum")

    def test_confusable_symbols_decode(self):
        encoded = crockford_encode(12345)
        aliased = encoded.replace("1", "I") if "1" in encoded[:-1] else encoded
        assert crockford_decode(aliased) == 12345

    def test_rejects_invalid_symbol(self):
        try:
            crockford_decode("AU!X")
        except ValueError:
            pass
        else:
            raise AssertionError("invalid symbol should raise")


class TestPublicId:
    def test_prefix_and_validity(self):
        public_id = new_public_id("EV")
        assert public_id.startswith("EV-")
        assert is_valid_public_id(public_id, "EV")
        assert not is_valid_public_id(public_id, "TK")

    def test_corruption_detected(self):
        public_id = new_public_id()
        corrupted = ("0" if public_id[0] != "0" else "1") + public_id[1:]
        assert not is_valid_public_id(corrupted)

    def test_uniqueness_sample(self):
        assert len({new_public_id() for _ in range(1000)}) == 1000
