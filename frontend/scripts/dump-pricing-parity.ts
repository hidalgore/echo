/**
 * scripts/dump-pricing-parity.ts
 * ══════════════════════════════
 * Dump the CLIENT pricing engine's outputs (services/pricingEngine.ts +
 * donationCampaignService.computeDonationProcessingFee) over a grid of
 * checkout shapes to a fixture the backend property test replays
 * (backend/checkout/tests/pricing_parity.json).
 *
 * This is the W1 lock: the server engine (backend/checkout/pricing.py) must
 * reproduce these numbers bit-for-bit before the client engine is demoted to
 * display logic. Regenerate (and re-run pytest) if the client engine ever
 * changes:
 *     npx sucrase-node scripts/dump-pricing-parity.ts
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

import { computeCheckoutFees } from '../services/pricingEngine';
import { computeDonationProcessingFee } from '../services/donationCampaignService';

const OUTPUT = resolve(__dirname, '../../backend/checkout/tests/pricing_parity.json');

const toCents = (dollars: number) => Math.round(dollars * 100);

// Edge-heavy subtotal grid (cents): zero, sub-dollar, rounding half-cases,
// realistic ticket prices, quantity-folded totals, and large orders.
const SUBTOTAL_CENTS = [
  0, 1, 29, 30, 49, 50, 99, 100, 101, 250, 333, 999, 1000, 1050, 1234, 1250,
  2350, 2500, 4000, 4550, 7500, 8888, 9999, 10000, 12000, 12345, 15075, 20000,
  32000, 36000, 60000, 75050, 100000, 123456, 250000, 500000,
];

const DONATION_CENTS = [0, 1, 49, 50, 100, 351, 500, 1000, 2500, 5000, 10000];

type ParityCase = {
  subtotal_cents: number;
  nonprofit_host: boolean;
  donation_cents: number;
  expected: {
    platform_fee_cents: number;
    processing_fee_cents: number;
    service_fee_cents: number;
    tax_cents: number;
    donation_fee_cents: number;
    ticket_total_cents: number;
  };
};

const cases: ParityCase[] = [];
for (const subtotalCents of SUBTOTAL_CENTS) {
  for (const nonprofit of [false, true]) {
    for (const donationCents of DONATION_CENTS) {
      const fees = computeCheckoutFees(subtotalCents / 100, nonprofit);
      const donationFee = donationCents > 0 ? computeDonationProcessingFee(donationCents / 100) : 0;
      cases.push({
        subtotal_cents: subtotalCents,
        nonprofit_host: nonprofit,
        donation_cents: donationCents,
        expected: {
          platform_fee_cents: toCents(fees.platformFee),
          processing_fee_cents: toCents(fees.processingFee),
          service_fee_cents: toCents(fees.serviceFee),
          tax_cents: toCents(fees.tax),
          donation_fee_cents: toCents(donationFee),
          ticket_total_cents: toCents(fees.total),
        },
      });
    }
  }
}

writeFileSync(OUTPUT, `${JSON.stringify({ case_count: cases.length, cases }, null, 1)}\n`);
console.log(`Wrote ${cases.length} pricing parity cases to ${OUTPUT}`);
