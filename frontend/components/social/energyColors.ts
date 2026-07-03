import type { EnergyState } from '../../types/socialEnergy';

/**
 * Energy colors — ECHO brand gradient mapped to state intensity.
 *
 * Early Atmosphere → Echo Blue (#20C7FF) — calm trust
 * Building Energy  → Echo Violet (#7B4DFF) — rising
 * Well Attended    → Echo Magenta (#E63DAD) — confident
 * High Energy      → Echo Coral (#FF5A6E) — vibrant
 * Peak Crowd       → Echo Orange (#FF7A1A) — peak
 */

const STATE_HEX: Record<EnergyState, string> = {
  early_atmosphere: '#20C7FF',
  building_energy: '#7B4DFF',
  well_attended: '#E63DAD',
  high_energy: '#FF5A6E',
  peak_crowd: '#FF7A1A',
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Get state-tinted background/edge color at given alpha. */
export function getStateColor(state: EnergyState, alpha: number): string {
  return hexToRgba(STATE_HEX[state], alpha);
}

/** Get the solid accent hex for waveform bars, dots, etc. */
export function getStateAccent(state: EnergyState): string {
  return STATE_HEX[state];
}
