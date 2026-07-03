/**
 * Website V2 Content Service
 * Canonical public homepage / route content derived from Website V2 ERS.
 */

import { WEBSITE_V2_ROUTES } from '../types/canonicalPlatform';

export const WEBSITE_V2_HERO = {
  headline: 'The new front door for live events.',
  subheadline: 'ECHO connects discovery, wallet tickets, NFC entry, age verification, group purchasing, donations, and host intelligence into one seamless access platform.',
  primaryCta: 'Start Hosting',
  secondaryCta: 'Explore Events',
  phoneSurface: 'Actual ECHO Discover home screen',
  nav: ['Explore', 'For Hosts', 'Trust', 'Pricing', 'Start Hosting', 'Sign In'],
};

export const WEBSITE_V2_HERO_CARDS = [
  { id: 'nfc-ready', title: 'NFC Ready', subtitle: 'Tap to enter', priority: 1 },
  { id: 'age-verified', title: '21+ Verified', subtitle: 'Secure age verification', priority: 2 },
  { id: 'echo-circle', title: 'ECHO Circle', subtitle: 'Friends claim and pay', priority: 3 },
  { id: 'mobile-wallet', title: 'Mobile Wallet', subtitle: 'Tickets ready', priority: 4 },
] as const;

export const WEBSITE_V2_SECTION_ORDER = [
  'Floating navigation',
  'Hero with lifelike phone and 4 cards',
  'NFC access flow strip',
  'Problem section',
  'How ECHO Works journey',
  'Host value section',
  'NFC-first entry section',
  'ECHO Circle section',
  'Trust & Access section',
  'Host Command Center',
  'Attendee wallet experience',
  'Impact / nonprofit preview',
  'ECHO Disc hardware preview',
  'Pricing preview',
  'Final CTA and footer',
] as const;

export const WEBSITE_V2_NFC_FLOW = [
  { step: 1, label: 'Reserve Ticket', microcopy: 'Guest chooses ticket or starts checkout.' },
  { step: 2, label: 'Add to Wallet', microcopy: 'Ticket becomes wallet-ready access.' },
  { step: 3, label: 'Tap NFC', microcopy: 'Guest taps phone or credential at the door.' },
  { step: 4, label: 'Enter', microcopy: 'Door Mode confirms access and updates attendance.' },
] as const;

export const WEBSITE_V2_JOURNEY = [
  { id: 'discover', label: 'Discover', body: 'Guests find curated events nearby.' },
  { id: 'reserve', label: 'Reserve', body: 'They buy tickets or start an ECHO Circle.' },
  { id: 'verify', label: 'Verify', body: 'Age checks happen before checkout when required.' },
  { id: 'wallet', label: 'Wallet', body: 'Tickets become access-ready credentials.' },
  { id: 'tap-in', label: 'Tap In', body: 'Guests use NFC-first entry with QR fallback.' },
  { id: 'recap', label: 'Recap', body: 'Hosts and guests see what happened after the event.' },
] as const;

export const WEBSITE_V2_HOST_COMMAND_METRICS = [
  { id: 'tickets_sold', label: 'Tickets sold', value: '1,256', sentiment: 'positive' },
  { id: 'revenue', label: 'Revenue', value: '$12,580', sentiment: 'positive' },
  { id: 'capacity', label: 'Capacity', value: '84%', sentiment: 'neutral' },
  { id: 'checked_in', label: 'Checked in', value: '512', sentiment: 'positive' },
  { id: 'remaining_guests', label: 'Remaining guests', value: '88', sentiment: 'neutral' },
  { id: 'denied_entries', label: 'Denied entries', value: '7', sentiment: 'warning' },
  { id: 'nfc_success_rate', label: 'NFC success rate', value: '94.2%', sentiment: 'positive' },
  { id: 'age_verification_pass_rate', label: 'Age verification pass rate', value: '97.5%', sentiment: 'positive' },
  { id: 'donation_total', label: 'Donation total', value: '$1,265', sentiment: 'positive' },
  { id: 'event_success_score', label: 'Event Success Score', value: '86 / 100', sentiment: 'positive' },
] as const;

export const WEBSITE_V2_LOCKED_COPY = {
  nfcStripLine: 'A cleaner path from checkout to the door.',
  problemHeadline: 'Events are easy to promote. Access is where things break.',
  problemBody: 'Screenshots get shared. Groups get messy. Age checks slow the line. Hosts lose visibility after tickets are sold. ECHO brings the full access journey into one connected system.',
  hostHeadline: 'Built for hosts who need more than a checkout page.',
  nfcHeadline: 'Tap-to-enter access, built for real doors.',
  circleHeadline: 'Group tickets without one person fronting the bill.',
  trustHeadline: 'Trust built into every access point.',
  dashboardHeadline: 'Know what is happening before, during, and after the event.',
  discHeadline: 'Meet ECHO Disc.',
  finalCta: 'Ready to build a better front door?',
};

export function getWebsiteV2Experience() {
  return {
    hero: WEBSITE_V2_HERO,
    heroCards: WEBSITE_V2_HERO_CARDS,
    sectionOrder: WEBSITE_V2_SECTION_ORDER,
    nfcFlow: WEBSITE_V2_NFC_FLOW,
    journey: WEBSITE_V2_JOURNEY,
    metrics: WEBSITE_V2_HOST_COMMAND_METRICS,
    copy: WEBSITE_V2_LOCKED_COPY,
    routes: WEBSITE_V2_ROUTES,
  };
}
