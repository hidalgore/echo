# ECHO Circle Recipient Flow v1 — Locked Implementation Standard

## Canonical flow

Universal Invite Preview → Age Verification if required → Checkout → Ticket Confirmed → Recipient Circle Status / View Ticket

## Locked product rules

1. No app install is required before purchase.
2. Universal invite links open the ECHO app if installed and mobile web if not installed.
3. Canonical external URL pattern: `https://getechoaccess.com/circle/invite/[token]`.
4. 18+/21+ events require age verification before checkout and payment.
5. Checkout is blocked if verification fails, and no payment is taken.
6. The recipient’s spot is held, but the ticket is not confirmed until age verification and payment are complete.
7. Checkout CTA must be `Pay & Secure Ticket`.
8. Confirmation copy must communicate: `Your ticket is confirmed. You’ve joined [Organizer Name]’s Circle.`
9. Add to Apple Wallet / Google Wallet and View Ticket must appear before Download ECHO App.
10. App download is optional after purchase.
11. Recipient Circle Status is separate from the organizer Hub.
12. Recipient reassurance must appear: `Your ticket remains confirmed even if the Circle does not fill.`
13. No QR imagery appears in this flow except inside the actual ticket fallback view.

## Required edge states

- Invite expired
- Circle full
- Age verification failed
- Payment failed
- Event sold out
- Invite already claimed
- Invite declined
- Organizer released unpaid spots

## Design standard

- Use `useDynamicTheme`.
- Preserve premium charcoal identity in dark mode.
- Support polished light mode.
- Use restrained glass cards and strong spacing.
- Use minimal gradient: primary CTA, progress, verification/success accents.
- Use consistent icon stroke language.
- Use calm haptics/motion for verification and payment success.

## Active implementation files

- `services/circleRecipientService.ts`
- `app/circle/recipient/[token].tsx`
- `app/circle/invite.tsx`
- `app/circle/_layout.tsx`
