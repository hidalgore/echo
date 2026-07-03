// ECHO App Configuration
export const CONFIG = {
  MOCK_MODE: true,
  API_BASE_URL: 'https://api.echo.events',
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
