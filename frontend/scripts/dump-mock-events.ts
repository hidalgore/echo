/**
 * scripts/dump-mock-events.ts
 * ═══════════════════════════
 * Dump the mock event corpus (services/mock.ts) to the date-relative JSON
 * snapshot consumed by `manage.py seed_events` (backend/events/seed/).
 *
 * The corpus mints its dates relative to import time (`getDate(daysFromNow)`),
 * so an absolute-date snapshot would go stale within days. The snapshot stores
 * minute offsets from "now" instead; the seed command re-materializes real
 * datetimes at seed time, so re-seeding staging always demos live/upcoming
 * events.
 *
 * Run from frontend/ whenever the mock corpus changes:
 *     npx sucrase-node scripts/dump-mock-events.ts
 *
 * Phase 3 added donation campaigns + the nonprofit host flag (the corpus
 * marks nonprofit hosts via their campaign). Still out of scope:
 * detail_media_* host uploads (Phase 7).
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

import { MOCK_EVENTS } from '../services/mock';
import type { NonprofitDonationCampaign } from '../types/nonprofitDonation';

const OUTPUT = resolve(__dirname, '../../backend/events/seed/mock_events.json');

const now = Date.now();
const MINUTE_MS = 60 * 1000;

/** Whole-minute offset from dump time; negative = in the past. */
function offsetMinutes(iso: string): number {
  return Math.round((new Date(iso).getTime() - now) / MINUTE_MS);
}

/** Corpus campaign (dollar amounts) → seed shape (cents, stored statuses).
 *  Derived progress statuses (goal_reached/…) are client display logic and
 *  collapse to 'active'; raised/donor counters seed initial demo progress. */
function dumpCampaign(campaign: NonprofitDonationCampaign) {
  return {
    id: campaign.id,
    nonprofit_name: campaign.nonprofitName,
    cause_title: campaign.causeTitle,
    cause_description: campaign.causeDescription,
    goal_cents: Math.round(campaign.goalAmount * 100),
    raised_cents: Math.round(campaign.raisedAmount * 100),
    donor_count: campaign.donorCount,
    suggested_amounts_cents: campaign.suggestedAmounts.map((amount) => Math.round(amount * 100)),
    status: campaign.status === 'closed' ? 'closed' : 'active',
  };
}

const events = MOCK_EVENTS.map((event) => ({
  id: event.id,
  title: event.title,
  description: event.description,
  category: event.category,
  venue_name: event.venue_name,
  venue_address: event.venue_address,
  start_offset_minutes: offsetMinutes(event.start_time),
  end_offset_minutes: offsetMinutes(event.end_time),
  image_url: event.image_url,
  is_featured: event.is_featured ?? false,
  host_name: event.host_name,
  host_verified: event.host_verified,
  age_restriction: event.age_restriction ?? null,
  social_energy_override: event.social_energy_override ?? null,
  // Nonprofit hosts are the campaign carriers in the corpus (Phase 7 EIN
  // verification replaces this heuristic).
  host_is_nonprofit: !!event.donation_campaign,
  donation_campaign: event.donation_campaign ? dumpCampaign(event.donation_campaign) : null,
  ticket_types: event.ticket_types.map((tier) => ({
    id: tier.id,
    name: tier.name,
    description: tier.description ?? '',
    // Corpus prices are dollars; the backend stores cents (locked rule).
    price_cents: Math.round(tier.price * 100),
    available: tier.available,
  })),
}));

writeFileSync(OUTPUT, `${JSON.stringify({ event_count: events.length, events }, null, 2)}\n`);

console.log(`Wrote ${events.length} events to ${OUTPUT}`);
