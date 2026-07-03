# ECHO v42 — Intelligent Notification & Engagement System v2

## Build Scope
This build completes the frontend foundation for the official ECHO Intelligent Notification & Engagement System v2.
It upgrades the previous Notification Campaign System v1 into a state-aware, fatigue-aware, AI-scored engagement layer.

## Added / Updated Files
- `types/notificationCampaign.ts`
- `services/notificationCampaignService.ts`
- `stores/notificationStore.ts`
- `components/notifications/IntelligentNotificationCenter.tsx`
- `components/notifications/NotificationSheet.tsx`
- `components/notifications/index.ts`
- `app/(host)/notifications.tsx`
- `app/profile/notifications.tsx`

## Canonical v2 Capabilities Included

### 1. Campaign Rules Engine
The system now defines complete campaign rules across attendee, host, Circle, donation, wallet, entry, and post-event surfaces.

Included trigger families:
- ticket purchased
- age verification needed
- 24-hour event readiness
- 3-hour event readiness
- doors open
- Circle invite received
- Circle timer warning
- Circle complete
- host publish success
- host sales momentum
- host sales slowdown
- host door mode readiness
- nonprofit donation progress
- donation goal reached
- host closeout report ready

### 2. AI Personalization Scoring
`calculatePersonalizationScore()` scores campaign delivery based on:
- matched user segments
- saved events
- tickets purchased
- active Circle status
- donation interest
- host urgency
- open rate
- dismissal penalty
- campaign priority

### 3. Fatigue Control
`calculateFatigueRisk()` suppresses or redirects lower-priority notifications when the user has received too many notifications or has dismissed several recently.

Risk levels:
- low
- medium
- high

High fatigue suppresses non-critical campaigns and falls back to in-app only.

### 4. Quiet Hours + Send-Time Optimization
`isWithinQuietHours()` and `recommendSendTime()` now support:
- quiet hour suppression
- deferred send time
- emergency/priority bypass
- morning/daytime optimization windows

### 5. Channel Preference Enforcement
System supports channel-level preference logic:
- push
- in-app
- email
- SMS

In-app is retained as the safe fallback channel.

### 6. Intelligent Inbox Store
`notificationStore.ts` now tracks:
- notification inbox
- unread count
- preferences
- engagement signals
- analytics events
- mark read
- dismiss
- clear all
- trigger campaign simulation
- host recommendations

### 7. Host Command Notifications
Host notification screen now uses the v2 intelligent notification center with:
- AI Live hero card
- run demo triggers action
- host recommendation cards
- AI reason display
- host ops filtering

### 8. Attendee Notification Sheet Upgrade
The bell notification sheet now uses the v2 store instead of local static-only notifications.
It supports:
- AI reason display
- fatigue-aware notification metadata
- lifecycle-stage icons
- read/clear controls
- analytics tracking on open/dismiss

### 9. Notification Preference Screen
Profile notification screen now allows toggling:
- push notifications
- email updates
- SMS for Circle invites
- quiet hours
- event reminders
- Circle updates
- host insights
- donation campaign updates

## Backend Handoff Notes
The current build is local-first and demo-ready. Production backend should add:
- scheduled job runner
- push provider integration
- email/SMS provider integration
- notification delivery ledger
- per-user preference persistence
- per-campaign delivery analytics
- A/B testing assignment
- event lifecycle webhook triggers
- host campaign recommendation API
- donation campaign progress event emitter
- Circle timer event emitter

## Important Product Rules Preserved
- Notifications must never interrupt Door Mode scanning.
- Wallet/access reliability remains higher priority than engagement.
- Donation updates are mission-led and never pressure-based.
- Circle reminders clarify action without threatening already-secured tickets.
- Quiet hours are respected except for critical access/door operations.
- In-app fallback is always allowed when push/email/SMS is suppressed.

## Version
ECHO Frontend v42 — Complete Intelligent Notification & Engagement System v2
