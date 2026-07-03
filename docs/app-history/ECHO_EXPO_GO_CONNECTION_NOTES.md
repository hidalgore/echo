# ECHO_EXPO_GO_CONNECTION_NOTES

**Version:** v59
**Status:** Operational reference
**Scope:** How to run ECHO on Expo Go and on the web, on Windows / PowerShell, without breaking either flow.

---

## Local commands (PowerShell)

From `echo-mobile/`:

```powershell
npm install
```

### Expo Go on a real iOS / Android device

```powershell
npm run start:tunnel
```

This is identical to `npm run start:expo-go`. It runs:

```
expo start --tunnel --clear
```

Tunnel mode is the most reliable on Windows because it bypasses local-network constraints. The QR shown in the terminal works in the Expo Go app on iOS and Android.

If tunnel feels slow, you can try LAN mode:

```powershell
npm run start:lan
```

### Reset Metro cache

```powershell
npm run start:reset
```

Use this when JS bundles look stale or when adding new files isn't showing up.

### Web (the public website)

```powershell
npm run web
```

Open the URL printed in the terminal. The website renders inside React Native Web. All web routes documented in `ECHO_WEB_ROUTES_LOCK` are accessible by URL.

### Type-check

```powershell
npm run tsc
```

The baseline is locked at the 45 pre-existing tsc errors carried since v50. v59 must not increase this count.

---

## What v59 changed about Expo Go

**Nothing.** The native Expo Go flow is untouched. Every web entry point gates on `Platform.OS === 'web'` so that:

- `app/index.tsx` returns the native landing on native and `<EchoPublicWebsite />` on web.
- `app/(tabs)/wallet.tsx` returns the native wallet on native and `<WebWalletPage />` on web.
- `app/event/[id].tsx` returns the native event detail on native and `<WebEventDetailPage event={event} />` on web.
- All other `app/*` web pages (`/search`, `/trust`, `/nonprofits`, `/login`, `/verify-age`, `/host`, `/host/login`, `/host/dashboard`, `/host/create-event`, `/host/reports`, `/checkout/[id]`) return `null` on native.

If Expo Go ever fails to launch, the cause is upstream of v59 \u2014 check the babel config (Reanimated plugin must be last), check `app.json` (`"output": "static"` must remain), and check that `node_modules` is intact.

---

## Common pitfalls (Windows)

- **Stale Metro cache:** run `npm run start:reset`.
- **Tunnel timeout on first connect:** wait \~30 seconds, retry. Tunnel cold-starts the relay.
- **Web build fails with `import.meta`:** confirm `app.json` still has `"output": "static"`. Do NOT change to `single`.
- **Reanimated crash on native:** confirm Reanimated plugin is LAST in `babel.config.js`. This is a permanent project rule.
