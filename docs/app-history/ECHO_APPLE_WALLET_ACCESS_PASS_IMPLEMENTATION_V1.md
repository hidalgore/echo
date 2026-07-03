# ECHO Apple Wallet + Apple Watch Access Pass Implementation v1

## Source of truth
This build implements the locked ECHO Apple Wallet + Apple Watch Access Pass Developer Spec v1.0.

## Product principles
1. NFC-first access. QR is hidden from the primary pass surface.
2. The pass must immediately answer what it is, whether it works now, and what the user should do next.
3. Use only the official ECHO wordmark and official standalone access-ring icon.
4. Visual tone: matte charcoal, premium, trusted, restrained, Apple-level.
5. Ready to Tap is the primary action copy.
6. Secure NFC access enabled is the secondary copy.
7. Entry Ready is a small utility badge.
8. 21+ Verified / Identity Verified pills show only when relevant.

## Components added
- `components/wallet/EchoWalletPassCard.tsx`
- `components/wallet/EchoWatchPassPreview.tsx`
- `components/wallet/EchoPassStatusBadge.tsx`
- `components/wallet/EchoVerificationPill.tsx`
- `components/wallet/EchoNfcGlyph.tsx`
- `components/wallet/EchoGradientBorder.tsx`
- `components/wallet/EchoLogoMark.tsx`
- `components/wallet/EchoStandaloneIcon.tsx`
- `components/wallet/EchoPassStateDemo.tsx`
- `services/appleWalletPassService.ts`

## Data model
`EchoWalletPass` supports:
- `access`
- `event_ticket`
- `ready`
- `scanning`
- `checked_in`
- `offline_ready`
- `upcoming`
- `expired`
- `verification_required`

## Wallet screen integration
The ECHO Wallet screen now includes an Apple Wallet Access Pass section with:
- ECHO Wallet pass preview
- Apple Watch preview sheet
- PassKit mapping preview
- NFC-primary / QR-hidden trust copy

## PassKit behavior
`mapEchoPassToPassKit()` maps ECHO pass data to:
- primaryFields
- secondaryFields
- auxiliaryFields
- backFields
- colors
- NFC-primary behavior
- QR hidden by default

## QA rules
1. Ready state shows Ready to Tap.
2. Scanning state shows Hold Still.
3. Checked In state shows Entry confirmed.
4. Offline Ready shows cached entry posture.
5. Upcoming disables ready-to-tap language.
6. Expired removes active NFC cues.
7. Verification Required blocks ready state.
