/**
 * ECHO Host Payout — Mock Service
 * ════════════════════════════════
 */
import type {
  PayoutStatus, EventFinanceSummary, NonprofitReportingSummary,
  RecentPayout, FinanceAlert, TaxDocument,
} from '../types/payout';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const MOCK_PAYOUT_STATUS: PayoutStatus = {
  available_now: 8410.00,
  pending_settlement: 2340.00,
  on_hold: 450.00,
  paid_out: 18640.00,
  next_payout_date: '2025-04-28T00:00:00Z',
  payout_health: 'healthy',
  bank_last_four: '4821',
  bank_name: 'Chase',
  payout_status_label: 'Payouts active',
  nonprofit_note: 'Includes cleared donations',
};

export const MOCK_FINANCE_SUMMARY: EventFinanceSummary = {
  gross_ticket_sales: 24850.00,
  donations_received: 3200.00,
  platform_fees: 1242.50,
  processing_fees: 821.46,
  refunds: 1200.00,
  net_ticket_proceeds: 21586.04,
  net_donations: 2904.00,
  total_net_payout: 24490.04,
};

export const MOCK_NONPROFIT_SUMMARY: NonprofitReportingSummary = {
  donations_received: 3200.00,
  total_donors: 47,
  ticket_revenue: 24850.00,
  total_supporters: 312,
  net_funds_delivered: 24490.04,
  reports_ready: 3,
};

export const MOCK_RECENT_PAYOUTS: RecentPayout[] = [
  { id: 'po_1', amount: 4180.00, payout_date: '2025-04-15T00:00:00Z', event_source: 'Jazz & Wine Night', status: 'paid', batch_id: 'b_001' },
  { id: 'po_2', amount: 2340.00, payout_date: '2025-04-08T00:00:00Z', event_source: 'Midnight Pulse', status: 'paid', batch_id: 'b_002' },
  { id: 'po_3', amount: 1890.00, payout_date: '2025-03-28T00:00:00Z', event_source: 'Rooftop Sessions', status: 'paid', batch_id: 'b_003' },
  { id: 'po_4', amount: 3100.00, payout_date: '2025-04-25T00:00:00Z', event_source: 'Neon Dreams', status: 'scheduled', batch_id: 'b_004' },
  { id: 'po_5', amount: 680.00, payout_date: '2025-04-22T00:00:00Z', event_source: 'Open Mic Friday', status: 'in_transit', batch_id: 'b_005' },
];

export const MOCK_ALERTS: FinanceAlert[] = [];

export const MOCK_TAX_DOCS: TaxDocument[] = [
  { id: 'td_1', title: 'March 2025 Payout Statement', type: 'monthly_statement', period: 'Mar 2025', download_url: '#', created_at: '2025-04-01T00:00:00Z' },
  { id: 'td_2', title: 'February 2025 Payout Statement', type: 'monthly_statement', period: 'Feb 2025', download_url: '#', created_at: '2025-03-01T00:00:00Z' },
  { id: 'td_3', title: '2024 Annual Summary', type: 'annual_summary', period: '2024', download_url: '#', created_at: '2025-01-15T00:00:00Z' },
];

export async function getPayoutStatus(): Promise<PayoutStatus> {
  await delay(300);
  return MOCK_PAYOUT_STATUS;
}

export async function getEventFinanceSummary(): Promise<EventFinanceSummary> {
  await delay(200);
  return MOCK_FINANCE_SUMMARY;
}

export async function getNonprofitSummary(): Promise<NonprofitReportingSummary> {
  await delay(200);
  return MOCK_NONPROFIT_SUMMARY;
}

export async function getRecentPayouts(): Promise<RecentPayout[]> {
  await delay(200);
  return MOCK_RECENT_PAYOUTS;
}

export async function getFinanceAlerts(): Promise<FinanceAlert[]> {
  await delay(100);
  return MOCK_ALERTS;
}

export async function getTaxDocuments(): Promise<TaxDocument[]> {
  await delay(200);
  return MOCK_TAX_DOCS;
}

export type PayoutReadinessState = 'ready' | 'needs_setup' | 'on_hold' | 'scheduled';

export interface PayoutReadinessChecklistItem {
  label: string;
  complete: boolean;
  detail: string;
}

export interface PayoutReadinessSummary {
  state: PayoutReadinessState;
  title: string;
  subtitle: string;
  estimatedArrivalLabel: string;
  checklist: PayoutReadinessChecklistItem[];
}

export async function getPayoutReadinessSummary(): Promise<PayoutReadinessSummary> {
  const status = await getPayoutStatus();
  const alerts = await getFinanceAlerts();
  const hasHold = status.on_hold > 0 || alerts.some((alert) => alert.severity === 'critical' || alert.severity === 'warning');
  const hasBank = !!status.bank_last_four;
  const hasAvailable = status.available_now > 0;

  if (!hasBank) {
    return {
      state: 'needs_setup',
      title: 'Payout setup needed',
      subtitle: 'Connect a bank account before ECHO can send host payouts.',
      estimatedArrivalLabel: 'Not scheduled',
      checklist: [
        { label: 'Bank connected', complete: false, detail: 'Add payout account' },
        { label: 'Identity verified', complete: true, detail: 'Mock host verified' },
        { label: 'Reports ready', complete: true, detail: 'CSV and PDF exports available' },
      ],
    };
  }

  if (hasHold) {
    return {
      state: 'on_hold',
      title: 'Payout review active',
      subtitle: 'Some funds are on hold because of refunds, disputes, or donation closeout review.',
      estimatedArrivalLabel: status.next_payout_date ? new Date(status.next_payout_date).toLocaleDateString() : 'Pending review',
      checklist: [
        { label: 'Bank connected', complete: true, detail: `${status.bank_name || 'Bank'} ····${status.bank_last_four}` },
        { label: 'Hold reviewed', complete: false, detail: `$${status.on_hold.toFixed(2)} currently held` },
        { label: 'Reports ready', complete: true, detail: 'Finance summary available' },
      ],
    };
  }

  return {
    state: hasAvailable ? 'ready' : 'scheduled',
    title: hasAvailable ? 'Payout ready' : 'Payout scheduled',
    subtitle: hasAvailable ? 'Available balance is ready for the next payout batch.' : 'Ticket proceeds are settling and will release after the standard window.',
    estimatedArrivalLabel: status.next_payout_date ? new Date(status.next_payout_date).toLocaleDateString() : 'Next payout batch',
    checklist: [
      { label: 'Bank connected', complete: true, detail: `${status.bank_name || 'Bank'} ····${status.bank_last_four}` },
      { label: 'Funds settled', complete: hasAvailable, detail: `$${status.available_now.toFixed(2)} available now` },
      { label: 'Donation report', complete: true, detail: status.nonprofit_note || 'Donation closeout ready' },
    ],
  };
}
