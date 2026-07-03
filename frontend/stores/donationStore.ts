import { create } from 'zustand';
import type { DonationRecord, NonprofitDonationCampaign } from '../types/nonprofitDonation';
import { buildDonationCsv, getCampaignStatus } from '../services/donationCampaignService';

interface DonationState {
  records: DonationRecord[];
  addDonation: (record: DonationRecord) => void;
  getRecordsForCampaign: (campaignId: string) => DonationRecord[];
  getUserImpactRecords: () => DonationRecord[];
  getCampaignTotals: (campaign: NonprofitDonationCampaign) => NonprofitDonationCampaign;
  exportCampaignCsv: (campaignId: string) => string;
}

const seedDate = new Date().toISOString();

const SEED_RECORDS: DonationRecord[] = [
  {
    id: 'don_seed_001',
    campaignId: 'camp_gff_scholarship_evt003',
    eventId: 'evt_003',
    eventName: 'Art & Soul Exhibition',
    nonprofitName: 'Golden Futures Foundation',
    donorName: 'Demo User',
    donorEmail: 'demo@echo.events',
    amount: 25,
    donatedAt: seedDate,
    paymentStatus: 'paid',
    refundStatus: 'none',
    processingFee: 1.03,
    netDonationAmount: 23.97,
    transactionId: 'txn_seed_001',
    receiptId: 'rcpt_seed_001',
    ticketOrderId: 'order_seed_001',
    source: 'checkout',
    donationType: 'fixed',
    donorAccountType: 'echo_user',
    hidePublicName: true,
  },
];

export const useDonationStore = create<DonationState>((set, get) => ({
  records: SEED_RECORDS,
  addDonation: (record) => set((state) => ({ records: [record, ...state.records] })),
  getRecordsForCampaign: (campaignId) => get().records.filter((record) => record.campaignId === campaignId && record.paymentStatus === 'paid'),
  getUserImpactRecords: () => get().records.filter((record) => record.paymentStatus === 'paid'),
  getCampaignTotals: (campaign) => {
    // campaign.raisedAmount = historical base (from mock/API, NOT in store records)
    // records = NEW donations made during this session (no overlap with base)
    const records = get().getRecordsForCampaign(campaign.id);
    const newDonations = records.reduce((sum, record) => sum + record.amount, 0);
    const raisedAmount = Math.round((campaign.raisedAmount + newDonations) * 100) / 100;
    const donorCount = campaign.donorCount + records.length;
    return {
      ...campaign,
      raisedAmount,
      donorCount,
      status: getCampaignStatus({ ...campaign, raisedAmount }),
    };
  },
  exportCampaignCsv: (campaignId) => buildDonationCsv(get().getRecordsForCampaign(campaignId)),
}));
