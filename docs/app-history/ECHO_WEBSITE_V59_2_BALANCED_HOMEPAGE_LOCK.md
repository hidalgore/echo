# ECHO_WEBSITE_V59_2_BALANCED_HOMEPAGE_LOCK

**Version:** v59.2
**Status:** Locked and canonical
**Supersedes:** `ECHO_WEBSITE_V58_HOST_FIRST_HOMEPAGE_LOCK.md` (deprecated)
**Scope:** The public homepage at `/` is balanced between attendees and hosts. "ECHO Access" is the formal product line. The homepage is informative about what ECHO Access *is*, presented at an editorial / "ultra elite" tier.

---

## Two-round Q&A decisions (locked)

| ID | Decision |
|---|---|
| Q1 = 1A | **Hero:** unified, one H1, two equal-weight CTAs |
| Q2 = 2B | **Brand:** "ECHO Access" is the product line |
| Q3 = 3A | **Body arc:** alternating attendee / host bands |
| Q4 = 4A | **H1:** "ECHO Access is the premium platform for events that feel as good as they look." |
| Q5 = 5A | **CTA pair:** "Explore Events" / "Become a Host" |
| Q6 = 6C | **Intro section:** side-by-side editorial prose + ECHO Access Pass mockup |

## Locked section arc (10 bands, exact order)

1. **Hero** \u2014 unified, one H1, two equal CTAs, trust strip below.
2. **What is ECHO Access** \u2014 side-by-side editorial prose + Access Pass mockup.
3. **Attendee:** The Access Pass.
4. **Host:** Run the door (Door Mode, NFC + QR fallback).
5. **Attendee:** Find events you\u2019ll feel (search + Picked for You, calm).
6. **Host:** Premium event pages + checkout.
7. **Attendee:** Going as a group (ECHO Circle).
8. **Host:** Closeout that closes the loop.
9. **Shared:** Trust pillars (six commitments).
10. **Closing CTA** \u2014 unified, two equal CTAs.

Alternating bands lay out as image-right (attendee bands) and image-left (host bands) to create rhythm. On compact viewports (<880px) every band stacks text-then-visual.

## Locked H1 + CTAs

- **H1:** "ECHO Access is the premium platform for events that feel as good as they look."
- **Sub:** "Wallet-ready passes. NFC-first entry. Verified hosts. Calm checkout. Built around how a trusted door actually runs \u2014 for the people walking in, and the people running the room."
- **Primary CTA:** "Explore Events" \u2192 `/search`
- **Secondary CTA:** "Become a Host" \u2192 `/host`
- Both CTAs are the same `size="lg"`. They render side-by-side on wide viewports and stack on narrow viewports. Neither is visually de-emphasized.

## Locked trust pillars (six commitments, exact order)

1. **Verified hosts** \u2014 every host reviewed before they can publish.
2. **Secure checkout** \u2014 PCI-compliant processor; card details never touch ECHO servers.
3. **Age verification before payment** \u2014 compliance handled before the charge, not at the door.
4. **NFC-first entry** \u2014 tap to enter; doors move calmly.
5. **QR fallback** \u2014 same pass, two entry methods.
6. **Donation transparency** \u2014 cause + amount + routing visible before confirm.

## Locked navigation copy

- Top nav: `Explore` / `For Hosts` / `Trust & Access` / `Nonprofits` plus `Sign In` and `Become a Host` (primary).
- Footer columns: **For Attendees** / **For Hosts** / **Trust** / **Nonprofit** / **Portals**.

## Visual treatment rules

- Editorial typography: H1 at 60px desktop / 36px narrow. H2 at 40px desktop / 28px narrow.
- Generous vertical rhythm: hero `paddingVertical: 120` desktop, `72` narrow. Inner sections use the `WebSection` default cadence.
- The hero, side-by-side intro, every band, and the closing CTA all live inside the same color contract: charcoal `#06060A` canvas, `rgba(255,255,255,0.03)` surfaces, `rgba(255,255,255,0.06)` borders, `brand.primary` (#7B4DFF) gradient anchor, `brand.cyanAccessible` (#7DDDFF) accent.
- All visual proof in alternating bands renders as a "browser-frame" mock (`mockBrowser`) or one of the existing previews (`EchoAccessPassPreview`, `EchoCirclePreview`, `HostCommandPreview`). No real photography or third-party logos.
- No emoji. No HTML `<form>` tags. Only `brand.xxx` hex values inside `StyleSheet.create()`.

## What did NOT change

- All other web routes (`/search`, `/event/[id]`, `/checkout/[id]`, `/wallet`, `/login`, `/host`, `/host/login`, `/host/dashboard`, `/host/create-event`, `/host/reports`, `/trust`, `/nonprofits`, `/verify-age`) are intact and locked per v59.
- All native screens are untouched (Expo Go flow preserved). `Platform.OS === 'web'` gates remain in `app/(tabs)/wallet.tsx` and `app/event/[id].tsx`.
- `services/checkoutIntentService.ts` and `components/web/StripePaymentBlock.tsx` from the v59.1 Stripe scaffold are present but **not yet wired** into `app/checkout/[id].tsx`. That wiring is a future SWAP-POINT pass.
- `app.json` `"output": "static"` locked. Reanimated plugin position locked.
- Profile screens protected.
- Fee model: `computeCheckoutFees()` from `services/pricingEngine.ts` is the single source of truth for all checkout paths.

## What must not drift

- The H1, the CTA pair, the section arc, and the six trust pillars are canonical. Future edits may rephrase body copy, but these locked elements require an explicit superseding doc to change.
- "ECHO Access" is now the product line. Do not regress to "ECHO" alone in headlines, hero copy, or product surfaces on the public site. Internal product code may continue to reference `brand` / `ECHO` for tokens and module names.

## Files touched in v59.2

- `components/web/EchoPublicWebsite.tsx` \u2014 full rewrite.
- `components/web/WebNav.tsx` \u2014 primary CTA changed from "Start Hosting" to "Become a Host".
- `components/web/WebFooter.tsx` \u2014 first column renamed "Platform" \u2192 "For Attendees", links rebalanced.
- `docs/ECHO_WEBSITE_V58_HOST_FIRST_HOMEPAGE_LOCK.md` \u2014 converted to deprecation notice pointing here.
- `docs/ECHO_WEBSITE_V59_2_BALANCED_HOMEPAGE_LOCK.md` \u2014 this document.

No other files were modified. All v59 routes and gates remain exactly as shipped.
