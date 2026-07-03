# ECHO Web Mobile Header v57 Lock

## Decision

Mobile web uses the ECHO icon-only mark in the website header to keep the header cleaner. Desktop and larger tablet web keep the full ECHO wordmark.

## Locked brand rule

- Desktop web header: full ECHO wordmark.
- Mobile web header: icon-only ECHO mark.
- Access, Wallet, NFC, and compact UI moments: icon-only ECHO mark.
- Do not recreate the logo with text when the asset exists.

## Implementation

Updated `app/web-v2-preview.tsx` so compact viewport headers use `echo_icon_mark.png` and reduce the logo container width from wordmark sizing to icon sizing.

## Reason

The mobile web header has limited horizontal space. The icon-only mark gives ECHO a premium, app-like header while preserving room for the primary CTA.

## Drift guardrail

Do not replace the desktop website wordmark with icon-only. The icon-only rule applies to mobile web / compact viewport only.
