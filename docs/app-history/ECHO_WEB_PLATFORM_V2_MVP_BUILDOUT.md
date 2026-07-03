# ECHO Web Platform v2 — MVP Buildout Standard

## Locked Product Direction

ECHO Web v2 is the full web operating layer for MVP, not only a marketing site.

Priority order is locked:

1. Host acquisition first
2. Event discovery second
3. Nonprofit support third

The public homepage must not position nonprofit tools as a main headline, main hero proof point, or equal homepage pillar. Nonprofit remains important, but it belongs under the **Nonprofit** tab and contextual **For Hosts** surfaces until the vertical grows.

Primary homepage CTA: **Start Hosting**

Secondary CTA: **Explore Events** or **Find Events**

Public web checkout is supported from day one. Real public events appear immediately.

---

## Web v2 MVP Surfaces

### Public Web

- Home
- Events marketplace
- Event Details
- Host Profile
- For Hosts
- Nonprofit
- How It Works
- Trust & Access
- Pricing
- Help
- Login / Sign Up

### Ticket Buyer Web

- Web Checkout
- Age Verification Handoff
- Confirmation
- Add to Apple / Google Wallet
- Web Wallet Companion
- Active Tickets
- Saved Events
- ECHO Circle
- Past Tickets
- Receipts

### Host Web

- Host Dashboard
- Create Event
- My Events
- Event Workspace
- Sales
- Guests
- ECHO Circle
- Door Command Center
- Payouts
- Reports
- Market Pulse
- Host Profile
- Settings

### Internal / Admin Foundation

Admin can remain lightweight for MVP, but architecture should anticipate:

- Host review
- Nonprofit verification
- Event monitoring
- Refund / risk review
- Age verification analytics
- Support console

---

## Homepage v2 MVP

### Header

Left: ECHO wordmark

Center navigation:

- Home
- Events
- For Hosts
- Nonprofit
- How It Works
- Trust & Access

Right actions:

- Log In
- Start Hosting
- Get the App

**Start Hosting** is the primary header CTA.

### Hero

Headline:

> Access begins here.

Subcopy:

> Sell tickets, manage guests, verify access, and deliver a wallet-first event experience from one trusted platform.

Hero CTA order:

1. Start Hosting
2. Explore Events

Hero phone:

- Show ECHO Home / Discover first
- City/location header
- public event discovery cards
- bottom nav: Home, Search, Wallet, Profile

Hero floating labels:

- Entry Ready
- 21+ Verified
- ECHO Circle
- Door Mode Ready
- Event Health / Host Dashboard Live

Do **not** use Donations Enabled as a hero-level label for MVP.

---

## Search Command Rail

Place a strong horizontal glass search rail between the hero and event discovery.

Fields:

- Search events, hosts, venues, or causes
- Location
- Date
- Category
- Age
- Search

This should feel like a premium command rail, not a basic input.

---

## Public Event Discovery

Real public events must appear immediately.

Recommended sections:

1. Events Live on ECHO
2. Happening Now
3. Trending Near You
4. This Weekend
5. Featured Hosts

Event card requirements:

- Flyer image
- Event title
- Host name
- Venue / city
- Date / time
- Price
- Verified Host badge
- Age badge if required
- Save/bookmark icon
- Donation indicator only if applicable

Do not display QR codes on public event cards.

---

## Event Details Page

Event Details is a core MVP conversion surface.

Required sections:

- Hero flyer or event media
- Event title
- Verified Host badge
- Host profile preview
- Date / time
- Venue / map
- Age requirement badge
- Refund / transfer rules
- Ticket tiers
- Sticky Details / Tickets tab row
- Sticky checkout CTA
- ECHO Circle option for 2+ tickets
- Donation section only if nonprofit-enabled
- Similar events
- Trust & Access reassurance

Primary CTA examples:

- Get Tickets
- Pay & Secure Ticket
- Start ECHO Circle
- Pay for All

---

## Web Checkout v2 MVP

Web checkout is supported from day one.

### Single Ticket Flow

Event Details → Ticket Selection → Age Verification if required → Checkout → Confirmation → Add to Wallet → Optional app install

### Multiple Ticket Flow

Event Details → Ticket Selection → Choose Payment Path:

- Pay for All
- Start ECHO Circle

### Checkout Requirements

- Guest checkout
- Apple Pay
- Google Pay
- Card payment
- Promo code
- Clear fee/tax breakdown
- Refund / transfer policy confirmation
- Donation card only when nonprofit-enabled
- No payment before required age verification
- Confirmation with Add to Wallet

---

## Web Age Verification Handoff v1

For restricted web purchases, the checkout must temporarily hand the user to their phone for age verification, then return them to the same checkout.

### Desktop Flow

Checkout pauses with:

> Age verification required

Copy:

> This event requires age verification before payment. Scan the QR code or send yourself a secure link. Your checkout will continue automatically once verified.

Options:

