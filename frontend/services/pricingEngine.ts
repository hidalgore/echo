/**
 * Shared Pricing Engine (Spec §12) — Canonical Fee Model
 * ═══════════════════════════════════════════════════════
 * Single source of truth for ALL checkout and Circle pricing.
 *
 * Buyer-facing fee model:
 *   5% ECHO platform fee + 2.9% + $0.30 payment processing
 *   UI label: "Service & processing fee"
 *
 * Nonprofit host waiver:
 *   Platform fee waived; payment processing always applies.
 *
 * Taxes: calculated separately per jurisdiction (default 8.5% WA sales tax).
 */
import { CONFIG } from '../constants/config';
import type { CirclePricing } from '../types/circle';

const PLATFORM_RATE  = CONFIG.ECHO_PLATFORM_FEE_RATE;     // 5%
const PROCESSING_RATE = CONFIG.PAYMENT_PROCESSING_RATE;     // 2.9%
const PROCESSING_FLAT = CONFIG.PAYMENT_PROCESSING_FLAT;     // $0.30
const DEFAULT_TAX_RATE = 0.085;                             // WA sales tax

const round = (n: number) => Math.round(n * 100) / 100;

// ── Core fee calculator (dollars in, dollars out) ───────────────────────

export type CheckoutFees = {
  subtotal: number;
  platformFee: number;
  processingFee: number;
  /** Combined: platformFee + processingFee — label: "Service & processing fee" */
  serviceFee: number;
  tax: number;
  total: number;
};

/**
 * Compute canonical fees for any checkout path.
 * @param subtotal - ticket subtotal in dollars
 * @param isNonprofitHost - if true, platform fee is waived (processing remains)
 * @param taxRate - override tax rate (default 8.5%)
 */
export function computeCheckoutFees(
  subtotal: number,
  isNonprofitHost = false,
  taxRate = DEFAULT_TAX_RATE,
): CheckoutFees {
  const platformFee = isNonprofitHost ? 0 : round(subtotal * PLATFORM_RATE);
  const processingFee = round(subtotal * PROCESSING_RATE + PROCESSING_FLAT);
  const serviceFee = round(platformFee + processingFee);
  const tax = round(subtotal * taxRate);
  const total = round(subtotal + serviceFee + tax);
  return { subtotal, platformFee, processingFee, serviceFee, tax, total };
}

// ── Circle pricing (cents-based, preserves existing interface) ──────────

/** Compute pricing for any purchase context (cents-based) */
export function computePricing(
  pricePerTicketCents: number,
  totalQuantity: number,
  mode: 'single' | 'circle' | 'pay_all',
): CirclePricing {
  const subtotalDollars = (pricePerTicketCents * totalQuantity) / 100;
  const singleDollars = pricePerTicketCents / 100;

  const allFees = computeCheckoutFees(subtotalDollars);
  const singleFees = computeCheckoutFees(singleDollars);

  const payAllTotal = Math.round(allFees.total * 100);
  const dueNow = mode === 'circle'
    ? Math.round(singleFees.total * 100)
    : payAllTotal;

  const remainingCircleValue = mode === 'circle'
    ? (totalQuantity - 1) * pricePerTicketCents
    : 0;

  return {
    subtotal: Math.round(subtotalDollars * 100),
    fees: Math.round(allFees.serviceFee * 100),
    tax: Math.round(allFees.tax * 100),
    dueNow,
    remainingCircleValue,
    payAllTotal,
    currency: 'USD',
  };
}

/** Compute cover-remaining pricing (organizer secures open spots) */
export function computeCoverPricing(
  pricePerTicketCents: number,
  openSpotCount: number,
): { subtotal: number; fees: number; tax: number; total: number } {
  const subtotalDollars = (pricePerTicketCents * openSpotCount) / 100;
  const f = computeCheckoutFees(subtotalDollars);
  return {
    subtotal: Math.round(f.subtotal * 100),
    fees: Math.round(f.serviceFee * 100),
    tax: Math.round(f.tax * 100),
    total: Math.round(f.total * 100),
  };
}

/** Format cents as $XX.XX */
export function fmtPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
