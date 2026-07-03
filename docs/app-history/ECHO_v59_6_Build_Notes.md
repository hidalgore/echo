# ECHO v59.6 — Build Notes

Pass scope: **3 confirmed UI removals only.** The other 8 audited items
(1, 2, 3, 4, 6, 7, 8, 11) remain ON HOLD pending your "Defaults A" (or per-item
answers). No protected files were touched in this pass — `app/(tabs)/profile.tsx`
and `app/profile/*` are untouched (profile edit 2A was not yet approved).

TSC baseline target: **39 (unchanged).** All three changes are removal-only with
orphaned imports/styles cleaned, so they are TSC-neutral by construction. Please
confirm `tsc --noEmit` still reports 39 in WebStorm — I can't reproduce your full
RN type environment in this sandbox (no `node_modules` shipped).

---

## Changes

### 5A — Remove the live-pulse line under the Social Energy title
- **File:** `components/social/EnergyCard.tsx`
- Removed the `pulse` row (state dot + `LIVE_PULSE_LABEL` text) that rendered
  directly beneath the energy state title on the Event Details energy surface.
- Cleanup: dropped now-unused `LIVE_PULSE_LABEL` import and dead `pulseRow` /
  `pulseDot` / `pulseLabel` styles. `accent` is still used (waveform + gravity
  chip dots), so no other change.
- **Note / open point:** the compact `EnergyPill` (home / search / wallet cards)
  shows its pulse *inline* on a single line, not as a line under a title, so per
  the 5A wording it was left intact. Say the word if you also want the inline
  pulse stripped from the pill.

### 9A — Remove the Echo'd reflection prompt beneath past tickets
- **File:** `app/(tabs)/wallet.tsx`
- In the Past Events list, removed the `EchodPromptCard` block (and its
  `echodWrap` container) that rendered under each past ticket. Past rows now show
  only the `SmallTicketCard`.
- Cleanup: dropped the now-unused `EchodPromptCard` import and the `echodWrap`
  style key. `EchodPromptCard.tsx` itself is left in the codebase (unused now,
  reversible).

### 10A-i — Remove the three-dot options menu on the hero ticket card
- **File:** `components/wallet/ActiveTicketCard.tsx`
- Removed the top-right `ellipsis-vertical` "Ticket options" `TouchableOpacity`
  from the hero `ActiveTicketCard`. The top row now shows the status pill (left)
  and the age badge (right) only.
- `onMenuPress` was dropped from the component's prop destructure but **kept in
  the `Props` type** so the wallet call site
  (`onMenuPress={... setMenuVisible(true)}`) still type-checks. The
  `WalletTicketMenuSheet` and its state remain wired in `wallet.tsx` but are no
  longer reachable from the hero card.
- **Consequence (as flagged before you chose 10A-i):** transfer / show QR /
  add-to-calendar / directions are no longer accessible from the hero card. If
  you want those re-homed (e.g. inline buttons or a different entry point), that's
  a follow-up — say so and I'll spec it.
- Dead `menuBtn` style left in place (harmless; reversible).

---

## On hold (released by "Defaults A" or per-item answers)
1  Age-verification persistence (hydrate store from 365-day record; skip per-purchase gate; 90-day inactivity re-verify)
2A Profile green ✓ on the age-verification row — **needs explicit OK (protected file)**
3  Choose-how-to-pay header → single line beside back button
4  Social Energy tap-to-explain bottom sheet (EnergyCard + EnergyPill)
6  Apple Pay / Google Pay express checkout on Start ECHO Circle (single-checkout `circle_organizer`)
7  Circle ring fills live as friends are selected (continuous arc, pending vs claimed tint)
8  Move "What happens next" to the top of `circle/[id]`
11 Past status "Attended" → "Expired"; Upcoming cards reuse the invite-screen circle status ring

## Out-of-scope bug noticed (web only — not touched)
- `app/checkout/[id].tsx`: literal `\u2014` instead of an em-dash in the age line,
  and the age-verification block renders regardless of verified state.
