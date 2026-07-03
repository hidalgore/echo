/**
 * ECHO Social Promotion — Types
 * ═══════════════════════════════
 * Based on ECHO Social Promotion Developer Detail Spec v1.0
 */

export type SocialProvider = 'instagram' | 'facebook' | 'tiktok' | 'x';

export type ConnectionStatus =
  | 'not_linked'
  | 'connected'
  | 'needs_reconnect'
  | 'permission_incomplete'
  | 'expired'
  | 'export_only'
  | 'audit_limited';

export type PromoFormat = 'post' | 'story' | 'reel';
export type PublishMode = 'direct' | 'native_handoff' | 'export' | 'copy_link';
export type PromoPackageStatus = 'draft' | 'ready' | 'publishing' | 'published' | 'failed' | 'exported';

export interface SocialAccount {
  id: string;
  host_id: string;
  provider: SocialProvider;
  external_account_id: string;
  display_name: string;
  handle: string;
  avatar_url?: string;
  status: ConnectionStatus;
  token_expires_at: string;
  scopes: string[];
  default_for_posts: boolean;
  default_for_stories: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionCapability {
  canConnect: boolean;
  canDirectPublishPost: boolean;
  canDirectPublishStory: boolean;
  canDirectPublishReel: boolean;
  canExportPost: boolean;
  canExportStory: boolean;
  canExportReel: boolean;
  notes?: string[];
}

export interface PromotionPackage {
  id: string;
  event_id: string;
  host_id: string;
  platform: SocialProvider;
  format: PromoFormat;
  asset_urls: string[];
  caption_text: string;
  short_caption: string;
  hashtags: string[];
  cta_link: string;
  status: PromoPackageStatus;
  publish_mode: PublishMode;
  published_at?: string;
  failure_reason?: string;
  created_at: string;
}

export interface PromotionPreference {
  host_id: string;
  default_caption_style: 'casual' | 'professional' | 'energetic' | 'minimal';
  default_platforms: SocialProvider[];
  default_formats: PromoFormat[];
  attach_event_link: boolean;
  add_brand_footer: boolean;
  save_asset_history: boolean;
}

export interface PromotionHistory {
  id: string;
  event_id: string;
  event_title: string;
  platform: SocialProvider;
  format: PromoFormat;
  publish_mode: PublishMode;
  status: PromoPackageStatus;
  published_at: string;
  asset_thumbnail?: string;
}

// Platform capability matrix from spec §8
export const PLATFORM_CAPABILITIES: Record<SocialProvider, PromotionCapability> = {
  instagram: {
    canConnect: true,
    canDirectPublishPost: true,
    canDirectPublishStory: true,
    canDirectPublishReel: true,
    canExportPost: true,
    canExportStory: true,
    canExportReel: true,
  },
  facebook: {
    canConnect: true,
    canDirectPublishPost: true,
    canDirectPublishStory: true,
    canDirectPublishReel: false,
    canExportPost: true,
    canExportStory: true,
    canExportReel: true,
  },
  tiktok: {
    canConnect: true,
    canDirectPublishPost: false,
    canDirectPublishStory: false,
    canDirectPublishReel: false,
    canExportPost: true,
    canExportStory: true,
    canExportReel: true,
    notes: ['Direct posting gated by audit/capability state'],
  },
  x: {
    canConnect: true,
    canDirectPublishPost: false,
    canDirectPublishStory: false,
    canDirectPublishReel: false,
    canExportPost: true,
    canExportStory: false,
    canExportReel: false,
    notes: ['Optional in v1; export and copy flows first'],
  },
};
