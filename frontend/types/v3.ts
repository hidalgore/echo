/**
 * ECHO Event Creation V3 — Type Definitions
 * ═════════════════════════════════════════
 * Canonical types for V3 event creation flow.
 * Locked decisions: see ECHO_Event_Creation_V3_Locks_v1_1.md
 *
 * Per R3 (lifecycle migration), R6 (refund schema), R7 (presale tokens),
 * and 9A/9B (score system).
 */

// ─── Lifecycle ───────────────────────────────────────────────────────────────

/**
 * Canonical V3 event state set (R3).
 *
 * Migrations from v59.3 HostEventStatus:
 *   upcoming → scheduled
 *   live → published
 *   past → ended
 *   closed → cancelled
 * NEW: paused, cancelled (distinct from ended)
 */
export type V3EventState =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'paused'
  | 'ended'
  | 'cancelled';

// ─── Flyer Score (9B) ────────────────────────────────────────────────────────

/**
 * Flyer Score breakdown — 4 locked categories per 9B.
 * Algo internals (how each sub-score is computed) remain open.
 */
export type FlyerScoreBreakdown = {
  /** Image clarity, color contrast, layout quality (0-100) */
  visual: number;
  /** Required fields detected (title, date, venue, time, etc.) (0-100) */
  completeness: number;
  /** Clarity of call-to-action (ticket info, price visibility) (0-100) */
  cta: number;
  /** Venue identification confidence (0-100) */
  venue: number;
};

export type FlyerScore = {
  /** 0-100 (equal-weighted avg of 4 sub-scores per 9B) */
  total: number;
  breakdown: FlyerScoreBreakdown;
  /** ISO timestamp */
  computedAt: string;
};

// ─── Event Success Score (5A, 9A) ────────────────────────────────────────────

export type ESSSubScore = {
  score: number;
  /** False when data is insufficient (e.g., new market, no Trust Engine) */
  available: boolean;
  /** Optional explanation when unavailable */
  reason?: string;
};

export type EventSuccessScore = {
  /** 0-100, computed from available sub-scores only (9A) */
  total: number;
  /** 2, 3, or 4 — depends on data availability */
  divisor: number;
  subScores: {
    flyer: ESSSubScore;
    trust: ESSSubScore;
    pricing: ESSSubScore;
    competition: ESSSubScore;
  };
};

// ─── Trust Score Stub (8B) ───────────────────────────────────────────────────

/**
 * V3 stub for Trust until EchoTrustEngine ships.
 * Binary verified badge — no 0-100 score yet (8B).
 */
export type TrustScoreStub = {
  verified: boolean;
  label: 'Verified Host' | 'Unverified';
};

// ─── Refund Policy (6C, 7A, R6) ──────────────────────────────────────────────

export type RefundPresetId = 'flexible' | 'balanced' | 'strict';

export type RefundTier = {
  /** Days before event (e.g., 7 = "≤7 days before event") */
  daysBefore: number;
  /** Refund percentage (0-100) */
  refundPct: number;
};

export type RefundPolicy = {
  presetId: RefundPresetId;
  /** Tiers derived from preset; stored to preserve at-time-of-publish behavior */
  tiers: RefundTier[];
  /** Reserved for V3.1 — custom override beyond presets */
  customOverride?: RefundTier[];
};

/**
 * Canonical preset definitions (7A — ECHO customer-friendly).
 * - Flexible: 100% ≤ 48h, 0% after
 * - Balanced: 100% ≤ 7d, 50% ≤ 48h, 0% after
 * - Strict:   100% ≤ 14d, 0% after
 */
export const REFUND_PRESETS: Record<RefundPresetId, RefundTier[]> = {
  flexible: [
    { daysBefore: 2, refundPct: 100 },
    { daysBefore: 0, refundPct: 0 },
  ],
  balanced: [
    { daysBefore: 7, refundPct: 100 },
    { daysBefore: 2, refundPct: 50 },
    { daysBefore: 0, refundPct: 0 },
  ],
  strict: [
    { daysBefore: 14, refundPct: 100 },
    { daysBefore: 0, refundPct: 0 },
  ],
};

/** Human labels for UI */
export const REFUND_PRESET_LABELS: Record<RefundPresetId, { label: string; description: string }> = {
  flexible: {
    label: 'Flexible',
    description: 'Full refund up to 48 hours before the event.',
  },
  balanced: {
    label: 'Balanced',
    description: 'Full refund up to 7 days before. 50% refund up to 48 hours before.',
  },
  strict: {
    label: 'Strict',
    description: 'Full refund up to 14 days before the event.',
  },
};

