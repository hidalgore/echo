# ECHO_WEB_COMPONENTS_V57_LOCK

**Version:** Established v57, carried through v59
**Status:** Locked
**Scope:** Shared component library used by every web page in `app/*` and the web variants of native screens. Located in `components/web/`.

---

## Component inventory

### Layout primitives

| Component | Purpose |
|---|---|
| `WebShell.tsx` | Top-level charcoal canvas (`#06060A`), optional ambient blur blobs prop, mounts `WebNav` and `WebFooter`. Every web page wraps in `<WebShell>`. |
| `WebSection.tsx` | Max-width container with optional eyebrow / title / description / align / paddingVertical / divider / maxWidth props. The only structural unit pages should use for sections. |
| `WebNav.tsx` | Top pill nav. Mobile (<920px) collapses to a hamburger drawer. Cross-links: Explore, For Hosts, Trust, Nonprofits, Sign in, Start Hosting. |
| `WebFooter.tsx` | 5-column footer + trust strip. |
| `WebTrustStrip.tsx` | Reusable row of trust badges (verified hosts, secure checkout, NFC + QR, wallet-ready, donation transparency). |

### Interactive primitives

| Component | Purpose |
|---|---|
| `WebCTA.tsx` | Button. Variants: `primary` (gradient), `solid`, `secondary` (border), `ghost`. Sizes: `md`, `lg`. Accepts `href`, `icon`, `onPress`. |

### Visual primitives (premium proof surfaces)

| Component | Purpose |
|---|---|
| `EventCardWeb.tsx` | Editorial event card. Sizes `lg`, `md`, `sm`. Routes to `/event/${id}` on press. Pulls flyer + meta from `Event`. |
| `EchoAccessPassPreview.tsx` | The Pass visual. Background: charcoal by default, optionally a flyer if a ticket is purchased. Accepts `eventName`, `dateLabel`, `flyerUrl`. |
| `EchoCirclePreview.tsx` | Circle slot ring + 52-min timer pill. Static visual for marketing surfaces. |
| `HostCommandPreview.tsx` | Browser-frame mock of `/host/dashboard`. Accepts `compact` prop (560 vs 820 dashboard width). Used on the homepage and `/host/login`. |

### Composite layouts

| Component | Purpose |
|---|---|
| `PortalShell.tsx` | Two-column login portal. Props: `audience` (`'attendee'` or `'host'`), `sidePanel` (any node). Powers `/login` and `/host/login`. |

### Full-page components

| Component | Purpose |
|---|---|
| `EchoPublicWebsite.tsx` | Flagship homepage. Hero, trust strip, why hosts choose ECHO, host product surface, the access pass section, Circle, donation tools, trust, what's playing, host CTA. |
| `WebWalletPage.tsx` | Web variant of the wallet. Active pass + Apple/Google wallet buttons, entry method explanation, Circle preview, upcoming + past tickets, donation receipt if any. |
| `WebEventDetailPage.tsx` | Web variant of an event page. Media hero, badges, ticket tiers, Circle CTA, host card, entry method, donation card if attached. Uses "Reserve Access" not "Buy Ticket". |

---

## Styling contract

- **Color tokens:** ONLY use `brand.xxx` hex strings from `theme/brand.ts` inside `StyleSheet.create()`. Never use `c.xxx` dynamic tokens inside `StyleSheet.create()` \u2014 the v50 batch migration broke 24 stylesheets that way and was reverted. Dynamic tokens are inline-only.
- **Backgrounds:** charcoal `#06060A` is the canvas. Surface cards use `rgba(255,255,255,0.03)` with `rgba(255,255,255,0.06)` borders.
- **Accent colors:**
  - `brand.primary` (`#7B4DFF`) \u2014 primary gradient anchor + CTAs.
  - `brand.cyanAccessible` (`#7DDDFF`) \u2014 calm secondary accent, used for badges and trust signaling.
  - `brand.magenta`, `brand.gold` \u2014 sparingly, only inside gradient passes.
- **Radii:** 12 (chips), 14\u201318 (cards), 22\u201324 (hero surfaces), 999 (pills + buttons).
- **No emoji** anywhere in component code. Use `Ionicons` glyphs.
- **No HTML `<form>` tags.** All interactions use `onPress`/`onChangeText`.

## Behavior contract

- Every web component must be safe to render on web only. Either:
  - Wrapped inside a page that already gates on `Platform.OS === 'web'`, or
  - Self-contained and never imported from a native screen.
- `useWindowDimensions` is the only acceptable responsive primitive. Hardcoded breakpoints around `width < 760` (compact) and `width < 880` (tablet) are the standard.
- Routes are pushed via `router.push('<path>' as never)`. Always include the `as never` cast when routing to dynamic web URLs to satisfy expo-router types.

## Adding a new component

1. Place under `components/web/`.
2. Use `brand.xxx` inside StyleSheet.create; never `c.xxx`.
3. Add to this doc.
4. If it touches a native file (rare), wrap in a `Platform.OS === 'web'` gate at the call site, not inside the component.
