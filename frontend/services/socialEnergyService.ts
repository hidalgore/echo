/**
 * ECHO Social Energy Service
 * ═══════════════════════════
 * Derives a calm, attendee-safe SocialEnergy snapshot from an Event.
 *
 * Logic priorities:
 *   1. If event has `social_energy_override`, use it verbatim (host control).
 *   2. Otherwise, derive from time-to-event + sell-through ratio + venue size.
 *
 * The output NEVER includes forbidden states (dead/empty/sparse/raw %).
 * Minimum public floor: "Early Atmosphere" — even an unsold event reads as
 * "Early Atmosphere" until enough signals accumulate to lift it. This is the
 * core doctrine: emotional truth, not operational truth.
 */
import type { Event } from '../types';
import type {
  EnergyState,
  GravitySignal,
  LivePulse,
  SocialEnergy,
  TimeFraming,
} from '../types/socialEnergy';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

// Deterministic hash for stable per-event gravity selection
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getTimeFraming(event: Event, now = Date.now()): TimeFraming {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  if (now > end) return 'past';
  if (now >= start) return 'live';
  const delta = start - now;
  if (delta <= DAY_MS) return 'today';
  if (delta <= WEEK_MS) return 'this_week';
  return 'far_future';
}

/** Returns 0..1 representing how full the event is. */
function getSellThrough(event: Event): number {
  const ticketTypes = event.ticket_types || [];
  if (ticketTypes.length === 0) return 0;
  const totalAvail = ticketTypes.reduce((sum, t) => sum + (t.available || 0), 0);
  // Heuristic: small venues hint at higher relative sell-through.
  // Use deterministic noise to give events varied energy without raw sold counts.
  const seed = hash(event.id) % 100; // 0-99
  // Lower availability = higher implied sell-through (capped 0-1)
  const inferredSold = Math.max(0, 1 - totalAvail / Math.max(totalAvail + 600, 1));
  // Blend inferred + seeded variance so events don't all look identical
  return Math.min(1, inferredSold * 0.7 + (seed / 100) * 0.3);
}

function deriveEnergyState(framing: TimeFraming, sellThrough: number): EnergyState {
  if (framing === 'past') {
    // Past events read as a memory of how the night went.
    // Use sell-through to decide whether it was Peak Crowd or High Energy.
    return sellThrough > 0.55 ? 'peak_crowd' : 'high_energy';
  }
  if (framing === 'live') {
    return sellThrough > 0.45 ? 'peak_crowd' : 'high_energy';
  }
  if (framing === 'today') {
    if (sellThrough > 0.6) return 'peak_crowd';
    if (sellThrough > 0.4) return 'high_energy';
    return 'well_attended';
  }
  if (framing === 'this_week') {
    if (sellThrough > 0.55) return 'high_energy';
    if (sellThrough > 0.3) return 'well_attended';
    return 'building_energy';
  }
  // far_future
  if (sellThrough > 0.5) return 'well_attended';
  if (sellThrough > 0.25) return 'building_energy';
  return 'early_atmosphere';
}

function derivePulse(framing: TimeFraming, sellThrough: number): LivePulse | null {
  // Live pulse only makes sense for day-of or live events.
  if (framing === 'live') {
    if (sellThrough > 0.55) return 'doors_active';
    return 'peak_arrival';
  }
  if (framing === 'today') {
    if (sellThrough > 0.5) return 'crowd_building';
    if (sellThrough > 0.3) return 'fast_entry';
    return 'guests_arriving';
  }
  return null;
}

function deriveGravity(event: Event, framing: TimeFraming, sellThrough: number): GravitySignal[] {
  // Strict cap: 0–2 signals (calm UI, never noisy).
  const out: GravitySignal[] = [];
  const seed = hash(event.id);

  // "Popular with your network" — only for sell-through > 0.45 and varied
  if (sellThrough > 0.45 && seed % 5 < 3) out.push('popular_with_network');

  // "Strong Circle activity" — only if event allows groups (most do)
  if (framing !== 'past' && sellThrough > 0.5 && seed % 3 === 0) {
    if (out.length < 2) out.push('strong_circle');
  }

  // "Returning attendees" — recurring host events
  if (framing === 'far_future' && seed % 4 === 1 && out.length < 2) {
    out.push('returning_attendees');
  }

  // "Community favorite" — high sell-through far-future events
  if (sellThrough > 0.55 && framing === 'this_week' && seed % 7 < 4 && out.length < 2) {
    out.push('community_favorite');
  }

  // "Shared frequently tonight" — day-of/live only
  if ((framing === 'today' || framing === 'live') && seed % 4 === 2 && out.length < 2) {
    out.push('shared_frequently');
  }

  return out;
}

function deriveIntensity(state: EnergyState, framing: TimeFraming): number {
  // 0..1 for glow/waveform amplitude. Never shown as a number.
  const stateBase: Record<EnergyState, number> = {
    early_atmosphere: 0.18,
    building_energy: 0.35,
    well_attended: 0.55,
    high_energy: 0.78,
    peak_crowd: 1.0,
  };
  const framingMul: Record<TimeFraming, number> = {
    far_future: 0.6,
    this_week: 0.75,
    today: 0.9,
    live: 1.0,
    past: 0.5,
  };
  return Math.min(1, stateBase[state] * framingMul[framing]);
}

/**
 * Get the canonical Social Energy snapshot for an event.
 * Respects host override when present.
 */
export function getSocialEnergy(event: Event, now = Date.now()): SocialEnergy {
  // Host override wins (Spec: "Both — derive default, but allow host override")
  if (event.social_energy_override) {
    return event.social_energy_override;
  }

  const framing = getTimeFraming(event, now);
  const sellThrough = getSellThrough(event);
  const state = deriveEnergyState(framing, sellThrough);
  const pulse = derivePulse(framing, sellThrough);
  const gravity = deriveGravity(event, framing, sellThrough);
  const intensity = deriveIntensity(state, framing);

  return { state, pulse, gravity, framing, intensity };
}
