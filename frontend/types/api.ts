/**
 * ECHO API Request/Response Types — Canon Contract Layer
 * ══════════════════════════════════════════════════════
 * Matches ECHO_API_Contracts_v1_0.md endpoints.
 * All screens consume these types through domain services.
 *
 * Status codes: 200/201 success, 400 validation, 401 unauth,
 *   403 forbidden, 409 conflict, 429 rate-limited, 5xx server.
 */

// ─── Shared ──────────────────────────────────────────────────

export type ApiResponse<T = void> = {
  ok: boolean;
  data?: T;
  error?: ApiError;
};

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, string>;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  cursor?: string;
  has_more: boolean;
}>;

// ─── S-03: Home / Discover ───────────────────────────────────

export type EventListParams = {
  lat?: number;
  lng?: number;
  radius_miles?: number;
  start_after?: string;
  start_before?: string;
  category?: string;
  age?: number;
  cursor?: string;
  limit?: number;
};

export type EventSummary = {
  event_id: string;
  title: string;
  start_time: string;
  end_time?: string;
  venue_name: string;
  city: string;
  state: string;
  image_url?: string;
  host_name: string;
  host_verified: boolean;
  age_restriction?: number;
  price_min: number;
  price_max: number;
  tickets_sold: number;
  status: 'active' | 'sold_out' | 'cancelled' | 'ended';
};

// ─── S-04: Event Details ─────────────────────────────────────

export type EventDetail = EventSummary & {
  description: string;
  doors_time?: string;
  host_id: string;
  host_avatar_url?: string;
  host_events_count: number;
  venue_address: string;
  venue_lat: number;
  venue_lng: number;
  categories: string[];
  is_verified: boolean;
  cancellation_policy: 'flexible' | 'strict' | 'none';
  cancellation_deadline?: string;
};

export type InventoryItem = {
  ticket_type_id: string;
  name: string;
  price_cents: number;
  available: number;
  max_per_order: number;
  description?: string;
};

export type EventInventoryResponse = ApiResponse<{
  event_id: string;
  currency: string;
  items: InventoryItem[];
}>;

// ─── S-05: Checkout ──────────────────────────────────────────

export type CreateIntentRequest = {
  event_id: string;
  quantity: number;
  currency: string;
  ticket_type_id?: string;
  client_context: {
    platform: 'ios' | 'android' | 'web';
    locale: string;
  };
};

export type CheckoutIntent = {
  intent_id: string;
  status: 'requires_payment_method' | 'processing' | 'succeeded' | 'failed' | 'expired';
  expires_at: string;
  pricing: {
    subtotal: number;
    fees: number;
    tax: number;
    total: number;
    currency: string;
  };
};

export type ConfirmPaymentRequest = {
  intent_id: string;
  payment_method: {
    type: 'apple_pay' | 'google_pay' | 'card';
    token: string;
  };
  idempotency_key: string;
};

export type PaymentConfirmation = {
  status: 'succeeded' | 'failed' | 'requires_action';
  tickets: Array<{ ticket_id: string; status: string }>;
  wallet_updated: boolean;
  error_message?: string;
};

// ─── S-06: Echo Circle ───────────────────────────────────────

export type CreateCircleRequest = {
  event_id: string;
  quantity: number;
  payment_method: {
    type: 'apple_pay' | 'google_pay' | 'card';
    token: string;
  };
  idempotency_key: string;
};

export type CircleResponse = {
  circle_id: string;
  status: 'active' | 'completed' | 'expired' | 'canceled';
  event_id: string;
  requested_quantity: number;
  expires_at: string;
  invite_link: string;
  members: CircleMemberResponse[];
  replacements_used: number;
};

export type CircleMemberResponse = {
  member_id: string;
  user_id?: string;
  name?: string;
  avatar_url?: string;
  slot_index: number;
  role: 'leader' | 'member';
  status: 'invited' | 'joined' | 'paid' | 'declined' | 'expired' | 'removed';
  invite_method?: string;
  invited_at?: string;
  paid_at?: string;
};

export type CreateInviteRequest = {
  method: 'sms' | 'echo_search' | 'share_link' | 'email';
  target?: string; // phone, email, or user_id
  slot_index: number;
};

export type CreateInviteResponse = {
  invite_id: string;
  invite_url: string;
  method: string;
  expires_at: string;
};

export type JoinCircleRequest = {
  invite_token: string;
};

export type CirclePaymentRequest = {
  payment_method: {
    type: 'apple_pay' | 'google_pay' | 'card';
    token: string;
  };
  idempotency_key: string;
};

export type ReplaceRequest = {
  member_id: string;
  new_invite: CreateInviteRequest;
};

// ─── S-07: Wallet ────────────────────────────────────────────

export type WalletResponse = {
  active_tickets: WalletTicket[];
  saved_events: SavedEvent[];
  past_tickets: WalletTicket[];
};

export type WalletTicket = {
  ticket_id: string;
  event_id: string;
  event_title: string;
  event_start_time: string;
  event_end_time?: string;
  venue_name: string;
  venue_city: string;
  image_url?: string;
  ticket_type: string;
  status: 'active' | 'checked_in' | 'transferred' | 'revoked' | 'expired';
  age_restriction?: number;
  has_been_transferred: boolean;
  circle_id?: string;
  circle_claimed?: number;
  circle_total?: number;
  purchased_at: string;
};

export type SavedEvent = {
  event_id: string;
  event_title: string;
  event_start_time: string;
  venue_name: string;
  image_url?: string;
  saved_at: string;
};

// ─── S-08: View Ticket / NFC ─────────────────────────────────

export type TicketCredentialRequest = {
  ticket_id: string;
  mode: 'nfc_primary' | 'qr_fallback';
  nonce: string;
};

export type TicketCredentialResponse = {
  ticket_id: string;
  credential: {
    nfc: string;
    qr: string;
  };
  rotates_at: string;
  offline: {
    supported: boolean;
    last_synced_at: string;
  };
};

export type TicketStatusResponse = {
  ticket_id: string;
  status: 'active' | 'checked_in' | 'transferred' | 'revoked' | 'expired';
  checked_in_at?: string;
  transferred_to?: string;
};

// ─── Transfer ────────────────────────────────────────────────

export type InitiateTransferRequest = {
  ticket_id: string;
  recipient: {
    type: 'phone' | 'email' | 'echo_id';
    value: string;
  };
};

export type TransferResponse = {
  transfer_id: string;
  ticket_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  recipient_name?: string;
  initiated_at: string;
  expires_at: string; // BL-12: 24 hours from initiation
};

export type AcceptTransferRequest = {
  transfer_id: string;
};

// ─── User Search ─────────────────────────────────────────────

export type UserSearchResult = {
  user_id: string;
  name: string;
  username: string;
  avatar_url?: string;
};
