/**
 * ECHO UX Enhancement Registry
 * ════════════════════════════
 * Tracks which market/upcoming UX patterns are already built into ECHO and how
 * they should appear in product copy. This prevents feature drift.
 */

export type EchoUxEnhancementId =
  | 'calm_ai_discovery'
  | 'wallet_first_access'
  | 'nfc_tap_to_enter'
  | 'privacy_safe_personalization'
  | 'flyer_first_creation'
  | 'scheduled_publish'
  | 'guest_access_control'
  | 'vip_vs_ga_scan'
  | 'host_event_intelligence'
  | 'experience_recap'
  | 'website_host_acquisition';

export type EchoUxEnhancement = {
  id: EchoUxEnhancementId;
  status: 'locked' | 'phase_1_mock' | 'future_wireup';
  productSurface: string;
  signatureCopy: string;
};

export const ECHO_UX_ENHANCEMENTS: EchoUxEnhancement[] = [
  { id: 'calm_ai_discovery', status: 'locked', productSurface: 'Picked for You / Ask ECHO', signatureCopy: 'Curated by ECHO AI.' },
  { id: 'wallet_first_access', status: 'locked', productSurface: 'ECHO Pass / Apple Wallet / Google Wallet', signatureCopy: 'Your Access Pass is ready.' },
  { id: 'nfc_tap_to_enter', status: 'locked', productSurface: 'Door Mode + ECHO Disc', signatureCopy: 'Tap. Verified. In.' },
  { id: 'privacy_safe_personalization', status: 'locked', productSurface: 'Picked for You reason labels', signatureCopy: 'Similar to events you viewed.' },
  { id: 'flyer_first_creation', status: 'phase_1_mock', productSurface: 'Create Event V3', signatureCopy: 'Upload a flyer. ECHO builds the event draft.' },
  { id: 'scheduled_publish', status: 'phase_1_mock', productSurface: 'Schedule step / Launch Center', signatureCopy: 'Launch publicly on the date you choose.' },
  { id: 'guest_access_control', status: 'phase_1_mock', productSurface: 'Trust & Access controls', signatureCopy: 'Approve, hold, or deny access with an audit trail.' },
  { id: 'vip_vs_ga_scan', status: 'phase_1_mock', productSurface: 'Door Mode scan result', signatureCopy: 'GA green. VIP gold. Staff know within one second.' },
  { id: 'host_event_intelligence', status: 'phase_1_mock', productSurface: 'Event Health / Market Pulse / ESS', signatureCopy: 'ECHO helps you launch stronger.' },
  { id: 'experience_recap', status: 'future_wireup', productSurface: 'Post-event attendee + host recap', signatureCopy: 'Your Experience Recap.' },
  { id: 'website_host_acquisition', status: 'locked', productSurface: 'Public website v2', signatureCopy: 'The operating system for live event access.' },
];
