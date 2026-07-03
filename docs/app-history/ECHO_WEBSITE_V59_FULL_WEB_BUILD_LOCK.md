# ECHO_WEBSITE_V59_FULL_WEB_BUILD_LOCK

**Version:** v59
**Status:** Locked
**Scope:** Full public ECHO website built inside the existing Expo / React Native Web project. Native Expo Go flow preserved. All mock data preserved.

---

## What was built in v59

A complete flagship public website for ECHO, rendered via React Native Web when `Platform.OS === 'web'`. The native mobile app is untouched: every web entry point gates on `Platform.OS === 'web'` before rendering, and the existing native flow runs below those gates.

### 14 routes shipped

| Route | File | Purpose |
|---|---|---|
| `/` | `app/index.tsx` | Flagship homepage (`<EchoPublicWebsite />`) |
| `/search` | `app/search.tsx` | ECHO Search + Picked for You |
| `/event/[id]` | `app/event/[id].tsx` | Event detail (web variant via gate) |
| `/checkout/[id]` | `app/checkout/[id].tsx` | Reservation flow using `computeCheckoutFees()` |
| `/wallet` | `app/(tabs)/wallet.tsx` | Wallet (web variant via gate) |
| `/login` | `app/login.tsx` | Attendee portal |
| `/host` | `app/host/index.tsx` | Host landing |
| `/host/login` | `app/host/login.tsx` | Host portal |
| `/host/dashboard` | `app/host/dashboard.tsx` | Host command center |
| `/host/create-event` | `app/host/create-event.tsx` | Event creation wizard (mock) |
| `/host/reports` | `app/host/reports.tsx` | Event closeout & reports |
| `/trust` | `app/trust.tsx` | Trust & Access |
| `/nonprofits` | `app/nonprofits.tsx` | Nonprofit support |
| `/verify-age` | `app/verify-age.tsx` | Age verification handoff |

### 14 shared web components

Located in `components/web/`:

- `WebShell.tsx` — charcoal canvas, ambient blur blobs
- `WebSection.tsx` — max-width container with eyebrow / title / description
- `WebNav.tsx` — pill nav + mobile hamburger drawer
- `WebFooter.tsx` — 5-column footer + trust strip
- `WebCTA.tsx` — primary / solid / secondary / ghost button variants
- `WebTrustStrip.tsx` — trust badge row
- `EventCardWeb.tsx` — editorial event card (lg / md / sm)
- `EchoAccessPassPreview.tsx` — pass visual with optional flyer background
- `EchoCirclePreview.tsx` — Circle slot ring + 1-hour timer pill
- `HostCommandPreview.tsx` — host dashboard browser-frame mock
- `PortalShell.tsx` — login portal layout with side panel
- `EchoPublicWebsite.tsx` — flagship homepage
- `WebWalletPage.tsx` — web variant of wallet
- `WebEventDetailPage.tsx` — web variant of event detail

### Native files modified (minimal gates only)

- `app/(tabs)/wallet.tsx` — single Platform.OS web branch at top of `WalletScreen()` returns `<WebWalletPage />`. Native code path below is untouched.
- `app/event/[id].tsx` — single Platform.OS web branch at top of `EventDetailScreen()` returns `<WebEventDetailPage event={event} />`. Native code path below is untouched.
- `app/index.tsx` — already gated in v58 to render `<EchoPublicWebsite />` on web.
- `app/web-v2-preview.tsx` — collapsed to a 19-line alias of `<EchoPublicWebsite />`.

### Locked positioning

- **Host-first** \u2014 NOT nonprofit-first. Nonprofits is a supported host type, surfaced at `/nonprofits`.
- **Homepage headline:** "The flagship access platform for hosts who want the room to feel premium."
- **Primary CTA:** "Start Hosting" \u2192 `/host/login`. **Secondary:** "Explore Events" \u2192 `/search`.
- **Reservation language:** "Reserve Access" everywhere checkout is initiated. Never "Buy Ticket."
- **Picked for You** is calm. Only 6 allowed reason labels (see `app/search.tsx` `PICKED_REASONS`). No "we watched you" / "12 seconds" language.
- **Age verification BEFORE payment** for restricted events. Locked copy on `/trust`, `/verify-age`, `/checkout/[id]`, `/host/create-event`.
- **ECHO Circle:** leader pays first, then invites. 1-hour timer.
- **ECHO Access Pass:** background uses next event's flyer if a ticket is reserved, else falls back to charcoal. NFC-first, QR fallback.
- **Fees:** all checkout paths use `computeCheckoutFees()` from `services/pricingEngine.ts`. 5% platform + 2.9% + $0.30 processing, tax separate, label "Service & processing fee."
- **No emoji** anywhere in UI.

---

## What this v59 build is NOT

- **Not real payment.** `/checkout/[id]` is mock-only; "Complete Reservation" simulates success and routes to `/wallet`. Stripe wiring is a SWAP-POINT.
- **Not real age verification.** `/verify-age` shows a polished MVP shell with a QR placeholder and SMS/email link buttons. Real ID-verification provider (e.g. Persona, Veriff) is a SWAP-POINT.
- **Not real auth.** `/login` and `/host/login` are mock portals using shared `PortalShell`. Real auth provider is a SWAP-POINT.
- **Not real wallet pass generation.** The pass preview in `EchoAccessPassPreview` is visual only. Apple Wallet PassKit + Google Wallet generation is a SWAP-POINT.
- **Not real reporting.** `/host/reports` data is mock. Real analytics + CSV/PDF export is a SWAP-POINT.

---

## What must not drift

- **Reanimated plugin must stay last in Babel config.** Permanent project rule.
- **`app.json` `"output": "static"`** must stay locked. Prevents `import.meta` errors on web build.
- **No `c.xxx` dynamic theme tokens inside `StyleSheet.create()`.** All web components use `brand.xxx` hex strings directly. Theme tokens go inline only.
- **Mock data layer:** all web pages read from `services/webPlatformMock.ts` (`getPublicWebEvents`, `getWebTicketPriceLabel`). Do not bypass this layer.
- **`Platform.OS === 'web'` gates** at top of files like `app/(tabs)/wallet.tsx` and `app/event/[id].tsx` are the contract that keeps native untouched. Do not remove.
- **Profile screens (`app/(tabs)/profile.tsx`, `app/profile/*`, `app/(host)/(tabs)/profile.tsx`) were not touched.** They remain protected per their own lock doc.

---

## How to run

PowerShell on Windows, from `echo-mobile/`:

```powershell
npm install
npm run web         # open the website in a browser
npm run start:tunnel # Expo Go on iOS / Android over tunnel
npm run tsc          # type-check (baseline locked at 45 pre-existing errors)
```

---

## SWAP-POINTs (web-side, ordered by priority)

1. Real payment intent + Stripe Elements in `app/checkout/[id].tsx`.
2. Real ID verification provider in `app/verify-age.tsx`.
3. Real auth in `app/login.tsx` and `app/host/login.tsx` (via `PortalShell`).
4. Real Apple Wallet / Google Wallet pass issuance in `WebWalletPage.tsx` and `EchoAccessPassPreview.tsx`.
5. Real analytics + CSV/PDF export in `app/host/reports.tsx`.
6. Real event create/publish persistence in `app/host/create-event.tsx`.
7. Real host dashboard data feed in `app/host/dashboard.tsx`.
