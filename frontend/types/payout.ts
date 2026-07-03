/**
 * ECHO Host Payout & Reporting — Types
 * ═════════════════════════════════════
 * Based on ECHO Host Payout & Reporting Developer Build Spec v1.0
 */

export type PayoutHealthStatus = 'healthy' | 'needs_attention' | 'on_hold' | 'action_needed';
export type PayoutItemStatus = 'paid' | 'in_transit' | 'scheduled' | 'on_hold' | 'action_needed';
export type HostType = 'standard' | 'nonprofit';
export type ReportFormat = 'pdf' | 'xlsx' | 'csv';
export type DateRangeKey = 'last_7' | 'last_30' | 'this_month' | 'qtd' | 'ytd' | 'custom';
export type ActivityFilter = 'all' | 'ticket_sales' | 'donations' | 'payouts' | 'refunds';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface PayoutStatus {
  available_now: number;
  pending_settlement: number;
  on_hold: number;
  paid_out: number;
  next_payout_date: string;
  payout_health: PayoutHealthStatus;
  bank_last_four: string;
  bank_name: string;
  payout_status_label: string;
  nonprofit_note?: string;
}

export interface EventFinanceSummary {
  gross_ticket_sales: number;
  donations_received: number;
  platform_fees: number;
  processing_fees: number;
  refunds: number;
  net_ticket_proceeds: number;
  net_donations: number;
  total_net_payout: number;
}

export interface NonprofitReportingSummary {
  donations_received: number;
  total_donors: number;
  ticket_revenue: number;
  total_supporters: number;
  net_funds_delivered: number;
  reports_ready: number;
}

export interface RecentPayout {
  id: string;
  amount: number;
  payout_date: string;
  event_source: string;
  status: PayoutItemStatus;
  batch_id: string;
}

export interface FinanceAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  action_label: string;
  action_route: string;
  created_at: string;
}

export interface TaxDocument {
  id: string;
  title: string;
  type: 'monthly_statement' | 'annual_summary' | 'tax_form' | 'settlement_history';
  period: string;
  download_url: string;
  created_at: string;
}

export interface ReportExportRequest {
  report_type: 'financial_summary' | 'detailed_ledger' | 'donations' | 'payout_reconciliation' | 'attendee_donor_detail';
  format: ReportFormat;
  event_filter: string;
  date_range: DateRangeKey;
  include_donations: boolean;
  include_refunds: boolean;
  include_attendee_details: boolean;
  include_donor_details: boolean;
  group_by: 'event' | 'day' | 'payout_batch' | 'transaction_type';
}
