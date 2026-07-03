# ECHO Notification Campaign System v1 — Buildout Lock

Status: LOCKED / CANONICAL

## Purpose
Define what ECHO pushes, when, why, and how, keeping attendees and hosts engaged through useful, calm, trust-first messaging.

## Engineering Additions
- `types/notificationCampaign.ts`
- `services/notificationCampaignService.ts`

## Campaign Principles
- Notifications must be useful, not noisy.
- Wallet/access readiness notifications are high priority.
- ECHO Circle notifications focus on action needed and completion.
- Host notifications focus on sales momentum, door readiness, payout/reporting, and post-event actions.
- Nonprofit donation notifications focus on campaign progress and receipt/status access.

## Locked Campaign Triggers
- ticket_purchased
- event_24h
- event_3h
- doors_open
- nfc_ready
- circle_created
- circle_member_waiting
- circle_complete
- host_sales_momentum
- host_door_mode_ready
- donation_goal_progress
- post_event

## Acceptance Criteria
1. Rules are centralized and trigger-addressable.
2. Quiet hours can suppress non-critical notifications.
3. In-app notification remains available when push is suppressed.
4. Notification copy is direct, operational, and trust-first.
5. Routes are included for actionable notifications.
