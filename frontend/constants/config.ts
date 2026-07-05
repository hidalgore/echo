// ECHO App Configuration

/**
 * Auth domain swap gate (Phase 1 / W3). 'mock' keeps the pre-backend local
 * auth; 'live' rides the real S-01/S-02 endpoints. Mock stays the default
 * until the operator smokes the staging swap — flip per environment with
 * EXPO_PUBLIC_ECHO_AUTH_MODE=live (inlined by Expo at bundle time).
 */
const AUTH_MODE: 'live' | 'mock' =
  process.env.EXPO_PUBLIC_ECHO_AUTH_MODE === 'live' ? 'live' : 'mock';

/**
 * Discovery domain swap gate (Phase 2 / W4), mirroring AUTH_MODE. 'live'
 * binds the http DiscoveryPort (S-03) and hydrates the event store from the
 * API; 'mock' keeps the bundled corpus. Mock stays the default until the
 * operator smokes the staging swap — flip per environment with
 * EXPO_PUBLIC_ECHO_DISCOVERY_MODE=live (inlined by Expo at bundle time).
 */
const DISCOVERY_MODE: 'live' | 'mock' =
  process.env.EXPO_PUBLIC_ECHO_DISCOVERY_MODE === 'live' ? 'live' : 'mock';

/**
 * Checkout domain swap gate (Phase 3 / W5), mirroring the others. 'live'
 * binds the http CheckoutPort (S-05) and routes single-checkout through the
 * real intent -> Stripe -> confirm sequence; 'mock' keeps the local simulated
 * payment. Mock stays the default until the operator smokes the staging swap
 * — flip per environment with EXPO_PUBLIC_ECHO_CHECKOUT_MODE=live (inlined by
 * Expo at bundle time).
 */
const CHECKOUT_MODE: 'live' | 'mock' =
  process.env.EXPO_PUBLIC_ECHO_CHECKOUT_MODE === 'live' ? 'live' : 'mock';

/**
 * Ticket domain swap gate (Phase 4 / W4), mirroring the others. 'live' binds
 * the http TicketPort (S-06): wallet/ticket credential display rides the
 * server's rotating tokens (the client never mints them). 'mock' keeps the
 * local fabricated credentials. Mock stays the default until the operator
 * smokes the staging swap — flip per environment with
 * EXPO_PUBLIC_ECHO_TICKET_MODE=live (inlined by Expo at bundle time).
 */
const TICKET_MODE: 'live' | 'mock' =
  process.env.EXPO_PUBLIC_ECHO_TICKET_MODE === 'live' ? 'live' : 'mock';

/**
 * Door domain swap gate (Phase 5 / W5), mirroring the others. 'live' binds
 * the http DoorPort (S-07): sessions/scans/bundles/reconcile/purchases ride
 * the door-scoped backend (device provisioned via `manage.py
 * provision_door_session`). 'mock' keeps the local simulated door. Mock stays
 * the default until the operator smokes the staging swap — flip per
 * environment with EXPO_PUBLIC_ECHO_DOOR_MODE=live (inlined by Expo at
 * bundle time).
 */
const DOOR_MODE: 'live' | 'mock' =
  process.env.EXPO_PUBLIC_ECHO_DOOR_MODE === 'live' ? 'live' : 'mock';

export const CONFIG = {
  MOCK_MODE: true,
  AUTH_MODE,
  DISCOVERY_MODE,
  CHECKOUT_MODE,
  TICKET_MODE,
  DOOR_MODE,
  /** Stripe publishable key (test mode until launch); empty = collection
   *  fails visibly at pay time, never silently. */
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  API_BASE_URL: process.env.EXPO_PUBLIC_ECHO_API_URL || 'https://api.echo.events',
  WEB_BASE_URL: 'https://getechoaccess.com',
  SEARCH_API_BASE_PATH: '/v1/search',
  APP_VERSION: '9.0.0',
  NFC_CREDENTIAL_ROTATE_INTERVAL_MS: 30_000,
  CIRCLE_MIN_TICKETS: 2,

  // ── Canonical fee model (all checkout paths) ──────────────────
  // Buyer-facing: 5% ECHO platform fee + payment processing (2.9% + $0.30)
  // Label in UI: "Service & processing fee"
  // Nonprofit waivers remove platform fee only; processing always applies.
  ECHO_PLATFORM_FEE_RATE: 0.05,        // 5% ECHO platform fee
  PAYMENT_PROCESSING_RATE: 0.029,       // 2.9% Stripe processing
  PAYMENT_PROCESSING_FLAT: 0.30,        // $0.30 Stripe flat fee

  // ── Transfer policy (BL-10, BL-11, BL-12) ────────────────────
  TRANSFER_DEADLINE_MINUTES: 60,        // BL-10: transfers disabled 60 min before event start
  TRANSFER_EXPIRY_HOURS: 24,            // BL-12: unclaimed transfers auto-return after 24 hours

  // ── Circle ────────────────────────────────────────────────────
  CIRCLE_TIMER_SECONDS: 3600,           // CIR-01: 1 hour claim window
} as const;