// ─── Publish Readiness (3B, R5) ──────────────────────────────────────────────

export type PublishReadinessGateId =
  | 'refund_policy'
  | 'age_verification'
  | 'nfc_config'
  | 'door_mode';

export type PublishReadinessGate = {
  id: PublishReadinessGateId;
  label: string;
  ready: boolean;
  /** Why this gate is not ready (host-facing copy) */
  reason?: string;
};

export type PublishReadiness = {
  /** True iff all gates green AND flyerScore >= threshold */
  ready: boolean;
  gates: PublishReadinessGate[];
  /** Current Flyer Score (0-100) */
  flyerScore: number;
  /** Minimum Flyer Score required to publish (5B = 80) */
  flyerScoreThreshold: number;
  /** True iff Flyer Score >= threshold */
  flyerScoreReady: boolean;
};

/** Lock 5B */
export const FLYER_SCORE_PUBLISH_FLOOR = 80;

/** Lock 4B — confidence threshold for hard-block */
export const CONFIDENCE_HARD_BLOCK_THRESHOLD = 70;

// ─── Presale Invites (3C, 4C, 7B) ────────────────────────────────────────────

export type PresaleInviteStatus = 'pending' | 'consumed' | 'expired';

export type PresaleInvite = {
  /** Cryptographically generated single-use token (4C) */
  inviteToken: string;
  eventId: string;
  /** Resolved ECHO user id (3C — ECHO username-tied) */
  inviteeUserId: string;
  /** Host-set cap 1-8 per invite (7B) */
  ticketCap: number;
  /** Incremented on consumption */
  ticketsPurchased: number;
  status: PresaleInviteStatus;
  /** Set when token is consumed (4C) */
  consumedAt?: string;
  /** Token expires at presale window end OR consumption, whichever first */
  expiresAt: string;
  createdAt: string;
};

/** Lock 7B — presale cap bounds */
export const PRESALE_MIN_CAP = 1;
export const PRESALE_MAX_CAP = 8;
export const PRESALE_DEFAULT_CAP = 2; // UI default (+1 pattern)

// ─── Scheduling (2C, R4) ─────────────────────────────────────────────────────

/**
 * Three-date model per 2C.
 * salesStartDate is the floor; per-tier salesStart may override (R4) but
 * must satisfy: tier.salesStart >= event.salesStartDate.
 *
 * Per 2C: salesStartDate MAY precede publishDate (presale before public discovery).
 */
export type EventSchedule = {
  /** When event happens (ISO datetime) */
  eventDate: string;
  /** When event becomes publicly discoverable (ISO datetime) */
  publishDate: string;
  /** When tickets become buyable (ISO datetime). May be before publishDate for presale. */
  salesStartDate: string;
};

// ─── V3 Flow State Machine ───────────────────────────────────────────────────

export type V3FlowStep =
  | 'entry'    // Upload Flyer / Start From Scratch chooser
  | 'upload'   // File picker
  | 'scan'     // AI extraction in progress
  | 'review'   // Field-by-field review
  | 'health'   // Event Health Center
  | 'pulse'    // Market Pulse
  | 'schedule' // 3-date scheduler
  | 'launch';  // Post-publish Launch Center

/** Lock-aware step ordering */
export const V3_STEP_ORDER: V3FlowStep[] = [
  'entry',
  'upload',
  'scan',
  'review',
  'health',
  'pulse',
  'schedule',
  'launch',
];

// ─── AI Extraction (1B, 4B, 9B) ──────────────────────────────────────────────

export type V3ExtractionConfidence = number;

export type V3ExtractedField<T = string> = {
  /** Field identifier (e.g., 'title', 'date', 'venue') */
  key: string;
  /** Extracted value, may be edited by host */
  value: T;
  /** 0-100 confidence score from Claude Vision (4B) */
  confidence: V3ExtractionConfidence;
  /** True once host explicitly confirms (required for confidence < 70 per 1C) */
  hostConfirmed: boolean;
  /** Optional label for UI */
  label?: string;
};

export type V3ExtractionResult = {
  fields: V3ExtractedField[];
  flyerScore: FlyerScore;
  /** Raw OCR text from flyer (optional, for debugging) */
  rawText?: string;
  /** ISO timestamp */
  extractedAt: string;
};

// ─── Cancellation (5C, 2B) ───────────────────────────────────────────────────

