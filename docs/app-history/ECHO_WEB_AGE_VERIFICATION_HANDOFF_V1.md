# ECHO Web Age Verification Handoff v1

## Canonical Rule

When a web ticket purchase requires age verification, the web checkout temporarily hands the user to their phone to complete verification, then returns them to the same web checkout to complete payment.

The experience must be simple, clean, guided, resumable, and Apple-premium.

No payment is taken before verification.

---

## Required Desktop Flow

1. User selects tickets on web.
2. ECHO detects that the event requires 18+ or 21+ verification.
3. Checkout pauses before payment.
4. Desktop shows a premium verification handoff panel.
5. User scans QR code or sends secure link by text/email.
6. Desktop shows live status while waiting.
7. When phone verification succeeds, desktop checkout resumes automatically.
8. Payment CTA unlocks.

Desktop copy:

> Age verification required

> This event requires age verification before payment. Scan the QR code or send yourself a secure link. Your checkout will continue automatically once verified.

Primary action:

> Verify on Phone

Secondary actions:

- Send by Text
- Send by Email
- Use a Different Phone

---

## Required Phone Flow

1. User opens secure ECHO verification link.
2. Phone shows event name and required age.
3. Phone explains that no payment has been taken.
4. User completes verification.
5. Phone shows success or failure.
6. If successful, user is guided back to desktop checkout.

Phone copy:

> Verify your age to continue

> This event requires age verification before checkout. No payment will be taken until verification is complete.

Success copy:

> Verified

> You’re all set. Return to your browser to complete checkout.

Failure copy:

> We couldn’t verify your age

> This ticket requires verified age access. No payment was taken.

---

## Required States

Desktop:

- Verification Required
- Waiting for Phone
- Verification In Progress
- Verified
- Verification Failed
- Session Expired
- Return to Checkout

Phone:

- Open Verification
- Confirm Event
- Verify Age
- Success
- Failed
- Retry / Contact Support

---

## Product Rules

- No payment before verification.
- Checkout state must be preserved.
- Ticket selection must not disappear during verification.
- Session should expire after a defined timeout.
- User can resend the verification link.
- User can change phone/email.
- Failed verification blocks checkout.
- Successful verification resumes the same checkout step automatically.
- Mobile web users verify directly on the phone without QR handoff.
- If the ECHO app is installed, open the app.
- If not installed, open secure mobile web verification.
- App download is never required for checkout.

---

## Engineering Notes

The verification session should store:

- `session_id`
- `checkout_id`
- `event_id`
- `age_requirement`
- `status`
- `expires_at`
- `return_url`
- `handoff_method`
- `checkout_state_snapshot`

The web checkout should subscribe or poll for state updates and transition from `waiting_for_phone` to `verified` without requiring a manual refresh.
