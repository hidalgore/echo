# ECHO Event Closeout Reporting Standard v1

## Purpose
When all attendees are checked in, ECHO should offer the host a clean closeout path that compiles attendance, analytics, attendee lists, and reporting artifacts.

## Locked behavior
1. When Remaining reaches 0 and Checked In is greater than 0, Door Mode prompts:
   “All attendees checked in. Would you like to close the event?”
2. Host can choose:
   - Keep Open
   - Close Event
3. If host confirms Close Event:
   - close the Door session
   - mark Door Mode closed
   - compile attendance and analytics
   - generate attendee list
   - mark attendee list email as sent/queued to host
   - make reports available in Payouts & Reports
   - route host to Dashboard after close confirmation
4. The Payouts & Reports page must show closeout reports with downloadable:
   - Attendee CSV
   - Attendance PDF
   - Event Analytics PDF
5. Production implementation should move email/report generation to a backend job queue.

## Current mock/local implementation
- `services/eventCloseoutReportService.ts`
- Reports stored under `echo.host.closeout.reports.v1`
- Payouts screen reads `getCloseoutReports()`


## v1.1 Past Events display rule

1. Payouts & Reports retains access to closeout report data.
2. Detailed closeout report display belongs to Host Events → Past Events.
3. Past Event cards expand inline on tap to show the report.
4. Download pills live inside the expanded Past Event report panel.
