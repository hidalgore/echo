# ECHO_WEB_ROUTES_V57_LOCK

**Version:** v57 baseline
**Status:** Locked (superseded in scope by `ECHO_WEB_ROUTES_LOCK` for v59)
**Scope:** The original set of web routes from v57 before the full v59 buildout.

---

## v57 web routes (baseline)

| URL | File | Notes |
|---|---|---|
| `/` | `app/index.tsx` | Gates on `Platform.OS === 'web'` to render `<EchoPublicWebsite />`. |
| `/web-v2-preview` | `app/web-v2-preview.tsx` | Original web preview entry. In v59 reduced to an alias of `<EchoPublicWebsite />`. |

## v57 contract that still holds

- The web layer must never break the Expo Go native flow.
- Every web-only page must gate on `Platform.OS === 'web'`.
- Web pages must read data via `services/webPlatformMock.ts`.
- No web page is permitted to mutate native stores (`useEventStore`, `useTicketStore`, etc.) on the web side; reads are fine, writes are not.

## What v59 added

See `ECHO_WEB_ROUTES_LOCK.md` for the full v59 route table. v59 strictly extends v57 \u2014 nothing in v57 was removed.
