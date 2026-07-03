# ECHO_PUBLIC_WEBSITE_V57_LOCK

**Version:** v57 baseline (carried + extended through v58 and v59)
**Status:** Locked
**Scope:** The original baseline for the ECHO public website inside the Expo / React Native Web project. v59 extends this without changing the contract.

---

## v57 baseline (what was true before v59)

- The website renders inside the Expo project via React Native Web. The same TypeScript codebase serves the native app and the web layer.
- The single source of truth for "open the homepage on web" is `app/index.tsx`. On native it shows the native landing; on web it returns the public website tree.
- All web content is theme-aware via `theme/brand.ts`. The dark charcoal canvas `#06060A` is the locked background.
- Mock data lives in `services/webPlatformMock.ts`. Web pages must read events through `getPublicWebEvents()` and price labels through `getWebTicketPriceLabel()`. No web page may bypass the mock layer to reach native stores directly.
- Web preview was originally a one-off route at `app/web-v2-preview.tsx`. In v59 that file was reduced to an alias of `<EchoPublicWebsite />` so there is one canonical homepage tree.

## What v59 extended

- Added 14 distinct routes (see `ECHO_WEB_ROUTES_LOCK`).
- Added 14 shared components (see `ECHO_WEB_COMPONENTS_V57_LOCK`).
- Added two web-variant pages (`WebWalletPage`, `WebEventDetailPage`) gated by `Platform.OS === 'web'` inside their native counterparts.
- Locked positioning: host-first, NOT nonprofit-first.

## What did NOT change

- `app.json` `"output": "static"` (locked since v50). Prevents `import.meta` errors on the web build.
- Reanimated plugin position in Babel config (must be last \u2014 permanent rule).
- Native Expo Go flow (start \u2192 sign-in \u2192 native tabs). Unchanged.
- Profile screens (`app/(tabs)/profile.tsx`, `app/profile/*`, `app/(host)/(tabs)/profile.tsx`). Protected; untouched.
- The 45-error tsc baseline locked at v50.

## Where to extend next

- Real wallet pass issuance and real Stripe integration replace the SWAP-POINTs in `WebWalletPage` and `app/checkout/[id].tsx`.
- A real reporting feed replaces the mock data in `app/host/reports.tsx`.
- A real auth + session layer replaces the mock `PortalShell` flow.
