# ECHO Mobile App v11.1 — Ultra Elite Upgrade

This package upgrades the attached ECHO frontend spec into a stricter, more canonical mobile foundation.

## What was upgraded

- Locked a stronger ECHO premium token layer in `theme/tokens.ts`
- Added event-state utility logic in `utils/event.ts`
- Enforced ECHO save rules:
  - expired events cannot be saved
  - already-purchased events cannot be saved
  - saved events remain visible in Wallet until event start
- Upgraded `eventStore` with:
  - happening now rail
  - trending rail
  - upcoming rail
  - richer search
- Upgraded `ticketStore` with selectors and purchase-awareness
- Upgraded Home header to match ECHO role-switch structure
- Upgraded event cards with save state, age pill, happening-now pill, and wallet awareness
- Upgraded Event Details screen to remove render-time state mutation and align CTA logic
- Upgraded Wallet into canonical Active / Saved / Past sections
- Preserved dark-first ECHO visual language and no-shadow restraint

## ECHO rules enforced here

- Wallet-first hierarchy
- No save for expired or already-purchased events
- Saved events auto-expire once event date passes
- Verified-host and age-gate visibility where relevant
- Host mode gated through readiness logic

## Recommended next upgrades

1. Connect real host/event APIs
2. Add canonical Host Events / Event Detail / Create Event Lite polish pass
3. Add official ECHO logo asset and replace placeholder orb
4. Add analytics + door mode shared state
5. Add stronger route guards for host / creative surfaces

## Run

```bash
npm install
npx expo start --web --clear
```


## Added in this upgrade
- Hamburger-driven mode switching between ECHO and HOST workspaces using a shared header pattern.
- Screen title remains visible beside the hamburger so users can identify their current surface at a glance.
