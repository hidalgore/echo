# ECHO Past Events Closeout Report Standard v1

## Purpose
Closeout report details should be viewed from the Host Events page, inside the Past Events card for the specific event. Payouts & Reports keeps access to report data, but the detailed report display lives with the event history.

## Locked behavior
1. Payouts & Reports may access closeout report data.
2. Payouts & Reports should not be the primary detailed event report display.
3. Host Events → Past Events is the primary access point.
4. Tapping a Past Event card expands the event card.
5. Expanded Past Event card displays:
   - closeout report status
   - email status
   - checked-in count
   - remaining count
   - attendance rate
   - denied count
   - Entry Trust Score
   - download pills
6. Download pills:
   - PDF
   - CSV
   - Analytics
7. If a report is missing, show “Closeout report pending.”
8. Payouts & Reports should provide a card/link directing hosts to Past Events for event-level closeout reports.

## Files
- `app/(host)/(tabs)/events.tsx`
- `app/(host)/(tabs)/payouts.tsx`
- `services/eventCloseoutReportService.ts`
