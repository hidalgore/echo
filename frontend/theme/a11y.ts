/**
 * theme/a11y.ts
 * ═════════════
 * Accessibility helpers (WCAG 2.2 AA). Every interactive element gets a role +
 * label + hint; every status carries an icon + text so meaning never depends on
 * color alone; the contrast checker lets us assert pairings in tests.
 *
 * Pure TS (no react-native import) so it is unit-testable and tsc-checkable.
 */

// ─── Accessible prop builders (spread onto Pressable / Image / etc.) ─────────

export type A11yButtonProps = {
  accessible: true;
  accessibilityRole: 'button';
  accessibilityLabel: string;
  accessibilityHint?: string;
  /** maps to disabled/selected/busy for screen readers */
  accessibilityState?: { disabled?: boolean; selected?: boolean; busy?: boolean };
};

export function a11yButton(label: string, hint?: string, state?: A11yButtonProps['accessibilityState']): A11yButtonProps {
  return { accessible: true, accessibilityRole: 'button', accessibilityLabel: label, accessibilityHint: hint, accessibilityState: state };
}

export type A11yImageProps = { accessible: true; accessibilityRole: 'image'; accessibilityLabel: string };
export function a11yImage(label: string): A11yImageProps {
  return { accessible: true, accessibilityRole: 'image', accessibilityLabel: label };
}

export type A11yLinkProps = { accessible: true; accessibilityRole: 'link'; accessibilityLabel: string; accessibilityHint?: string };
export function a11yLink(label: string, hint?: string): A11yLinkProps {
  return { accessible: true, accessibilityRole: 'link', accessibilityLabel: label, accessibilityHint: hint };
}

/** Decorative element — hidden from screen readers (e.g. background glow). */
export const a11yHidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

// ─── Status descriptors: icon + text + color (color is never alone) ──────────

export type StatusKind = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type StatusDescriptor = {
  kind: StatusKind;
  /** Glyph/icon name — paired with text so color is never the only signal */
  icon: string;
  /** Screen-reader + visible label */
  label: string;
};

/** Locked status copy that must read identically everywhere. */
export const STATUS = {
  verified: { kind: 'success', icon: 'check', label: '21+ Verified' } as StatusDescriptor,
  notVerified: { kind: 'warning', icon: 'alert', label: 'Verification Required' } as StatusDescriptor,
  accessGranted: { kind: 'success', icon: 'check', label: 'Access Granted' } as StatusDescriptor,
  accessDenied: { kind: 'danger', icon: 'cross', label: 'Access Denied' } as StatusDescriptor,
} as const;

// ─── Contrast checker (for tests / the audit) ────────────────────────────────

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = luminance(fgHex), l2 = luminance(bgHex);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
/** AA: 4.5:1 body, 3:1 large text. */
export function passesAA(fgHex: string, bgHex: string, large = false): boolean {
  return contrastRatio(fgHex, bgHex) >= (large ? 3 : 4.5);
}
