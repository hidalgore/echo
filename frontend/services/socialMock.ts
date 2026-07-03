/**
 * ECHO Social Promotion — Mock Service
 * ══════════════════════════════════════
 */
import type {
  SocialAccount, SocialProvider, PromotionPackage, PromotionHistory,
  PromotionPreference, PromoFormat, ConnectionStatus,
} from '../types/social';
import { PLATFORM_CAPABILITIES } from '../types/social';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Mock data ─────────────────────────────────────────────────────────

export const MOCK_ACCOUNTS: SocialAccount[] = [
  {
    id: 'sa_1', host_id: 'host_1', provider: 'instagram',
    external_account_id: 'ig_12345', display_name: 'DJ Pulse',
    handle: '@djpulse_official', avatar_url: 'https://picsum.photos/seed/ig/100/100',
    status: 'connected', token_expires_at: '2025-12-31T00:00:00Z',
    scopes: ['publish_media', 'stories'], default_for_posts: true, default_for_stories: true,
    created_at: '2024-06-15T00:00:00Z', updated_at: '2025-03-01T00:00:00Z',
  },
  {
    id: 'sa_2', host_id: 'host_1', provider: 'facebook',
    external_account_id: 'fb_67890', display_name: 'Pulse Events',
    handle: 'Pulse Events', avatar_url: 'https://picsum.photos/seed/fb/100/100',
    status: 'connected', token_expires_at: '2025-11-30T00:00:00Z',
    scopes: ['publish_pages', 'manage_pages'], default_for_posts: false, default_for_stories: false,
    created_at: '2024-07-20T00:00:00Z', updated_at: '2025-02-15T00:00:00Z',
  },
  {
    id: 'sa_3', host_id: 'host_1', provider: 'tiktok',
    external_account_id: 'tt_11111', display_name: 'DJ Pulse',
    handle: '@djpulse', status: 'export_only',
    token_expires_at: '2025-10-01T00:00:00Z', scopes: ['video.upload'],
    default_for_posts: false, default_for_stories: false,
    created_at: '2024-09-01T00:00:00Z', updated_at: '2025-01-20T00:00:00Z',
  },
];

export const MOCK_PREFERENCES: PromotionPreference = {
  host_id: 'host_1',
  default_caption_style: 'energetic',
  default_platforms: ['instagram', 'facebook'],
  default_formats: ['post', 'story'],
  attach_event_link: true,
  add_brand_footer: true,
  save_asset_history: true,
};

export const MOCK_HISTORY: PromotionHistory[] = [
  {
    id: 'ph_1', event_id: 'evt_1', event_title: 'Midnight Pulse',
    platform: 'instagram', format: 'post', publish_mode: 'direct',
    status: 'published', published_at: '2025-04-15T18:30:00Z',
    asset_thumbnail: 'https://picsum.photos/seed/promo1/300/300',
  },
  {
    id: 'ph_2', event_id: 'evt_1', event_title: 'Midnight Pulse',
    platform: 'facebook', format: 'story', publish_mode: 'direct',
    status: 'published', published_at: '2025-04-15T18:32:00Z',
    asset_thumbnail: 'https://picsum.photos/seed/promo2/300/300',
  },
  {
    id: 'ph_3', event_id: 'evt_2', event_title: 'Jazz & Wine Night',
    platform: 'instagram', format: 'reel', publish_mode: 'export',
    status: 'exported', published_at: '2025-04-10T14:00:00Z',
    asset_thumbnail: 'https://picsum.photos/seed/promo3/300/300',
  },
];

// ─── Service functions ─────────────────────────────────────────────────

export async function fetchSocialAccounts(): Promise<SocialAccount[]> {
  await delay(300);
  return MOCK_ACCOUNTS;
}

export async function connectSocialAccount(provider: SocialProvider): Promise<SocialAccount> {
  await delay(800);
  return {
    id: `sa_new_${Date.now()}`, host_id: 'host_1', provider,
    external_account_id: `${provider}_new`, display_name: 'New Account',
    handle: `@newaccount`, status: 'connected',
    token_expires_at: '2026-01-01T00:00:00Z', scopes: [],
    default_for_posts: false, default_for_stories: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
}

export async function disconnectSocialAccount(accountId: string): Promise<void> {
  await delay(400);
}

export async function refreshSocialAccount(accountId: string): Promise<SocialAccount> {
  await delay(600);
  const acct = MOCK_ACCOUNTS.find(a => a.id === accountId);
  if (!acct) throw new Error('Account not found');
  return { ...acct, status: 'connected', updated_at: new Date().toISOString() };
}

export function getPromotionCapabilities(provider: SocialProvider, status: ConnectionStatus) {
  const base = PLATFORM_CAPABILITIES[provider];
  if (status !== 'connected') {
    return {
      ...base,
      canDirectPublishPost: false,
      canDirectPublishStory: false,
      canDirectPublishReel: false,
    };
  }
  return base;
}

export async function buildPromotionPackage(
  eventId: string, provider: SocialProvider, format: PromoFormat
): Promise<PromotionPackage> {
  await delay(600);
  const caps = PLATFORM_CAPABILITIES[provider];
  const canDirect = format === 'post' ? caps.canDirectPublishPost
    : format === 'story' ? caps.canDirectPublishStory
    : caps.canDirectPublishReel;

  return {
    id: `pkg_${Date.now()}`, event_id: eventId, host_id: 'host_1',
    platform: provider, format,
    asset_urls: [`https://picsum.photos/seed/${format}${Date.now()}/1080/1080`],
    caption_text: 'Get ready for the hottest event this weekend! Secure your tickets now before they sell out.',
    short_caption: 'This weekend. Be there.',
    hashtags: ['#ECHO', '#LiveEvents', '#NightLife'],
    cta_link: `https://echo.app/event/${eventId}`,
    status: 'ready',
    publish_mode: canDirect ? 'direct' : 'export',
    created_at: new Date().toISOString(),
  };
}

export async function publishPromotion(packageId: string): Promise<PromotionPackage> {
  await delay(1200);
  return {
    id: packageId, event_id: 'evt_1', host_id: 'host_1',
    platform: 'instagram', format: 'post', asset_urls: [],
    caption_text: '', short_caption: '', hashtags: [], cta_link: '',
    status: 'published', publish_mode: 'direct',
    published_at: new Date().toISOString(), created_at: new Date().toISOString(),
  };
}

export async function fetchPromotionHistory(): Promise<PromotionHistory[]> {
  await delay(300);
  return MOCK_HISTORY;
}