export type CancellationRequest = {
  eventId: string;
  reason?: string;
  /** User id of cancellation initiator (must be owner or admin per 5C) */
  initiatedBy: string;
  /** Snapshot of refund policy at time of publish */
  refundPolicyAtPublish: RefundPolicy;
};

export type CancellationResult = {
  success: boolean;
  refundsIssued: number;
  totalRefundedAmount: number;
  /** Cents */
  totalRefundedCents: number;
  newState: 'cancelled';
};

// ─── RBAC (9C, R5) ───────────────────────────────────────────────────────────

/**
 * Master Build's 7-role Team Access Model.
 * V3 honors these for state transitions but doesn't build the role-management UI.
 */
export type TeamRole =
  | 'owner'
  | 'admin'
  | 'finance'
  | 'event_manager'
  | 'marketing'
  | 'door_staff'
  | 'volunteer'
  | 'security'; // Trust & Access Control RBAC (decision 1A): "Host"→owner, "Manager"→event_manager, new "Security" role

/** Lock 9C — RBAC matrix for state transitions */
export const STATE_TRANSITION_RBAC: Record<string, TeamRole[]> = {
  publish: ['owner', 'admin', 'event_manager'],
  pause: ['owner', 'admin', 'event_manager'],
  resume: ['owner', 'admin', 'event_manager'],
  cancel: ['owner', 'admin'], // Lock 5C
  end: [], // System-only (auto on event time pass)
};

// ─── ECHO Platform Locks — June 2026 Expansion ──────────────────────────────

/**
 * Canonical product language lock:
 * ECHO issues Access Passes, not generic tickets.
 * UI may still use "ticket" only when explaining buyer quantities/pricing.
 */
export type EchoCredentialName = 'Access Pass';
export const ECHO_CREDENTIAL_NAME: EchoCredentialName = 'Access Pass';

// ─── Access Tiers / VIP vs GA ───────────────────────────────────────────────

export type AccessTierId =
  | 'general_admission'
  | 'vip'
  | 'ultra_vip'
  | 'artist'
  | 'staff'
  | 'vendor'
  | 'press'
  | 'security'
  | 'sponsor'          // decision 2A — Access Control System v1 tier
  | 'backstage'        // decision 2A — promoted from zone-only to full tier
  | 'custom_host_tier';// decision 2A — host-defined tier

export type AccessTierColorToken =
  | 'green'
  | 'gold'
  | 'black_gold'
  | 'purple'
  | 'blue'
  | 'orange'
  | 'white'
  | 'red'
  | 'cyan'      // decision 2A — Sponsor
  | 'charcoal'  // Backstage
  | 'slate';    // Custom Host Tier (neutral default; host may override)

export type AccessZoneId =
  | 'main_entry'
  | 'vip_lounge'
  | 'meet_and_greet'
  | 'backstage'
  | 'after_party'
  | 'sponsor_lounge'
  | 'restricted_area'
  | 'green_room'        // decision 3A
  | 'stage_access'      // decision 3A
  | 'operations_areas'; // decision 3A

export type AccessTierDefinition = {
  id: AccessTierId;
  label: string;
  scanLabel: string;
  colorToken: AccessTierColorToken;
  allowedZones: AccessZoneId[];
  requiresAgeVerification: boolean;
  doorAlertEnabled: boolean;
};

