/**
 * ECHO Event Media Rules
 * ══════════════════════
 * Canonical locked product rules for event media across host creation,
 * event details, and access-safe surfaces.
 */

/**
 * Locked rule: Event Details hero videos must be 30 seconds or shorter.
 * Home, Wallet, QR, NFC, Door Mode, Apple Wallet, and Google Wallet remain still-photo/access-safe.
 */
export const EVENT_DETAILS_VIDEO_MAX_SECONDS = 30 as const;
export const EVENT_DETAIL_VIDEO_MAX_SECONDS = EVENT_DETAILS_VIDEO_MAX_SECONDS;
export const EVENT_DETAIL_VIDEO_MAX_MILLISECONDS = EVENT_DETAILS_VIDEO_MAX_SECONDS * 1000;
export const EVENT_DETAIL_VIDEO_MAX_LABEL = '30 seconds';
export const EVENT_DETAILS_VIDEO_MAX_LABEL = EVENT_DETAIL_VIDEO_MAX_LABEL;
export const EVENT_DETAIL_VIDEO_RULE_COPY = `Event Details videos must be ${EVENT_DETAILS_VIDEO_MAX_SECONDS} seconds or shorter.`;

export const formatEventDetailVideoLimit = () => `${EVENT_DETAILS_VIDEO_MAX_SECONDS} sec max`;

/**
 * Expo ImagePicker reports video duration in milliseconds on native platforms.
 * Some mock/test payloads may provide seconds, so this helper normalizes both.
 */
export const normalizeEventDetailVideoDurationSeconds = (duration?: number | null): number | null => {
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) return null;
  // Native ImagePicker duration is milliseconds. Web/test payloads may provide seconds.
  return duration > 1000 ? duration / 1000 : duration;
};

export const isEventDetailVideoDurationAllowed = (durationSeconds?: number | null): boolean => {
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    // Unknown client-side duration is allowed for compatibility; backend/media processing
    // must enforce the same 30-second maximum before production publish.
    return true;
  }
  return durationSeconds <= EVENT_DETAILS_VIDEO_MAX_SECONDS;
};

export const formatEventDetailVideoDuration = (seconds?: number | null): string => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return 'unknown duration';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const getEventDetailVideoDurationLabel = (durationSeconds?: number | null) => {
  if (!durationSeconds || !Number.isFinite(durationSeconds)) return formatEventDetailVideoLimit();
  const rounded = Math.max(1, Math.round(durationSeconds));
  return `${rounded}s / ${EVENT_DETAILS_VIDEO_MAX_SECONDS}s max`;
};

export const isEventDetailsVideoDurationAllowed = isEventDetailVideoDurationAllowed;
export const normalizeVideoDurationSeconds = normalizeEventDetailVideoDurationSeconds;
export const formatVideoDuration = formatEventDetailVideoDuration;
