/**
 * services/feedbackService.ts
 * ═══════════════════════════
 * Multi-sensory feedback for Door Mode + NFC (decision 5A). Every state carries
 * VISUAL (icon + text + color) and HAPTIC, with optional AUDIO — color is never
 * the only signal, so it works for color-blind operators, loud rooms, and
 * bright sunlight.
 *
 * Dependency-free: the haptic call goes through an injectable adapter so we add
 * NO new package. Wire expo-haptics in the app by passing an adapter; the
 * default no-ops safely.
 */

import type { StatusKind } from '../theme/a11y';

// NFC interaction lifecycle the user must always perceive.
export type NfcPhase = 'tap_detected' | 'processing' | 'granted' | 'denied';

export type HapticPattern = 'light' | 'success' | 'warning' | 'error';

export type FeedbackDescriptor = {
  /** icon name (paired with text — never color alone) */
  icon: string;
  text: string;
  statusKind: StatusKind;
  haptic: HapticPattern;
  /** optional audio cue id; audio is never required to complete a workflow */
  sound?: 'tap' | 'success' | 'error';
};

export const NFC_FEEDBACK: Record<NfcPhase, FeedbackDescriptor> = {
  tap_detected: { icon: 'nfc', text: 'Tap detected', statusKind: 'info', haptic: 'light', sound: 'tap' },
  processing:   { icon: 'spinner', text: 'Validating…', statusKind: 'neutral', haptic: 'light' },
  granted:      { icon: 'check', text: 'Access Granted', statusKind: 'success', haptic: 'success', sound: 'success' },
  denied:       { icon: 'cross', text: 'Access Denied', statusKind: 'danger', haptic: 'error', sound: 'error' },
};

// ── Injectable adapters (no hard dependency) ─────────────────────────────────

export type HapticsAdapter = (pattern: HapticPattern) => void;
export type AudioAdapter = (sound: NonNullable<FeedbackDescriptor['sound']>) => void;

const noopHaptics: HapticsAdapter = () => {};

let hapticsAdapter: HapticsAdapter = noopHaptics;
let audioAdapter: AudioAdapter | undefined;

/** App wires real adapters once (e.g. expo-haptics). Safe to skip. */
export function configureFeedback(opts: { haptics?: HapticsAdapter; audio?: AudioAdapter }): void {
  if (opts.haptics) hapticsAdapter = opts.haptics;
  if (opts.audio) audioAdapter = opts.audio;
}

/**
 * Fire feedback for a phase. Visual is returned for the caller to render; haptic
 * fires now; audio is optional and respected only if enabled by the caller.
 */
export function playNfcFeedback(phase: NfcPhase, opts?: { audioEnabled?: boolean }): FeedbackDescriptor {
  const d = NFC_FEEDBACK[phase];
  try { hapticsAdapter(d.haptic); } catch { /* haptics optional */ }
  if (opts?.audioEnabled && d.sound && audioAdapter) {
    try { audioAdapter(d.sound); } catch { /* audio optional */ }
  }
  return d;
}

/** Map a Door Mode approval to the granted/denied descriptor. */
export function doorFeedback(approved: boolean): FeedbackDescriptor {
  return approved ? NFC_FEEDBACK.granted : NFC_FEEDBACK.denied;
}
