# ECHO_WEB_ROUTES_LOCK

**Version:** v59
**Status:** Locked
**Scope:** The complete list of public web routes for ECHO. Any addition or removal must be reflected here.

---

## Public routes (no auth)

| URL | File | Notes |
|---|---|---|
| `/` | `app/index.tsx` | Homepage. Renders `<EchoPublicWebsite />` on web. |
| `/search` | `app/search.tsx` | Search + Picked for You. Locked reason labels. |
| `/event/[id]` | `app/event/[id].tsx` | Event detail. Web variant gated on `Platform.OS === 'web'`. |
| `/trust` | `app/trust.tsx` | Trust & Access. 11 pillars. |
| `/nonprofits` | `app/nonprofits.tsx` | Nonprofit support. Host-tools + reporting. |
| `/host` | `app/host/index.tsx` | Host landing. |
| `/verify-age` | `app/verify-age.tsx` | Age verification handoff. Supports `?state=success` and `?state=failure`. |

## Reservation flow

| URL | File | Notes |
|---|---|---|
| `/checkout/[id]` | `app/checkout/[id].tsx` | Web checkout. Uses `computeCheckoutFees()`. Mock payment. |
| `/wallet` | `app/(tabs)/wallet.tsx` | Wallet. Web variant gated on `Platform.OS === 'web'`. |

## Authenticated portals (mock-only auth)

| URL | File | Notes |
|---|---|---|
| `/login` | `app/login.tsx` | Attendee portal. PortalShell + EchoAccessPassPreview. |
| `/host/login` | `app/host/login.tsx` | Host portal. PortalShell + HostCommandPreview compact. |

## Host product surface

| URL | File | Notes |
|---|---|---|
| `/host/dashboard` | `app/host/dashboard.tsx` | Event health hero, KPI row, checklist, risks, payout. |
| `/host/create-event` | `app/host/create-event.tsx` | Mock event creation wizard with live preview. |
| `/host/reports` | `app/host/reports.tsx` | Event closeout, attendance, revenue, donations, export buttons. |

---

## Route resolution conventions

- **Native + web shared:** `app/event/[id].tsx` and `app/(tabs)/wallet.tsx` are the only files that contain BOTH the native screen AND a `Platform.OS === 'web'` branch at the top of the component. The web branch renders a dedicated component from `components/web/`.
- **Web-only routes:** every file under `app/host/*.tsx` (except `app/host/[id].tsx` which is the existing native host-profile detail screen) and the root-level `trust.tsx` / `nonprofits.tsx` / `login.tsx` / `verify-age.tsx` / `search.tsx` / `checkout/[id].tsx` return `null` on native via `if (Platform.OS !== 'web') return null;`.
- **Native-only files** (`app/(auth)/*`, `app/(host)/*`, `app/(tabs)/*` except wallet, `app/profile/*`, `app/circle/*`, etc.) are untouched.

## Route groups (do not collide)

- `app/(tabs)/wallet.tsx` resolves to URL `/wallet`. There is no `app/wallet.tsx` \u2014 the web variant lives inside the gate to avoid a collision.
- `app/host/[id].tsx` (native host profile) and the new web subroutes under `app/host/*` coexist because static routes win over dynamic ones in expo-router.
- `app/checkout/choose-payment.tsx` and `app/checkout/single-checkout.tsx` (native flow) win over `app/checkout/[id].tsx` (web) for their static paths. `app/checkout/[id].tsx` only matches `/checkout/<anything-else>`.

## Do not add a route without

1. Adding it to this doc.
2. Gating it on `Platform.OS === 'web'` if it is web-only.
3. Linking it from at least one CTA in `WebNav`, `WebFooter`, or a parent page.
