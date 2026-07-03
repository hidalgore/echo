/**
 * ECHO Onboarding — State Types
 * ═════════════════════════════
 * Central state model for the state-aware first-launch experience.
 * The app routes from this model, not from screen order alone.
 * Re-homed from spec `src/onboarding/onboardingTypes.ts` into the flat repo.
 */

export type OnboardingLaunchSource =
  | 'organic_app_store'
  | 'event_invite_link'
  | 'echo_circle_invite'
  | 'ticket_purchase_return'
  | 'wallet_pass_link'
  | 'host_referral'
  | 'qr_scan'
  | 'nfc_tap'
  | 'web_checkout_redirect'
  | 'unknown';

export type OnboardingUserPath =
  | 'explore_events'
  | 'claim_invite'
  | 'claim_ticket'
  | 'join_circle'
  | 'host_events'
  | 'returning_user'
  | 'undecided';

export type OnboardingProgressState =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'abandoned'
  | 'resume_available'
  | 'reset_requested';

export type AccountState =
  | 'guest'
  | 'anonymous_session'
  | 'email_started'
  | 'email_verified'
  | 'oauth_connected'
  | 'account_created'
  | 'returning_authenticated'
  | 'account_recovery_needed'
  | 'suspended_or_restricted';

export type AgeEligibilityState =
  | 'not_required'
  | 'required_before_purchase'
  | 'required_before_entry'
  | 'verification_started'
  | 'verified_18_plus'
  | 'verified_21_plus'
  | 'verification_failed'
  | 'verification_expired'
  | 'verification_skipped'
  | 'underage_blocked';

export type PermissionState =
  | 'not_requested'
  | 'explained'
  | 'requested'
  | 'granted'
  | 'denied'
  | 'limited'
  | 'blocked_in_settings';

export type PermissionType =
  | 'location'
  | 'notifications'
  | 'wallet'
  | 'contacts'
  | 'camera'
  | 'bluetooth'
  | 'nfc';

export type WalletCapabilityState =
  | 'available'
  | 'not_available'
  | 'permission_needed'
  | 'pass_created'
  | 'pass_added'
  | 'pass_add_failed'
  | 'pass_removed'
  | 'wallet_skipped';

export type EchoPassState =
  | 'demo_pass'
  | 'active_user_pass'
  | 'ticket_bound_pass'
  | 'circle_bound_pass'
  | 'wallet_ready'
  | 'wallet_added'
  | 'expired'
  | 'revoked'
  | 'offline_available'
  | 'sync_required';

export type PersonalizationState =
  | 'not_started'
  | 'city_selected'
  | 'interests_selected'
  | 'event_energy_selected'
  | 'budget_selected'
  | 'group_style_selected'
  | 'complete'
  | 'skipped'
  | 'needs_refresh';

export type RecommendationReadinessState =
  | 'no_signal'
  | 'location_only'
  | 'interest_based'
  | 'behavior_based'
  | 'purchase_based'
  | 'mature_profile';

export type MarketAvailabilityState =
  | 'healthy_market'
  | 'limited_events'
  | 'no_local_events'
  | 'nearby_city_available'
  | 'coming_soon_market'
  | 'host_demand_needed';

export type InviteClaimState =
  | 'valid_invite'
  | 'expired_invite'
  | 'already_claimed'
  | 'claim_window_open'
  | 'claim_window_not_started'
  | 'claim_window_closed'
  | 'requires_account'
  | 'requires_age_verification'
  | 'requires_payment'
  | 'claimed_successfully'
  | 'claim_failed';

export type EchoCircleEntryState =
  | 'not_circle_related'
  | 'circle_invite_detected'
  | 'circle_open'
  | 'circle_full'
  | 'claim_available'
  | 'claim_pending'
  | 'claim_expired'
  | 'payment_required'
  | 'member_joined'
  | 'member_declined';

export type HostIntentState =
  | 'none'
  | 'curious'
  | 'host_referral_detected'
  | 'started_host_application'
  | 'existing_host'
  | 'host_pending_review'
  | 'host_approved'
  | 'host_rejected';

