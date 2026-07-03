/**
 * ECHO Social Energy System — Types
 * ══════════════════════════════════
 * Canonical attendee-facing energy/momentum/atmosphere model.
 * Per Social Energy Developer Spec v1.0.
 *
 * Doctrine: Emotional truth over operational raw metrics.
 * NEVER expose: dead, empty, sparse, low attendance, raw occupancy %.
 */

// ── Public Energy States (Spec §2) ────────────────────────────
export type EnergyState =
  | 'early_atmosphere'   // Far out from event — calm anticipation
  | 'building_energy'    // Momentum forming
  | 'well_attended'      // Healthy, confident
  | 'high_energy'        // Vibrant, active
  | 'peak_crowd';        // Peak moment

export const ENERGY_STATE_LABEL: Record<EnergyState, string> = {
  early_atmosphere: 'Early Atmosphere',
  building_energy: 'Building Energy',
  well_attended: 'Well Attended',
  high_energy: 'High Energy',
  peak_crowd: 'Peak Crowd',
};

// ── Live Pulse States (Spec §3) ───────────────────────────────
export type LivePulse =
  | 'guests_arriving'
  | 'crowd_building'
  | 'fast_entry'
  | 'peak_arrival'
  | 'doors_active';

export const LIVE_PULSE_LABEL: Record<LivePulse, string> = {
  guests_arriving: 'Guests arriving now',
  crowd_building: 'Crowd building',
  fast_entry: 'Fast entry',
  peak_arrival: 'Peak arrival window',
  doors_active: 'Doors active',
};

// ── Social Gravity Signals (Spec §4) ──────────────────────────
export type GravitySignal =
  | 'strong_circle'
  | 'returning_attendees'
  | 'shared_frequently'
  | 'community_favorite'
  | 'popular_with_network';

export const GRAVITY_LABEL: Record<GravitySignal, string> = {
  strong_circle: 'Strong Circle activity',
  returning_attendees: 'Returning attendees',
  shared_frequently: 'Shared frequently tonight',
  community_favorite: 'Community favorite',
  popular_with_network: 'Popular with your network',
};

// ── Time framing (drives which states/pulses are valid) ───────
export type TimeFraming =
  | 'far_future'   // > 7 days out
  | 'this_week'    // 24h – 7d
  | 'today'        // 0 – 24h before start
  | 'live'         // currently happening
  | 'past';        // ended

// ── Full Social Energy snapshot ───────────────────────────────
export interface SocialEnergy {
  state: EnergyState;
  /** Live pulse is null for non-day-of/non-live events. */
  pulse: LivePulse | null;
  /** 0–2 gravity signals max — keep it calm. */
  gravity: GravitySignal[];
  /** Time framing used to render copy and color. */
  framing: TimeFraming;
  /** 0..1 — drives glow/waveform intensity. NEVER displayed as a number. */
  intensity: number;
}
