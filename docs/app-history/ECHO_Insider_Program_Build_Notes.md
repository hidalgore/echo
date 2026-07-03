# ECHO Insider Program — v59.6 Build Addendum

## Locked Decisions Included

- Insider is invite-only before public launch.
- Insider is visible to all users at launch through Profile → ECHO Insider Program.
- Founding Insider cohort starts at 500 and can be adjusted later.
- No fixed points-to-dollar conversion at launch.
- ECHO Credits can be earned from testing, real event attendance, and host-awarded event bonuses.
- Hosts can award bonus credits to testers at their events.
- External partner rewards are supported as a future reward kind.
- Applicants not selected are not hard-denied; they are retained in waitlist/opportunity statuses with user-facing reasons.

## Added Files

- `types/insider.ts`
- `services/insiderQualificationService.ts`
- `stores/insiderStore.ts`
- `components/insider/InsiderStatusCard.tsx`
- `components/insider/InsiderMissionCard.tsx`
- `components/insider/InsiderFeedbackForm.tsx`
- `components/insider/index.ts`
- `app/profile/insider.tsx`

## Updated Files

- `app/(tabs)/profile.tsx`
  - Adds Profile → YOUR ECHO → ECHO Insider Program row.

## Product Scope Delivered

This build creates a native, profile-based Insider surface with:

1. Curated auto-approval/waitlist scoring.
2. Founding Insider / Approved / Priority Waitlist / Cohort Waitlist / Future Opportunity Pool statuses.
3. Explanation messaging for users who are not selected for the current cohort.
4. Reputation and ECHO Credits separated to avoid early financial liability.
5. No hard-coded credit-to-dollar conversion.
6. Mission cards for wallet, ECHO Circle, and Door Mode testing.
7. Visual Feedback Hub with media picker for photos, video, and screen recordings.
8. AI triage stub attached to feedback submissions.
9. Reward ledger for missions, feedback, attendance rewards, host bonuses, and future partner rewards.

## Backend TODO

Create persistent tables or Supabase models for:

- `insider_applications`
- `insider_profiles`
- `insider_missions`
- `insider_feedback`
- `insider_feedback_attachments`
- `insider_reward_ledger`
- `insider_cohorts`
- `insider_partner_rewards`

## Security / Compliance Notes

- Feedback uploads may contain personal information. Production build must support blur/redaction before upload.
- Media uploads require storage policies, malware scanning, file size limits, and signed URLs.
- Credits should be treated as promotional value, not cash balance.
- Redemption controls should be server-owned.
- Host-awarded credits need abuse limits, event caps, audit logs, and admin override.

## v59.6 Insider Verification Patch

This patch removes the reward-risk pattern where a tester could tap **Mark Test Complete** and immediately receive credits.

### Locked behavior

- Mission credits do **not** unlock from a checkbox or button tap.
- A mission starts in `available`, moves to `in_progress`, then must pass background verification before `verified`.
- Mission rewards are issued only when required activity signals are present.
- Feedback can be connected to a specific mission, allowing media evidence to count toward mission verification.
- If required signals are missing, the mission moves to `needs_evidence` and shows what is still required.

### Verification signals added

- `screen_visited`
- `feature_event_completed`
- `wallet_pass_created`
- `circle_invite_created`
- `door_scan_simulated`
- `nfc_scan_detected`
- `eligible_event_attended`
- `experience_recap_completed`
- `media_attached`
- `feedback_submitted`
- `host_confirmed`
- `backend_verified`

### Developer integration notes

The current sandbox patch includes temporary `Simulate Activity` buttons inside `InsiderMissionCard` so developers can verify UI states without backend events. In production, remove or hide those controls and call `recordMissionSignal()` from actual platform events such as wallet pass creation, ECHO Circle invite creation, Door Mode scan simulation, attendance validation, host confirmation, and Experience Recap submission.

### Profile cleanup

The Profile row was simplified from a long program title to **ECHO Insider** with a clearer subtitle: application, verified missions, rewards, and feedback impact. The deeper Insider page now explains verification rules before reward rules, reducing confusion and making clear that ECHO credits are earned by verified activity, not self-certification.
