/**
 * ECHO Event Closeout Report Service
 * ══════════════════════════════════
 * Mock/local service for event closeout artifacts.
 * Production should replace email/report generation with backend jobs.
 */
import { getJSON, setJSON } from './persistence';
import { MOCK_HOST_CLOSEOUT_REPORTS } from './mockHostEventSuite';

export type CloseoutAttendee = {
  id: string;
  name: string;
  ticket: string;
  status: 'checked_in' | 'remaining';
  time?: string;
};

export type CloseoutReport = {
  id: string;
  eventId: string;
  eventTitle: string;
  hostEmail: string;
  createdAt: string;
  checkedInCount: number;
  remainingCount: number;
  deniedCount: number;
  attendanceRate: number;
  attendeeList: CloseoutAttendee[];
  analytics: {
    totalCapacity: number;
    noShowCount: number;
    scanSuccessRate: number;
    entryTrustScore: number;
  };
  emailStatus: 'queued' | 'sent';
  availableDownloads: Array<'attendee_csv' | 'attendance_pdf' | 'event_analytics_pdf' | 'donation_csv'>;
};

const CLOSEOUT_REPORTS_KEY = 'echo.host.closeout.reports.v1';

async function readReports(): Promise<CloseoutReport[]> {
  return getJSON<CloseoutReport[]>(CLOSEOUT_REPORTS_KEY, []);
}

async function writeReports(reports: CloseoutReport[]) {
  await setJSON(CLOSEOUT_REPORTS_KEY, reports);
}

export async function compileCloseoutReport(input: {
  eventId: string;
  eventTitle: string;
  hostEmail?: string | null;
  checkedInCount: number;
  remainingCount: number;
  deniedCount: number;
  capacity: number;
  checkedAttendees: CloseoutAttendee[];
  remainingAttendees: CloseoutAttendee[];
}): Promise<CloseoutReport> {
  const totalCapacity = Math.max(input.capacity, input.checkedInCount + input.remainingCount, 1);
  const noShowCount = Math.max(input.remainingCount, 0);
  const scanAttempts = Math.max(input.checkedInCount + input.deniedCount, 1);
  const scanSuccessRate = Math.round((input.checkedInCount / scanAttempts) * 100);
  const attendanceRate = Math.round((input.checkedInCount / totalCapacity) * 100);
  const entryTrustScore = Math.max(0, Math.min(100, Math.round(96 - input.deniedCount * 1.5)));

  const report: CloseoutReport = {
    id: `closeout_${input.eventId}_${Date.now()}`,
    eventId: input.eventId,
    eventTitle: input.eventTitle,
    hostEmail: input.hostEmail || 'host@getechoaccess.com',
    createdAt: new Date().toISOString(),
    checkedInCount: input.checkedInCount,
    remainingCount: input.remainingCount,
    deniedCount: input.deniedCount,
    attendanceRate,
    attendeeList: [
      ...input.checkedAttendees.map((attendee) => ({ ...attendee, status: 'checked_in' as const })),
      ...input.remainingAttendees.map((attendee) => ({ ...attendee, status: 'remaining' as const })),
    ],
    analytics: {
      totalCapacity,
      noShowCount,
      scanSuccessRate,
      entryTrustScore,
    },
    emailStatus: 'queued',
    availableDownloads: ['attendee_csv', 'attendance_pdf', 'event_analytics_pdf', 'donation_csv'],
  };

  const reports = await readReports();
  await writeReports([report, ...reports.filter((item) => item.eventId !== input.eventId)]);
  return report;
}

export async function markCloseoutReportEmailed(reportId: string) {
  const reports = await readReports();
  await writeReports(reports.map((report) => report.id === reportId ? { ...report, emailStatus: 'sent' } : report));
}

export async function getCloseoutReports() {
  const reports = await readReports();
  const storedIds = new Set(reports.map((report) => report.eventId));
  return [...reports, ...MOCK_HOST_CLOSEOUT_REPORTS.filter((report) => !storedIds.has(report.eventId))];
}

export async function getCloseoutReportForEvent(eventId: string) {
  const reports = await getCloseoutReports();
  return reports.find((report) => report.eventId === eventId) || null;
}
