"""W2 — S-06 endpoint behavior: locked shapes, owner-only-as-absent, scope
enforcement, fail-closed 503, non-active refusals, wallet pagination."""

import pytest

from tickets import credentials
from tickets.models import TicketStatus


def ticket_path(ticket, suffix=""):
    return f"/v1/tickets/{ticket.echo_id}{suffix}"


@pytest.fixture(autouse=True)
def _reset_signer_cache():
    credentials._signer = None
    yield
    credentials._signer = None


# ─── GET /v1/tickets/:id ─────────────────────────────────────────────────────


def test_ticket_detail_serves_locked_dto(user_client, make_ticket):
    ticket = make_ticket()
    response = user_client.get(ticket_path(ticket))
    assert response.status_code == 200
    body = response.json()
    assert body == {
        "echo_id": str(ticket.echo_id),
        "event_id": str(ticket.event_id),
        "tier_id": str(ticket.tier_id),
        "intent_id": str(ticket.intent_id),  # flagged Phase 4 amendment
        "status": "active",
        "age_badge": "none",
        "issued_at": body["issued_at"],
    }
    assert body["issued_at"]  # ISO datetime present


def test_ticket_detail_age_badge_follows_event(user_client, make_ticket, make_intent, make_event, make_tier):
    event = make_event(age_restriction=21)
    tier = make_tier(event)
    ticket = make_ticket(intent=make_intent(event=event, tier=tier))
    assert user_client.get(ticket_path(ticket)).json()["age_badge"] == "21_plus"


def test_foreign_ticket_reads_as_absent(other_user_client, make_ticket):
    ticket = make_ticket()
    response = other_user_client.get(ticket_path(ticket))
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_malformed_id_reads_as_absent(user_client, db):
    response = user_client.get("/v1/tickets/not-a-uuid")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_guest_scope_refused(guest_client, make_ticket):
    ticket = make_ticket()
    assert guest_client.get(ticket_path(ticket)).status_code == 403


def test_anonymous_refused(client, make_ticket):
    # No bearer -> 401 unauthenticated (guest bearer -> 403; both never 404).
    ticket = make_ticket()
    assert client.get(ticket_path(ticket)).status_code == 401


# ─── GET /v1/tickets/:id/status ──────────────────────────────────────────────


def test_status_poll(user_client, make_ticket):
    ticket = make_ticket(status=TicketStatus.CHECKED_IN)
    response = user_client.get(ticket_path(ticket, "/status"))
    assert response.status_code == 200
    assert response.json() == {"ticket_id": str(ticket.echo_id), "status": "checked_in"}


def test_status_owner_only(other_user_client, make_ticket):
    ticket = make_ticket()
    assert other_user_client.get(ticket_path(ticket, "/status")).status_code == 404


# ─── GET .../credential + POST .../refresh ───────────────────────────────────


def test_credential_serves_locked_dto(signing_key, user_client, make_ticket):
    ticket = make_ticket()
    response = user_client.get(ticket_path(ticket, "/credential"))
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "ticket_id",
        "nfc_credential_id",
        "qr_payload",
        "validation_token",
        "expires_at",
    }
    assert body["ticket_id"] == str(ticket.echo_id)
    assert body["qr_payload"].startswith(credentials.QR_PAYLOAD_PREFIX)
    assert credentials.verify_validation_token(body["validation_token"]).valid


def test_credential_get_is_stable_inside_window(signing_key, user_client, make_ticket):
    ticket = make_ticket()
    first = user_client.get(ticket_path(ticket, "/credential")).json()
    second = user_client.get(ticket_path(ticket, "/credential")).json()
    assert first["validation_token"] == second["validation_token"]


def test_refresh_rotates(signing_key, user_client, make_ticket):
    ticket = make_ticket()
    first = user_client.get(ticket_path(ticket, "/credential")).json()
    rotated = user_client.post(ticket_path(ticket, "/refresh"))
    assert rotated.status_code == 200
    second = rotated.json()
    assert second["validation_token"] != first["validation_token"]
    stale = credentials.verify_validation_token(first["validation_token"])
    assert not stale.valid and stale.code == credentials.SUPERSEDED


