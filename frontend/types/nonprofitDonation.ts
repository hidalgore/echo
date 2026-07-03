export type DonationCampaignStatus = 'active' | 'goal_reached' | 'goal_exceeded' | 'closing_soon' | 'closed';
export type DonationSource = 'checkout' | 'circle' | 'pay_for_all' | 'door' | 'campaign_page';
export type DonationType = 'fixed' | 'round_up' | 'custom';
export type DonorAccountType = 'echo_user' | 'guest';

export type DonationImpactLabel = {
  amount: number;
  label: string;
};

export type NonprofitDonationCampaign = {
  id: string;
  nonprofitName: string;
  causeTitle: string;
  causeDescription: string;
  goalAmount: number;
  raisedAmount: number;
  donorCount: number;
  suggestedAmounts: number[];
  impactLabels?: DonationImpactLabel[];
  publicPageEnabled: boolean;
  allowPublicNameOptIn: boolean;
  closesAtEventCloseout: boolean;
  status: DonationCampaignStatus;
};

export type DonationRecord = {
  id: string;
  campaignId: string;
  eventId: string;
  eventName: string;
  nonprofitName: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  donatedAt: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  refundStatus: 'none' | 'refunded' | 'partial';
  processingFee: number;
  netDonationAmount: number;
  transactionId: string;
  receiptId: string;
  ticketOrderId?: string;
  circleId?: string;
  source: DonationSource;
  donationType: DonationType;
  donorAccountType: DonorAccountType;
  hidePublicName: boolean;
};

export type DonationSelection = {
  amount: number;
  type: DonationType;
};
