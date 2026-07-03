# ECHO 10 Mock Host Events + Event Mode Sync v1

## Purpose
This update seeds 10 fully functional host-owned mock events so the host can exercise the Events, Event Detail, Promote Event, Door Mode, Door Mode guardrails, Past Event reports, payout/analytics previews, and consumer Event Mode discovery surfaces without needing real backend data.

## Mock host event coverage
The seeded suite includes:

1. Live 21+ nightlife event — Door Mode ready, live check-in counts, scan simulation, promotion, and wallet/event discovery.
2. Starts within 2 hours — Door Mode eligible, passcode preflight test, readiness flow.
3. Starts more than 2 hours away — Door Mode intentionally locked/inaccessible.
4. Nonprofit scholarship event — nonprofit/community positioning, donation-friendly ticket mix, report/export readiness.
5. ECHO Circle-style dinner party — group/social event for Circle copy, promotion, and grouped ticket behavior testing.
6. High-demand VIP tasting — near-sellout analytics, payout projection, urgency/promotion testing.
7. Low-sales community arts market — AI promotion and host action prompt testing.
8. Access Tech Forum — conference-style, higher-price tiers, finance/dashboard testing.
9. Completed event with seeded real Closeout Report — verifies Closeout Report, PDF/CSV/Analytics download pills, and real-report metrics.
10. Completed event without real report — verifies Report Preview fallback behavior.

## Sync behavior
- All 10 mock host events are added to the shared `MOCK_EVENTS` array.
- Because Event Mode/Home/Search reads from `eventStore`, the same seeded host events are visible on the consumer/event discovery side.
- Host Events filters now include seeded demo host events even if the host profile display name changes.
- Door runtime defaults are seeded through `loadHostRuntime()`, so sold, checked-in, revenue, and event lifecycle status are immediately available.
- Runtime updates still write through the existing Door Mode runtime service, so scan simulations and closeout behavior continue to update host-facing event state.
- Past Events now demonstrate both real closeout report data and report-preview fallback behavior.

## Files changed
- `services/mockHostEventSuite.ts`
- `services/mock.ts`
- `services/doorModeService.ts`
- `services/eventCloseoutReportService.ts`
- `app/(host)/(tabs)/events.tsx`
- `app/(host)/(tabs)/_layout.tsx`
