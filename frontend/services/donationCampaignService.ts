import type { DonationCampaignStatus, DonationRecord, DonationSelection, NonprofitDonationCampaign } from '../types/nonprofitDonation';
import { CONFIG } from '../constants/config';

const round = (n: number) => Math.round(n * 100) / 100;

export function getCampaignStatus(campaign: NonprofitDonationCampaign): DonationCampaignStatus {
  if (campaign.status === 'closed') return 'closed';
  if (campaign.raisedAmount > campaign.goalAmount) return 'goal_exceeded';
  if (campaign.raisedAmount >= campaign.goalAmount) return 'goal_reached';
  return campaign.status || 'active';
}

export function getCampaignProgressPercent(campaign: NonprofitDonationCampaign): number {
  if (!campaign.goalAmount) return 0;
  return Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
}

export function formatDonationCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export function computeDonationProcessingFee(amount: number): number {
  if (amount <= 0) return 0;
  return round(amount * CONFIG.PAYMENT_PROCESSING_RATE + CONFIG.PAYMENT_PROCESSING_FLAT);
}

export function buildDonationRecord(input: {
  campaign: NonprofitDonationCampaign;
  eventId: string;
  eventName: string;
  donorName: string;
  donorEmail: string;
  selection: DonationSelection;
  ticketOrderId?: string;
  circleId?: string;
  source?: DonationRecord['source'];
  donorAccountType?: DonationRecord['donorAccountType'];
  hidePublicName?: boolean;
}): DonationRecord {
  const processingFee = computeDonationProcessingFee(input.selection.amount);
  const now = new Date().toISOString();
  return {
    id: `don_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    campaignId: input.campaign.id,
    eventId: input.eventId,
    eventName: input.eventName,
    nonprofitName: input.campaign.nonprofitName,
    donorName: input.donorName,
    donorEmail: input.donorEmail,
    amount: round(input.selection.amount),
    donatedAt: now,
    paymentStatus: 'paid',
    refundStatus: 'none',
    processingFee,
    netDonationAmount: round(input.selection.amount - processingFee),
    transactionId: `txn_${Date.now()}`,
    receiptId: `rcpt_${Date.now()}`,
    ticketOrderId: input.ticketOrderId,
    circleId: input.circleId,
    source: input.source || 'checkout',
    donationType: input.selection.type,
    donorAccountType: input.donorAccountType || 'echo_user',
    hidePublicName: input.hidePublicName ?? true,
  };
}

const csvSafe = (value: string | number | undefined) => {
  const raw = value === undefined ? '' : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
};

export function buildDonationCsv(records: DonationRecord[]): string {
  const headers = [
    'Campaign Name', 'Event Name', 'Nonprofit Organization', 'Donor Name', 'Donor Email',
    'Donation Amount', 'Donation Date', 'Donation Time', 'Payment Status', 'Refund Status',
    'Processing Fee', 'Net Donation Amount', 'Transaction ID', 'Receipt ID', 'Ticket Order ID',
    'ECHO Circle ID', 'Donation Source', 'Donation Type', 'Donor Account Type',
  ];
  const rows = records.map((record) => {
    const donated = new Date(record.donatedAt);
    return [
      record.campaignId,
      record.eventName,
      record.nonprofitName,
      record.donorName,
      record.donorEmail,
      record.amount.toFixed(2),
      donated.toLocaleDateString('en-US'),
      donated.toLocaleTimeString('en-US'),
      record.paymentStatus,
      record.refundStatus,
      record.processingFee.toFixed(2),
      record.netDonationAmount.toFixed(2),
      record.transactionId,
      record.receiptId,
      record.ticketOrderId,
      record.circleId,
      record.source,
      record.donationType,
      record.donorAccountType,
    ].map(csvSafe).join(',');
  });
  return [headers.map(csvSafe).join(','), ...rows].join('\n');
}