- Scan QR code
- Send by text
- Send by email

Desktop status states:

- Waiting for phone
- Verification in progress
- Verified
- Failed
- Session expired

### Phone Flow

Phone opens secure ECHO verification page or app deep link.

Copy:

> Verify your age to continue

> This event requires age verification before checkout. No payment will be taken until verification is complete.

Success:

> Verified. Return to your browser to complete checkout.

### Locked Rules

- No payment before verification
- Checkout state preserved
- App download not required
- Mobile web can verify directly without QR handoff
- Failed verification blocks checkout
- Successful verification resumes the same web checkout automatically
- Experience must feel simple, clean, guided, resumable, and Apple-premium

---

## ECHO Circle Web v2 MVP

### Organizer Flow

Ticket quantity 2+ → Start ECHO Circle → organizer pays for one ticket → Circle Hub opens → invite by phone, email, ECHO username, or copy link → track claimed/waiting spots → cover unpaid spots or release when allowed.

### Recipient Flow

Universal invite link → Invite Preview → Age Verification if required → Checkout → Ticket Confirmed → Add to Wallet → Circle Status.

Required reassurance:

> Your ticket remains confirmed even if the Circle does not fill.

---

## Web Wallet Companion

The Web Wallet Companion supports continuity on web. It does not replace the mobile Wallet.

Sections:

- Active Tickets
- Saved Events
- ECHO Circle
- Past Tickets
- Receipts
- Impact

Ticket surfaces should include Add to Apple Wallet and Add to Google Wallet. QR fallback appears only inside the actual ticket detail fallback view.

---

## Host Web Command Center

Host web is the strongest v2 upgrade.

### Dashboard States

Before Event:

- Event Health Score
- Tickets sold vs capacity
- Revenue vs target
- Sales velocity
- Save-to-purchase
- Promo performance
- Circle performance
- Market Pulse
- Host readiness checklist
- Door Mode readiness

Live Event:

- Checked in
- Remaining
- Door throughput
- Scan success rate
- Denied attempts
- Offline status
- Door sales
- Entry Trust Score
- Alerts

After Event:

- Final attendance
- No-show rate
- Gross revenue
- Fees
- Refunds
- Donations if applicable
- Net payout
- Payout status
- Best source
- Best purchase window
- Reports

---

## Web Event Creation

Web creation is more complete than Mobile Lite.

Steps:

1. Basics
2. Media
3. Tickets
4. Access Rules
5. ECHO Circle
6. Market Pulse
7. Nonprofit Tools
8. Review & Publish

Locked behavior:

- Still flyer is required
- Event detail video is optional
- Refund / transfer settings lock after publish
- Age restriction is one of the final publish decisions and locks after publish
- Nonprofit Tools only appear for verified nonprofit hosts
- Host override is allowed for Market Pulse recommendations

---

## Event Workspace

After publishing, hosts manage events from a dedicated workspace.

Tabs:

- Overview
- Sales
- Guests
- Circle
- Door
- Payouts
- Reports
- Settings

### Door Tab

Web supports Door Command Center, not primary live scanning.

Include:

- Door readiness status
- Staff/device assignment
- Test Door Mode
- Manual check-in
- Guest lookup
- Webcam QR fallback where supported
- Denied attempt log
- Offline readiness status
- ECHO Disc future status

Mobile/tablet remains primary for live scanning and NFC-first door flow.

---

## Reports and Payouts

Required MVP exports:

- Attendee CSV
- Attendance CSV
- Event analytics PDF
- Closeout report PDF
- Donation CSV if applicable
- Payout summary

Payouts show:

- Gross revenue
- Fees
- Refunds
- Donations separated
- Net payout
- Payout date
- Payout status

---

## Trust & Access Center

Dedicated website page covering:

- Wallet-first tickets
- NFC-first entry
- QR fallback
- Offline readiness
- Age verification
- Secure checkout
- Host verification
- Door Mode
- ECHO Circle trust rules
- ECHO Disc future hardware readiness

---

## Implementation Files Added

- `types/webPlatform.ts`
- `constants/webPlatform.ts`
- `services/webPlatformMock.ts`
- `app/web-v2-preview.tsx`
- `docs/ECHO_WEB_PLATFORM_V2_MVP_BUILDOUT.md`
- `docs/ECHO_WEB_AGE_VERIFICATION_HANDOFF_V1.md`
- `docs/ECHO_WEB_V2_ACCEPTANCE_CRITERIA.md`

---

## Drift Guardrails

Do not drift into these patterns:

- Do not make nonprofit a homepage headline or main hero proof point.
- Do not make app install required before web checkout.
- Do not take payment before age verification for restricted events.
- Do not make web the primary NFC scanning surface.
- Do not display QR codes on public event cards or normal wallet list cards.
- Do not flatten host analytics into passive dashboards; dashboards should be action-oriented.
- Do not split mixed ticket tiers into separate wallet records; use grouped ticket record with tier metadata.