/** Locked tier language + scan color rules. Staff must identify tier within one second. */
export const ACCESS_TIER_DEFINITIONS: Record<AccessTierId, AccessTierDefinition> = {
  general_admission: {
    id: 'general_admission',
    label: 'General Admission',
    scanLabel: 'GA Access Approved',
    colorToken: 'green',
    allowedZones: ['main_entry'],
    requiresAgeVerification: false,
    doorAlertEnabled: false,
  },
  vip: {
    id: 'vip',
    label: 'VIP',
    scanLabel: 'VIP Access Approved',
    colorToken: 'gold',
    allowedZones: ['main_entry', 'vip_lounge'],
    requiresAgeVerification: false,
    doorAlertEnabled: true,
  },
  ultra_vip: {
    id: 'ultra_vip',
    label: 'Ultra VIP',
    scanLabel: 'Ultra VIP Access Approved',
    colorToken: 'black_gold',
    allowedZones: ['main_entry', 'vip_lounge', 'meet_and_greet', 'after_party'],
    requiresAgeVerification: false,
    doorAlertEnabled: true,
  },
  artist: {
    id: 'artist',
    label: 'Artist',
    scanLabel: 'Artist Access Approved',
    colorToken: 'purple',
    allowedZones: ['main_entry', 'backstage', 'green_room', 'stage_access', 'restricted_area'],
    requiresAgeVerification: false,
    doorAlertEnabled: true,
  },
  staff: {
    id: 'staff',
    label: 'Staff',
    scanLabel: 'Staff Access Approved',
    colorToken: 'blue',
    allowedZones: ['main_entry', 'backstage', 'operations_areas', 'restricted_area'],
    requiresAgeVerification: false,
    doorAlertEnabled: false,
  },
  vendor: {
    id: 'vendor',
    label: 'Vendor',
    scanLabel: 'Vendor Access Approved',
    colorToken: 'orange',
    allowedZones: ['main_entry', 'sponsor_lounge'],
    requiresAgeVerification: false,
    doorAlertEnabled: false,
  },
  press: {
    id: 'press',
    label: 'Press',
    scanLabel: 'Press Access Approved',
    colorToken: 'white',
    allowedZones: ['main_entry', 'sponsor_lounge'],
    requiresAgeVerification: false,
    doorAlertEnabled: false,
  },
  security: {
    id: 'security',
    label: 'Security',
    scanLabel: 'Security Access Approved',
    colorToken: 'red',
    allowedZones: ['main_entry', 'vip_lounge', 'meet_and_greet', 'backstage', 'after_party', 'sponsor_lounge', 'restricted_area', 'green_room', 'stage_access', 'operations_areas'],
    requiresAgeVerification: false,
    doorAlertEnabled: false,
  },
  sponsor: {
    id: 'sponsor',
    label: 'Sponsor',
    scanLabel: 'Sponsor Access Approved',
    colorToken: 'cyan',
    allowedZones: ['main_entry', 'sponsor_lounge', 'vip_lounge'],
    requiresAgeVerification: false,
    doorAlertEnabled: true,
  },
  backstage: {
    id: 'backstage',
    label: 'Backstage',
    scanLabel: 'Backstage Access Approved',
    colorToken: 'charcoal',
    allowedZones: ['main_entry', 'backstage', 'green_room', 'stage_access', 'restricted_area'],
    requiresAgeVerification: false,
    doorAlertEnabled: true,
  },
  custom_host_tier: {
    id: 'custom_host_tier',
    label: 'Custom Tier',
    scanLabel: 'Access Approved',
    colorToken: 'slate',
    // Host-defined; defaults to main entry until the host assigns permissions.
    allowedZones: ['main_entry'],
    requiresAgeVerification: false,
    doorAlertEnabled: false,
  },
};

export type AccessPassCredential = {
  passId: string;
  eventId: string;
  holderUserId?: string;
  holderName?: string;
  tierId: AccessTierId;
  zoneIds: AccessZoneId[];
  ageBadge?: 'none' | '18+' | '21+';
  deliveryMethods: Array<'apple_wallet' | 'google_wallet' | 'echo_app' | 'nfc_credential' | 'qr_fallback'>;
  transferLocked?: boolean;
  circleId?: string;
};

// ─── Guest Access Control ───────────────────────────────────────────────────

export type GuestAccessState = 'approved' | 'flagged' | 'security_hold' | 'denied';
export type GuestRestrictionLevel = 'event' | 'venue' | 'host' | 'echo_trust';
export type GuestDenialReason =
  | 'age_verification_failed'
  | 'duplicate_attempt'
  | 'chargeback_or_fraud_risk'
  | 'host_denied'
  | 'venue_restriction'
  | 'safety_concern'
  | 'restricted_zone'
  | 'manual_security_decision';

export type GuestAccessDecision = {
  state: GuestAccessState;
  restrictionLevel?: GuestRestrictionLevel;
  reason?: GuestDenialReason;
  quietCheckInAlert: boolean;
  guestFacingMessage: string;
  staffFacingMessage: string;
  appealEligible: boolean;
  decidedByRole?: TeamRole;
  decidedByUserId?: string;
  decidedAt: string;
};

export type GuestAccessAuditRecord = {
  auditId: string;
  eventId: string;
  passId?: string;
  guestUserId?: string;
  previousState?: GuestAccessState;
  nextState: GuestAccessState;
  reason?: GuestDenialReason;
  role: TeamRole;
  actorUserId: string;
  note?: string;
  createdAt: string;
};