def test_refresh_needs_no_idempotency_key(signing_key, user_client, make_ticket):
    """ticketRefresh is NOT idempotency-flagged in the locked registry —
    a bare POST must work (rotation replaying a mint is correct behavior)."""
    ticket = make_ticket()
    response = user_client.post(ticket_path(ticket, "/refresh"))
    assert response.status_code == 200


def test_credential_fails_closed_without_key(settings, user_client, make_ticket):
    settings.ECHO_CREDENTIAL_SIGNING_KEY = ""
    ticket = make_ticket()
    for method, suffix in ((user_client.get, "/credential"), (user_client.post, "/refresh")):
        response = method(ticket_path(ticket, suffix))
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "credentials_not_configured"


def test_credential_refused_for_non_active_ticket(signing_key, user_client, make_ticket):
    ticket = make_ticket(status=TicketStatus.REVOKED)
    response = user_client.get(ticket_path(ticket, "/credential"))
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ticket_not_active"
    response = user_client.post(ticket_path(ticket, "/refresh"))
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ticket_not_active"


def test_credential_owner_only(signing_key, other_user_client, make_ticket):
    ticket = make_ticket()
    assert other_user_client.get(ticket_path(ticket, "/credential")).status_code == 404
    assert other_user_client.post(ticket_path(ticket, "/refresh")).status_code == 404


def test_credential_throttle_is_per_ticket(signing_key, user_client, make_ticket, monkeypatch):
    """Hammering one ticket 429s without starving the user's other tickets."""
    # Mutate the rates dict DRF captured at import (SimpleRateThrottle holds
    # it by reference) — replacing settings.REST_FRAMEWORK is order-dependent.
    from tickets.throttling import CredentialThrottle

    monkeypatch.setitem(CredentialThrottle.THROTTLE_RATES, "credential", "3/min")
    hot = make_ticket()
    cold = make_ticket(intent=None)
    for _ in range(3):
        assert user_client.get(ticket_path(hot, "/credential")).status_code == 200
    throttled = user_client.get(ticket_path(hot, "/credential"))
    assert throttled.status_code == 429
    assert throttled.json()["error"]["code"] == "rate_limited"
    assert throttled["Retry-After"]
    # A different ticket still serves.
    assert user_client.get(ticket_path(cold, "/credential")).status_code == 200


# ─── GET /v1/wallet ──────────────────────────────────────────────────────────


def test_wallet_lists_own_admissions_only(user_client, make_ticket, other_user, make_intent):
    mine = [make_ticket(), make_ticket(intent=None)]
    make_ticket(intent=make_intent(owner=other_user))  # someone else's
    response = user_client.get("/v1/wallet")
    assert response.status_code == 200
    body = response.json()
    assert {item["echo_id"] for item in body["items"]} == {str(t.echo_id) for t in mine}
    assert "nextCursor" not in body


def test_wallet_rows_carry_intent_linkage(user_client, make_ticket, make_intent):
    """One row per admission; the flagged intent_id amendment is what lets
    the client group a quantity-3 purchase back into one card."""
    intent = make_intent(quantity=3)
    for _ in range(3):
        make_ticket(intent=intent)
    items = user_client.get("/v1/wallet").json()["items"]
    assert len(items) == 3
    assert {item["intent_id"] for item in items} == {str(intent.echo_id)}


def test_wallet_paginates_newest_first(user_client, make_ticket):
    tickets = [make_ticket(intent=None) for _ in range(3)]
    first_page = user_client.get("/v1/wallet", {"limit": 2}).json()
    assert len(first_page["items"]) == 2
    assert first_page["items"][0]["echo_id"] == str(tickets[-1].echo_id)
    second_page = user_client.get(
        "/v1/wallet", {"limit": 2, "cursor": first_page["nextCursor"]}
    ).json()
    assert [item["echo_id"] for item in second_page["items"]] == [str(tickets[0].echo_id)]


def test_wallet_requires_user_scope(guest_client, client, db):
    assert guest_client.get("/v1/wallet").status_code == 403
    assert client.get("/v1/wallet").status_code == 401


def test_wallet_empty_for_new_buyer(user_client, db):
    body = user_client.get("/v1/wallet").json()
    assert body["items"] == []
