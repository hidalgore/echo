# ECHO Nonprofit Donation Checkout + Campaign Tracking v1

Locked canonical buildout for verified nonprofit hosts.

## Canonical Decisions

1. Donation setup lives in the final event Review / Publish step.
2. Donations are available only to verified nonprofit hosts.
3. Donation campaigns tied to an event stay open until official host event closeout.
4. Donations remain open after ticket sales close and may continue during the live event / door window.
5. Fundraising goals are milestones, not hard caps. Campaigns may exceed the initial goal.
6. Public campaign pages are optional and default on for verified nonprofits.
7. No public donor list is shown by default.
8. Donors may hide public display, but authorized nonprofit CSV reporting still includes donor name and email for bookkeeping and receipt purposes.
9. Donations never appear on NFC, QR, Apple Wallet event ticket, or door-entry surfaces.
10. Wallet gets an Impact section for supported causes, campaign progress, receipts, share, and donate-again actions.

## Checkout Requirements

The attendee checkout donation card must be optional, mission-led, and clearly separated from ticket purchase.

Required card elements:
- Make an impact
- Verified Nonprofit trust pill
- Cause title
- Cause description
- Raised / goal progress
- No thanks
- Round up
- Suggested amounts
- Custom amount
- Separate donation line item in order summary
- Donation review confirmation when donation amount is greater than $0

Donation default is always $0. No amount may be preselected.

## ECHO Circle Donation Rules

1. Donations are individual and optional by default.
2. Organizer donations apply only to organizer’s own transaction unless Pay-for-All is selected.
3. Recipients choose their own optional donation during claim checkout.
4. Donation participation does not affect Circle completion, claim status, ticket confirmation, or wallet access.
5. Circle Hub may show aggregate campaign support only, not individual donor amounts.
6. Pay-for-All uses one order-level donation by default.
7. Cover Remaining Tickets does not auto-add a donation.

## Closeout CSV Report

At campaign closeout, ECHO must generate an authorized nonprofit donation CSV containing:
- Campaign Name
- Event Name
- Nonprofit Organization
- Donor Name
- Donor Email
- Donation Amount
- Donation Date
- Donation Time
- Payment Status
- Refund Status
- Processing Fee
- Net Donation Amount
- Transaction ID
- Receipt ID
- Ticket Order ID
- ECHO Circle ID
- Donation Source
- Donation Type
- Donor Account Type

Donor data is available only to verified nonprofit / authorized host finance roles and must not be shown publicly by default.