export type GuestAccessPolicy = {
  enabled: boolean;
  allowHostDeny: boolean;
  requireDenialReason: boolean;
  immutableAuditTrail: boolean;
  securityHoldQueueEnabled: boolean;
  appealFlowEnabled: boolean;
  quietAlertEnabled: boolean;
};

export const DEFAULT_GUEST_ACCESS_POLICY: GuestAccessPolicy = {
  enabled: true,
  allowHostDeny: true,
  requireDenialReason: true,
  immutableAuditTrail: true,
  securityHoldQueueEnabled: true,
  appealFlowEnabled: true,
  quietAlertEnabled: true,
};

// ─── Licensing / Subscription Locks ─────────────────────────────────────────

export type EchoLicenseTierId = 'launch' | 'pro' | 'elite';
export type EchoHardwareEntitlement = 'disc_core' | 'disc_pro_available';
export type EchoLicenseFeatureId =
  | 'public_event_checkout'
  | 'wallet_first_access'
  | 'nfc_door_mode'
  | 'flyer_ai_scan'
  | 'scheduled_publish'
  | 'guest_access_control'
  | 'vip_access_tiers'
  | 'market_pulse'
  | 'event_success_score'
  | 'advanced_analytics'
  | 'team_roles'
  | 'nonprofit_donations'
  | 'priority_support'
  | 'verified_venue_program'
  | 'agency_workspace'
  | 'trusted_device_network'
  | 'payout_security_hold'
  | 'rotating_qr'
  | 'nfc_challenge_response'
  | 'trusted_hardware_registry'
  | 'emergency_lockdown'
  | 'ai_trust_assistant';

export type EchoLicenseTier = {
  id: EchoLicenseTierId;
  name: string;
  monthlyPriceUsd: number;
  includedHardware: EchoHardwareEntitlement[];
  featureIds: EchoLicenseFeatureId[];
  positioning: string;
};

export const ECHO_LICENSE_TIERS: Record<EchoLicenseTierId, EchoLicenseTier> = {
  launch: {
    id: 'launch',
    name: 'Launch',
    monthlyPriceUsd: 29,
    includedHardware: ['disc_core'],
    featureIds: [
      'public_event_checkout',
      'wallet_first_access',
      'nfc_door_mode',
      'flyer_ai_scan',
      'scheduled_publish',
      'vip_access_tiers',
    ],
    positioning: 'For new hosts, nonprofits, small promoters, and first events.',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPriceUsd: 99,
    includedHardware: ['disc_core', 'disc_pro_available'],
    featureIds: [
      'public_event_checkout',
      'wallet_first_access',
      'nfc_door_mode',
      'flyer_ai_scan',
      'scheduled_publish',
      'guest_access_control',
      'vip_access_tiers',
      'market_pulse',
      'event_success_score',
      'team_roles',
      'nonprofit_donations',
    ],
    positioning: 'For recurring hosts that need better control, access tiers, and event intelligence.',
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    monthlyPriceUsd: 299,
    includedHardware: ['disc_core', 'disc_pro_available'],
    featureIds: [
      'public_event_checkout',
      'wallet_first_access',
      'nfc_door_mode',
      'flyer_ai_scan',
      'scheduled_publish',
      'guest_access_control',
      'vip_access_tiers',
      'market_pulse',
      'event_success_score',
      'advanced_analytics',
      'team_roles',
      'nonprofit_donations',
      'priority_support',
    ],
    positioning: 'For premium operators, high-volume hosts, multi-zone venues, and flagship events.',
  },
};

// ─── Scheduled Publish Upgrade ──────────────────────────────────────────────

export type ScheduledPublishMode = 'publish_now' | 'schedule_public_launch';
export type ScheduledPublishValidationCode =
  | 'missing_event_date'
  | 'missing_publish_date'
  | 'missing_sales_start_date'
  | 'publish_after_event'
  | 'sales_after_event'
  | 'tier_sales_before_floor';

export type ScheduledPublishValidationResult = {
  valid: boolean;
  codes: ScheduledPublishValidationCode[];
  hostMessage: string;
};

export type ScheduledPublishConfig = EventSchedule & {
  mode: ScheduledPublishMode;
  timezone?: string;
  publicLaunchLabel: string;
  salesStartLabel: string;
  allowPresaleBeforePublicLaunch: boolean;
};

// ─── Website / Public Web Locks ─────────────────────────────────────────────

export type EchoWebsiteAudiencePillar = 'hosts' | 'guests' | 'nonprofits';

