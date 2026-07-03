# ECHO Web Root Load Fix — V58

## Issue
The website preview existed at `/web-v2-preview`, but the root route `/` still rendered the native mobile splash/auth redirect. When running `npx expo start --web` and opening the default localhost URL, the browser did not land on the website homepage.

## Fix
`app/index.tsx` now renders `app/web-v2-preview.tsx` when `Platform.OS === 'web'`. Native iOS/Android behavior remains unchanged and still uses the splash/auth routing.

## Locked behavior
- Web root `/` = public ECHO website homepage.
- Direct `/web-v2-preview` route remains available.
- Native Expo Go root = existing splash/auth flow.
- Mock data remains intact.

## How to run
```bash
npm install
npx expo start --web --clear
```

If the page still fails, copy the first red error from the browser console or the Metro terminal.