export type TrustOnboardingState =
  | 'normal'
  | 'new_device'
  | 'suspicious_link'
  | 'high_risk_claim'
  | 'payment_risk'
  | 'restricted_account'
  | 'manual_review_required';

export type NetworkState =
  | 'online'
  | 'slow_connection'
  | 'offline'
  | 'sync_pending'
  | 'retry_required';

export type FirstActionState =
  | 'none'
  | 'saved_first_event'
  | 'followed_first_host'
  | 'added_wallet_pass'
  | 'claimed_invite'
  | 'joined_circle'
  | 'viewed_event_detail'
  | 'started_checkout'
  | 'completed_purchase';

export type NotificationIntentState =
  | 'ticket_updates'
  | 'event_reminders'
  | 'circle_claim_alerts'
  | 'price_or_release_alerts'
  | 'host_updates'
  | 'security_access_alerts'
  | 'not_now';

export type ConsentState =
  | 'terms_not_seen'
  | 'terms_accepted'
  | 'privacy_seen'
  | 'privacy_accepted'
  | 'marketing_opt_in'
  | 'marketing_opt_out'
  | 'location_personalization_opt_in'
  | 'ai_personalization_opt_in'
  | 'ai_personalization_limited';

export type DeviceCapabilityState = {
  nfcSupported: boolean;
  walletSupported: boolean;
  cameraAvailable: boolean;
  biometricsAvailable: boolean;
  notificationsAvailable: boolean;
  locationAvailable: boolean;
  reduceMotionEnabled: boolean;
  screenReaderEnabled: boolean;
};

/** Personalization selections captured on the Event Energy screen. */
export type EventEnergySelections = {
  interests: string[];
  groupStyle: string | null;
  budget: string | null;
  city: string | null;
};

export type EchoOnboardingState = {
  launchSource: OnboardingLaunchSource;
  userPath: OnboardingUserPath;
  progress: OnboardingProgressState;
  account: AccountState;
  ageEligibility: AgeEligibilityState;
  permissions: Record<PermissionType, PermissionState>;
  wallet: WalletCapabilityState;
  echoPass: EchoPassState;
  personalization: PersonalizationState;
  recommendationReadiness: RecommendationReadinessState;
  marketAvailability: MarketAvailabilityState;
  inviteClaim?: InviteClaimState;
  circleEntry?: EchoCircleEntryState;
  hostIntent?: HostIntentState;
  trustState: TrustOnboardingState;
  deviceCapabilities: DeviceCapabilityState;
  network: NetworkState;
  firstAction: FirstActionState;
  consent: ConsentState[];
  energy: EventEnergySelections;
  lastCompletedStep?: string;
  startedAt?: string;
  completedAt?: string;
};

export const DEFAULT_DEVICE_CAPABILITIES: DeviceCapabilityState = {
  nfcSupported: false,
  walletSupported: false,
  cameraAvailable: true,
  biometricsAvailable: false,
  notificationsAvailable: true,
  locationAvailable: true,
  reduceMotionEnabled: false,
  screenReaderEnabled: false,
};

export const DEFAULT_ONBOARDING_STATE: EchoOnboardingState = {
  launchSource: 'unknown',
  userPath: 'undecided',
  progress: 'not_started',
  account: 'guest',
  ageEligibility: 'not_required',
  permissions: {
    location: 'not_requested',
    notifications: 'not_requested',
    wallet: 'not_requested',
    contacts: 'not_requested',
    camera: 'not_requested',
    bluetooth: 'not_requested',
    nfc: 'not_requested',
  },
  wallet: 'not_available',
  echoPass: 'demo_pass',
  personalization: 'not_started',
  recommendationReadiness: 'no_signal',
  marketAvailability: 'healthy_market',
  trustState: 'normal',
  deviceCapabilities: DEFAULT_DEVICE_CAPABILITIES,
  network: 'online',
  firstAction: 'none',
  consent: ['terms_not_seen'],
  energy: { interests: [], groupStyle: null, budget: null, city: null },
};