export type EchoWebsiteLock = {
  publicHomepageRoute: '/';
  hostEntryRoute: '/host';
  builtInsideExpoReactNativeWeb: true;
  primaryAudience: 'hosts';
  secondaryAudience: 'event_discovery';
  nonprofitPlacement: 'supporting_section_under_for_hosts';
  heroStatement: 'The new front door for live events.';
  heroFloatingCards: ['NFC Ready', '21+ Verified', 'ECHO Circle', 'Mobile Wallet'];
  heroPhoneSurface: 'ECHO Home / Discover screen';
  websitePromise: 'ECHO connects discovery, wallet tickets, NFC entry, age verification, group purchasing, donations, and host intelligence into one seamless access platform.';
};

export const ECHO_WEBSITE_LOCK: EchoWebsiteLock = {
  publicHomepageRoute: '/',
  hostEntryRoute: '/host',
  builtInsideExpoReactNativeWeb: true,
  primaryAudience: 'hosts',
  secondaryAudience: 'event_discovery',
  nonprofitPlacement: 'supporting_section_under_for_hosts',
  heroStatement: 'The new front door for live events.',
  heroFloatingCards: ['NFC Ready', '21+ Verified', 'ECHO Circle', 'Mobile Wallet'],
  heroPhoneSurface: 'ECHO Home / Discover screen',
  websitePromise: 'ECHO connects discovery, wallet tickets, NFC entry, age verification, group purchasing, donations, and host intelligence into one seamless access platform.',
};

export type WebAgeVerificationHandoff = {
  requiredBeforePayment: true;
  handoffMethods: Array<'qr_to_phone' | 'sms_link' | 'email_link'>;
  returnToCheckout: true;
  failureBlocksPayment: true;
  copy: {
    title: string;
    body: string;
    success: string;
    failure: string;
  };
};

export const WEB_AGE_VERIFICATION_HANDOFF: WebAgeVerificationHandoff = {
  requiredBeforePayment: true,
  handoffMethods: ['qr_to_phone', 'sms_link', 'email_link'],
  returnToCheckout: true,
  failureBlocksPayment: true,
  copy: {
    title: 'Verify on your phone to continue',
    body: 'This event requires age verification before payment. ECHO will bring you back to checkout when verification is complete.',
    success: 'Age verified. Continue checkout.',
    failure: 'We could not verify eligibility for this event.',
  },
};

// ─── Calm AI UX / Picked For You Locks ──────────────────────────────────────

export type PickedForYouReason =
  | 'similar_to_viewed'
  | 'category_interest'
  | 'near_user_area'
  | 'weekend_match'
  | 'similar_to_saved'
  | 'host_interest'
  | 'price_match'
  | 'group_friendly'
  | 'donation_available'
  | 'trending_nearby';

export type PickedForYouEvent = {
  eventId: string;
  score: number;
  reasons: PickedForYouReason[];
  primaryReasonLabel: string;
};

export const PICKED_FOR_YOU_REASON_LABELS: Record<PickedForYouReason, string> = {
  similar_to_viewed: 'Similar to events you viewed',
  category_interest: 'Matches your event style',
  near_user_area: 'Popular near you',
  weekend_match: 'Weekend match',
  similar_to_saved: 'Similar to saved events',
  host_interest: 'From a host you viewed',
  price_match: 'Matches your price range',
  group_friendly: 'Good for your group style',
  donation_available: 'Donation available',
  trending_nearby: 'Trending nearby',
};


// ─── Canonical Access Control Failure Reasons ───────────────────────────────

export type AccessFailureReason =
  | 'payment_reversed'
  | 'age_verification_required'
  | 'credential_already_used'
  | 'credential_suspended'
  | 'access_not_authorized'
  | 'offline_cache_expired'
  | 'signed_credential_invalid'
  | 'nfc_challenge_failed';

export type AccessIssueResolutionAction =
  | 'view_details'
  | 'supervisor_override'
  | 'contact_host'
  | 'place_security_hold'
  | 'reverse_decision'
  | 'escalate_to_echo_trust';

export type SecurityAction = 'flag' | 'hold' | 'approve' | 'deny' | 'reverse' | 'escalate';

export type AITrustAssistantRecommendation = {
  recommendationId: string;
  eventId: string;
  guestUserId?: string;
  passId?: string;
  suggestedAction: SecurityAction;
  confidence: number;
  reasons: string[];
  recommendationOnly: true;
  humanFinalDecisionRequired: true;
  createdAt: string;
};
