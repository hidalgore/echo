/**
 * ECHO Web Platform v2 MVP — Canonical web-side contracts
 * --------------------------------------------------------
 * These types describe the full web operating layer: public site,
 * marketplace, web checkout, age-verification handoff, buyer web wallet,
 * ECHO Circle web flows, host command center, reports, payouts, and
 * secondary nonprofit tooling.
 */

export type EchoWebAudience =
  | 'guest'
  | 'ticket_buyer'
  | 'host'
  | 'verified_host'
  | 'verified_nonprofit_host'
  | 'admin';

export type EchoWebPriority = 'host_acquisition' | 'event_discovery' | 'nonprofit_support';

export type EchoWebNavItem = {
  label: string;
  route: string;
  primary?: boolean;
  secondary?: boolean;
};

export type EchoWebHeroSignal = {
  id: string;
  label: string;
  value: string;
  description: string;
  priority: 'hero' | 'supporting';
};

export type EchoWebSearchFilter =
  | 'query'
  | 'location'
  | 'date'
  | 'category'
  | 'age'
  | 'price'
  | 'verified_host'
  | 'circle_available';

export type WebAgeVerificationHandoffStatus =
  | 'not_required'
  | 'required'
  | 'waiting_for_phone'
  | 'verification_in_progress'
  | 'verified'
  | 'failed'
  | 'expired';

export type WebAgeVerificationHandoffMethod = 'qr' | 'sms' | 'email' | 'app_deep_link' | 'mobile_web';

export type WebAgeVerificationHandoffSession = {
  session_id: string;
  checkout_id: string;
  event_id: string;
  age_requirement: 18 | 21;
  status: WebAgeVerificationHandoffStatus;
  methods: WebAgeVerificationHandoffMethod[];
  expires_at: string;
  return_url: string;
  no_payment_before_verified: true;
  checkout_state_preserved: true;
};

export type EchoWebCheckoutPath = 'single_ticket' | 'pay_for_all' | 'start_echo_circle' | 'circle_recipient_claim';

export type EchoWebCheckoutGuardrail = {
  id: string;
  label: string;
  rule: string;
  blocking: boolean;
};

export type EchoWebWorkspaceTab =
  | 'overview'
  | 'sales'
  | 'guests'
  | 'circle'
  | 'door'
  | 'payouts'
  | 'reports'
  | 'settings';

export type EchoWebCreateEventStep =
  | 'basics'
  | 'media'
  | 'tickets'
  | 'access_rules'
  | 'echo_circle'
  | 'market_pulse'
  | 'nonprofit_tools'
  | 'review_publish';
