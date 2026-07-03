import type { Ticket } from "../types";

export type EchoWalletPassStatus =
  | 'ready'
  | 'scanning'
  | 'checked_in'
  | 'offline_ready'
  | 'upcoming'
  | 'expired'
  | 'verification_required';

export type EchoWalletPassType = 'access' | 'event_ticket';

export type EchoWalletPass = {
  id: string;
  type: EchoWalletPassType;
  status: EchoWalletPassStatus;
  title: string;
  subtitle?: string;
  eventName?: string;
  venueName?: string;
  eventDateTime?: string;
  validFrom?: string;
  validUntil?: string;
  ticketTier?: string;
  ageRequirement?: 'none' | '18+' | '21+';
  ageVerified: boolean;
  identityVerified: boolean;
  nfcEnabled: boolean;
  offlineEnabled: boolean;
  walletProvider: 'apple_wallet' | 'google_wallet' | 'in_app';
  /** Optional premium visual background. For Access pass, use next purchased event flyer when available; otherwise charcoal fallback. */
  backgroundImageUrl?: string | null;
};

export const echoWalletColors = {
  background: '#05060A',
  surface: '#0B0D12',
  cardSurface: '#101217',
  cardSurfaceElevated: '#14161D',
  textPrimary: '#F5F6FA',
  textSecondary: '#A7A9B3',
  textMuted: '#747887',
  borderSubtle: 'rgba(255,255,255,0.10)',
  gradientBlue: '#149CFF',
  gradientViolet: '#7657FF',
  gradientMagenta: '#E238B8',
  gradientCoral: '#FF5A63',
  gradientOrange: '#FF8A1F',
  gradientGold: '#FFC857',
};

export const STATUS_COPY: Record<EchoWalletPassStatus, { main: string; sub: string; locked?: boolean }> = {
  ready: { main: 'Ready to Tap', sub: 'Secure NFC access enabled' },
  scanning: { main: 'Hold Still', sub: 'Reading your pass' },
  checked_in: { main: 'Checked In', sub: 'Entry confirmed' },
  offline_ready: { main: 'Offline Ready', sub: 'Cached for entry' },
  upcoming: { main: 'Available Soon', sub: 'Valid at event time', locked: true },
  expired: { main: 'Expired', sub: 'This access has ended', locked: true },
  verification_required: { main: 'Verify Age', sub: 'Required before entry', locked: true },
};

export function createAccessPassMock(status: EchoWalletPassStatus = 'ready', backgroundImageUrl?: string | null): EchoWalletPass {
  return {
    id: `access_${status}`,
    type: 'access',
    status,
    title: 'ECHO Access',
    subtitle: 'Verified profile',
    ageRequirement: '21+',
    ageVerified: true,
    identityVerified: true,
    nfcEnabled: status === 'ready' || status === 'scanning' || status === 'offline_ready',
    offlineEnabled: status === 'offline_ready',
    walletProvider: 'apple_wallet',
    backgroundImageUrl: backgroundImageUrl ?? null,
  };
}

export function createEventPassMock(status: EchoWalletPassStatus = 'ready'): EchoWalletPass {
  return {
    id: `event_${status}`,
    type: 'event_ticket',
    status,
    title: 'Soulful Fridays',
    subtitle: 'General Admission',
    eventName: 'Soulful Fridays',
    venueName: 'Parliament Lounge',
    eventDateTime: 'Fri, May 10 · 9:00 PM',
    ticketTier: 'General Admission',
    ageRequirement: '21+',
    ageVerified: true,
    identityVerified: true,
    nfcEnabled: status === 'ready' || status === 'scanning' || status === 'offline_ready',
    offlineEnabled: status === 'offline_ready',
    walletProvider: 'apple_wallet',
    backgroundImageUrl: null,
  };
}

export function mapEchoPassToPassKit(pass: EchoWalletPass) {
  const isEvent = pass.type === 'event_ticket';
  return {
    logoText: 'ECHO',
    backgroundColor: echoWalletColors.background,
    foregroundColor: echoWalletColors.textPrimary,
    labelColor: echoWalletColors.textSecondary,
    nfcPrimary: true,
    qrHiddenByDefault: true,
    primaryFields: [{ key: isEvent ? 'event' : 'access', label: isEvent ? 'EVENT' : 'ACCESS', value: isEvent ? pass.eventName : 'ECHO Access' }],
    secondaryFields: [{ key: 'state', label: STATUS_COPY[pass.status].main, value: STATUS_COPY[pass.status].sub }],
    auxiliaryFields: [
      ...(pass.ageRequirement && pass.ageRequirement !== 'none' ? [{ key: 'age', label: pass.ageRequirement, value: pass.ageVerified ? 'Verified' : 'Required' }] : []),
      ...(isEvent ? [{ key: 'tier', label: 'Tier', value: pass.ticketTier || 'General Admission' }] : []),
    ],
    backFields: [
      { key: 'privacy', label: 'Privacy', value: 'Your data is encrypted and never shared.' },
      { key: 'support', label: 'Support', value: 'getechoaccess.com/support' },
    ],
  };
}

/**
 * Auto-pick the most relevant pass to preview in Add-to-Wallet sheet.
 * Logic:
 *   - If user has an upcoming ticket within next 24h → ready event_ticket
 *   - If user has an upcoming ticket within 30 days → upcoming event_ticket
 *   - Otherwise → ready access pass
 */


export function getPreviewPassForUser(
  tickets: Ticket[] = [],
  getEventById: (id: string) => { start_time: string; title: string; venue_name: string; image_url?: string } | undefined,
  now = Date.now(),
): EchoWalletPass {
  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;

  // Find earliest upcoming ticket by event start
  const active = tickets
    .filter((t) => t.status === 'active')
    .map((t) => {
      const ev = getEventById(t.event_id);
      return ev ? { ticket: t, event: ev, start: new Date(ev.start_time).getTime() } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null && x.start > now)
    .sort((a, b) => a.start - b.start);

  const next = active[0];
  if (!next) return createAccessPassMock('ready');

  const delta = next.start - now;
  const isReady = delta <= 24 * HOUR_MS;
  const isUpcoming = delta > 24 * HOUR_MS && delta <= 30 * DAY_MS;

  const eventDateTime = new Date(next.start).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  if (isReady || isUpcoming) {
    return {
      ...createAccessPassMock(isReady ? 'ready' : 'upcoming', next.event.image_url ?? null),
      title: 'ECHO Access',
      subtitle: next.event.title,
      eventName: next.event.title,
      venueName: next.event.venue_name,
      eventDateTime,
    };
  }
  return createAccessPassMock('ready');
}

export function getAccessPassForUser(
  tickets: Ticket[] = [],
  getEventById: (id: string) => { start_time: string; title: string; venue_name: string; image_url?: string } | undefined,
  now = Date.now(),
): EchoWalletPass {
  const active = tickets
    .filter((t) => t.status === 'active')
    .map((t) => {
      const event = getEventById(t.event_id);
      return event ? { event, start: new Date(event.start_time).getTime() } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null && x.start > now)
    .sort((a, b) => a.start - b.start);

  const next = active[0];
  if (!next) return createAccessPassMock('ready');

  return {
    ...createAccessPassMock('ready', next.event.image_url ?? null),
    title: 'ECHO Access',
    subtitle: next.event.title,
    eventName: next.event.title,
    venueName: next.event.venue_name,
    eventDateTime: new Date(next.start).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }),
  };
}
