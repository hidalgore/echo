# ECHO Past Events Mock Closeout Reports v1

## Purpose
Past Event cards should show a useful report preview even before a real closeout report exists.

## Locked behavior
1. If a real closeout report exists, show real data.
2. If no report exists, show a mock/sample “Report Preview.”
3. Mock report must include:
   - Checked In
   - No-show / Remaining
   - Attendance rate
   - Denied attempts
   - Scan Success
   - Entry Trust Score
4. Download pills remain visible:
   - PDF
   - CSV
   - Analytics
5. Report preview must be clearly labeled as sample/mock until closeout compiles the final report.

## Primary file
`app/(host)/(tabs)/events.tsx`
