/**
 * ECHO Website Experience Locks
 * ═════════════════════════════
 * Public web v2 stays inside Expo / React Native Web. Host acquisition remains
 * first, event discovery second, nonprofit support third.
 */

import { ECHO_WEBSITE_LOCK, WEB_AGE_VERIFICATION_HANDOFF } from '../types/v3';

export const ECHO_HOMEPAGE_SECTIONS = [
  {
    id: 'hero',
    title: 'The new front door for live events.',
    subtitle: 'ECHO connects discovery, wallet tickets, NFC entry, age verification, group purchasing, donations, and host intelligence into one seamless access platform.',
    primaryCta: 'Start Hosting',
    secondaryCta: 'Explore Events',
  },
  {
    id: 'access_layer',
    title: 'Tap-to-enter access, built for real doors.',
    subtitle: 'Wallet-first Access Passes, NFC Door Mode, age badges, and QR fallback when needed.',
  },
  {
    id: 'host_intelligence',
    title: 'Built for hosts who need more than a checkout page.',
    subtitle: 'Flyer AI, scheduled publish, Market Pulse, Event Success Score, and live Door Mode reporting.',
  },
  {
    id: 'nonprofit_support',
    title: 'Built for events that create impact.',
    subtitle: 'Donation tools live under For Hosts while the main page stays focused on the access platform.',
  },
] as const;

export function getHomepageLock() {
  return ECHO_WEBSITE_LOCK;
}

export function getWebAgeVerificationHandoff() {
  return WEB_AGE_VERIFICATION_HANDOFF;
}

export { getWebsiteV2Experience } from './websiteV2ContentService';
