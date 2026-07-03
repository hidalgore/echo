import type { DonationRecord, NonprofitDonationCampaign } from './nonprofitDonation';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string | null;
  created_at?: string;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  available: number;
  description?: string;
}

export type EventStatus = 'draft' | 'scheduled' | 'on_sale' | 'live' | 'ended';
export type EventDetailMediaType = 'image' | 'video';

export interface Event {
  id: string;
  title: string;
  description: string;
  venue_id?: string;
  venue_name: string;
  venue_address: string;
  start_time: string;
  end_time: string;
  /** Home/discovery still image. Home cards must always use this static image. */
  image_url?: string;
  /** Event Details hero media. Can be the same photo as image_url or a host-uploaded video. */
  detail_media_url?: string;
  detail_media_type?: EventDetailMediaType;
  /** Poster/fallback image used before video loads and for reduced/offline states. */
  detail_media_poster_url?: string;
  /** Event Details video duration in seconds. Locked maximum: 30 seconds. */
  detail_media_duration_seconds?: number | null;
  category: string;
  is_featured?: boolean;
  host_name?: string;
  host_verified?: boolean;
  ticket_types: TicketType[];
  status?: EventStatus;
  age_restriction?: number | null;
  allow_refunds?: boolean;
  allow_transfers?: boolean;
  donation_campaign?: NonprofitDonationCampaign | null;
  /** Host-locked override for Social Energy display. If absent, derived from event signals. */
  social_energy_override?: import('./socialEnergy').SocialEnergy;
}


export interface TicketMixItem {
  tier_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Ticket {
  id: string;
  event_id: string;
  user_id: string;
  ticket_type_id: string;
  status: 'active' | 'used' | 'transferred' | 'refunded' | 'checked_in';
  qr_code: string;
  nfc_credential?: string;
  purchased_at: string;
  price_paid: number;
  holder_name?: string;
  quantity?: number;
  total_quantity?: number;
  ticket_mix?: TicketMixItem[];
  subtotal?: number;
  fees?: number;
  total?: number;
  payment_status?: 'paid' | 'pending' | 'failed' | 'refunded';
  access_status?: 'active' | 'used' | 'transferred' | 'refunded' | 'checked_in' | 'expired';
  grouped_ticket_record?: boolean;
  transfer_deadline_minutes?: number;
  circle?: EchoCircleStatus | null;
  donation_summary?: DonationRecord | null;
}


export interface EchoCircleParticipant {
  id: string;
  name: string;
  avatar_url?: string | null;
  role: 'organizer' | 'member';
  status: 'paid' | 'awaiting' | 'declined';
  ticketCount?: number;
  isCurrentUser?: boolean;
}

export interface EchoCircleStatus {
  circle_id: string;
  role: 'organizer' | 'invited';
  total_slots: number;
  claimed_slots: number;
  closes_at: string;
  participants: EchoCircleParticipant[];
  user_status: 'paid' | 'awaiting' | 'declined';
}


export type SearchResultType = 'event' | 'help' | 'support';

export interface SearchFilters {
  date?: string;
  price?: string;
  age?: string;
  distance?: string;
  categories?: string[];
  venueType?: string;
  accessibility?: string[];
  sortBy?: string;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  query: string;
  icon?: string;
  type?: SearchResultType | 'preset';
}

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  body?: string;
  icon?: string;
  route?: string;
  event_id?: string;
  ctaLabel?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  suggestions: SearchSuggestion[];
  counts: {
    all: number;
    events: number;
    help: number;
    support: number;
  };
}
