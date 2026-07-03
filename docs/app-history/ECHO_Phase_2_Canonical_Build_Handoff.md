# ECHO Phase 2 Canonical Build Handoff

Status: Locked expansion package for Claude/frontend engineering.

## Core Rule
Never redesign a previously locked ECHO feature. Enhance existing features, extend existing systems, and preserve mock data.

## Product Positioning
ECHO is a Trusted Access Platform. Ticketing is one capability; the moat is ECHO Trust Network™.

## Merged Locked Specs
- Website V2: The new front door for live events.
- Trust & Access Control: Approved, Flagged, Security Hold, Denied; restriction levels; RBAC; emergency lockdown; AI Trust Assistant recommendation-only.
- Access Control System v1: Access Passes, tier permissions, wallet/NFC/QR credentials, Door Mode <500ms target, multi-zone access, analytics, signed credentials, replay protection, offline cache.
- Claude Master Build Prompt: Trust hierarchy, licensing enforcement, agency workspaces, team access, Zero Trust, trusted devices, payout security hold, hardware roadmap.
- Event Creation V3: Flyer-first creation, AI extraction, Event Health Center, Market Pulse, scheduled publish, Launch Center.

## Canonical User Journeys

### Host Creation
Upload Flyer → AI Scan → Review Extracted Information → Event Health Check → Market Pulse → Publish & Sales Schedule → Launch Center.

### Attendee Access
Discover → Select Access Pass → Review Benefits → Verify Age if Required → Checkout → Wallet Delivery → Tap NFC / QR Fallback → Experience Recap.

### Door Operations
Open Door Mode → Confirm trusted scanner device → Select checkpoint → Scan NFC/QR → Show full-screen result → Update attendance → Sync analytics → Close event/report.

## Website V2 Section Order
1. Floating navigation
2. Hero with lifelike phone and 4 cards
3. NFC access flow strip
4. Problem section
5. How ECHO Works journey
6. Host value section
7. NFC-first entry section
8. ECHO Circle section
9. Trust & Access section
10. Host Command Center
11. Attendee wallet experience
12. Impact / nonprofit preview
13. ECHO Disc hardware preview
14. Pricing preview
15. Final CTA and footer

## Drift-Control Recommendations

### 1. Pricing label conflict
Website V2 PDF says Starter/Growth/Elite. Prior locked licensing says Launch/Pro/Elite. Recommendation: keep Launch/Pro/Elite as public pricing names and use Starter/Growth/Elite only as audience descriptors.

### 2. Hero copy conflict
Earlier build used “The operating system for live event access.” Website V2 locks “The new front door for live events.” Recommendation: use the new front door headline on the public homepage. Keep operating-system language as support copy/investor copy.

### 3. Ticket vs Access Pass language
Recommendation: use Access Pass in wallet, security, Door Mode, and Trust surfaces. Use ticket only when talking about quantity, pricing, and buyer familiarity.

### 4. Disc Core vs Pro scope
Disc Core remains passive NFC. Disc Pro owns LED, camera, trusted hardware registry, certificate, secure element, and clone detection roadmap.

## Production Gaps Remaining
This package adds canonical contracts and frontend-safe service logic. Production still requires backend APIs, database ERDs, server-side immutable audit storage, credential signing, rotating QR issuance, NFC challenge-response backend, scheduler workers, role management UI, and security review.
