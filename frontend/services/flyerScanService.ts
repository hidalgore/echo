/**
 * Flyer Scan Service — V3 Edge Function Client
 * ════════════════════════════════════════════
 * Per Lock 1B: Claude Vision via server-side Edge Function.
 * Per Lock 4A: Supabase Edge Functions runtime.
 *
 * Phase 1 (this session): Returns mock V3ExtractionResult with simulated latency.
 * Phase 3 (future):       Calls POST /functions/v1/scan-flyer with auth.
 *
 * This service replaces the deleted services/flyerScanner.ts (heuristic regex).
 */

import type { V3ExtractionResult, V3ExtractedField } from '../types/v3';
import { composeFlyerScore } from './flyerScoreEngine';

// ─── Configuration ──────────────────────────────────────────────────────────

const MOCK_MIN_LATENCY_MS = 1200;
const MOCK_MAX_LATENCY_MS = 2400;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB per 7C
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/heic', 'image/heif'];

// ─── Public API ─────────────────────────────────────────────────────────────

export type ScanFlyerOptions = {
  /** Local URI from expo-image-picker */
  flyerUri: string;
  /** ECHO host id (for audit + auth) */
  hostId: string;
  /** Optional: file size in bytes for pre-flight validation */
  fileSizeBytes?: number;
  /** Optional: file mime type */
  mimeType?: string;
};

export type ScanFlyerError = {
  code: 'VALIDATION_FAILED' | 'UPLOAD_FAILED' | 'SCAN_FAILED' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
};

/**
 * Scan a flyer image and return extracted fields + Flyer Score.
 *
 * In Phase 1 returns mock data. In Phase 3, will:
 *   1. Upload flyer to Supabase Storage (private bucket)
 *   2. Call /functions/v1/scan-flyer with auth (Supabase JWT)
 *   3. Edge Function: HEIC→JPEG if needed → Claude Vision → return V3ExtractionResult
 */
export async function scanFlyer(opts: ScanFlyerOptions): Promise<V3ExtractionResult> {
  // ── Pre-flight validation ──
  const validationError = validateUpload(opts);
  if (validationError) {
    throw createError('VALIDATION_FAILED', validationError);
  }

  // ── Phase 1: mock with latency ──
  await simulateLatency();
  return buildMockExtraction(opts);

  // ── Phase 3 (future): real Edge Function call ──
  // const formData = new FormData();
  // formData.append('flyer', { uri: opts.flyerUri, name: 'flyer.jpg', type: opts.mimeType ?? 'image/jpeg' } as any);
  // const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  // const res = await fetch(`${supabaseUrl}/functions/v1/scan-flyer`, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${jwt}` },
  //   body: formData,
  // });
  // if (!res.ok) throw createError('SCAN_FAILED', `HTTP ${res.status}`);
  // return (await res.json()) as V3ExtractionResult;
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateUpload(opts: ScanFlyerOptions): string | null {
  if (!opts.flyerUri || opts.flyerUri.trim().length === 0) {
    return 'No flyer file selected.';
  }
  if (opts.fileSizeBytes != null && opts.fileSizeBytes > MAX_UPLOAD_BYTES) {
    return `File too large. Maximum 10 MB (got ${(opts.fileSizeBytes / 1024 / 1024).toFixed(1)} MB).`;
  }
  if (opts.mimeType && !ALLOWED_MIME_TYPES.includes(opts.mimeType.toLowerCase())) {
    return 'Unsupported file format. Use PNG, JPG, or HEIC.';
  }
  return null;
}

function createError(code: ScanFlyerError['code'], message: string): Error & ScanFlyerError {
  const err = new Error(message) as Error & ScanFlyerError;
  err.code = code;
  err.message = message;
  return err;
}

// ─── Mock Implementation (Phase 1) ──────────────────────────────────────────

function simulateLatency(): Promise<void> {
  const ms = MOCK_MIN_LATENCY_MS + Math.random() * (MOCK_MAX_LATENCY_MS - MOCK_MIN_LATENCY_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMockExtraction(_opts: ScanFlyerOptions): V3ExtractionResult {
  // Deterministic-ish mock with realistic confidence distribution
  const now = new Date().toISOString();
  const eventDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks out

  const fields: V3ExtractedField[] = [
    {
      key: 'title',
      label: 'Event Title',
      value: 'Summer Jam 2026',
      confidence: 92,
      hostConfirmed: false,
    },
    {
      key: 'date',
      label: 'Event Date',
      value: eventDate.toISOString().split('T')[0],
      confidence: 88,
      hostConfirmed: false,
    },
    {
      key: 'time',
      label: 'Start Time',
      value: '20:00',
      confidence: 85,
      hostConfirmed: false,
    },
    {
      key: 'venue',
      label: 'Venue',
      value: 'Showbox SoDo',
      confidence: 78,
      hostConfirmed: false,
    },
    {
      key: 'address',
      label: 'Address',
      value: '1700 1st Ave S, Seattle, WA',
      confidence: 72,
      hostConfirmed: false,
    },
    {
      key: 'age',
      label: 'Age Restriction',
      value: '21+',
      confidence: 81,
      hostConfirmed: false,
    },
    {
      key: 'price',
      label: 'Ticket Price',
      value: '45',
      confidence: 65, // Triggers hard-block per 4B
      hostConfirmed: false,
    },
    {
      key: 'category',
      label: 'Category',
      value: 'Music',
      confidence: 90,
      hostConfirmed: false,
    },
    {
      key: 'talent',
      label: 'Featured Talent',
      value: 'Various Artists',
      confidence: 58, // Triggers hard-block per 4B
      hostConfirmed: false,
    },

    {
      key: 'access_tier_hint',
      label: 'Access Tier Hint',
      value: 'GA + VIP',
      confidence: 76,
      hostConfirmed: false,
    },
    {
      key: 'sponsors',
      label: 'Sponsors',
      value: 'Local Partners',
      confidence: 61,
      hostConfirmed: false,
    },
    {
      key: 'contact',
      label: 'Contact / Social Handle',
      value: '@echoevents',
      confidence: 68,
      hostConfirmed: false,
    },
  ];

  const flyerScore = composeFlyerScore({
    visual: 84,
    completeness: 82,
    cta: 88,
    venue: 76,
  });

  return {
    fields,
    flyerScore,
    rawText: undefined,
    extractedAt: now,
  };
}
