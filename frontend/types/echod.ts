/**
 * ECHO'd Experience Types
 * ═══════════════════════
 * Post-event feedback flow — verified attendees only.
 */

export type EchodRating = 1 | 2 | 3 | 4 | 5;

export type EchodRatingLabel = 'Poor' | 'Fair' | 'Good' | 'Great' | 'Excellent';

export const RATING_LABELS: Record<EchodRating, EchodRatingLabel> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

export type EchodVisibility = 'public' | 'host_only' | 'private';

export const POSITIVE_TAGS = [
  'Great energy',
  'Smooth entry',
  'Great music',
  'Great crowd',
  'Beautiful venue',
  'Well organized',
  'Friendly staff',
] as const;

export const CONSTRUCTIVE_TAGS = [
  'Long wait',
  'Overcrowded',
  'Hard to find',
  'Venue issues',
  'Poor communication',
  'Slow entry',
] as const;

export type PositiveTag = (typeof POSITIVE_TAGS)[number];
export type ConstructiveTag = (typeof CONSTRUCTIVE_TAGS)[number];
export type EchodTag = PositiveTag | ConstructiveTag;

export type EchodPhotoStatus = 'pending_review' | 'approved' | 'rejected';

export interface EchodPhoto {
  id: string;
  uri: string;
  status: EchodPhotoStatus;
  uploadedAt: string;
}

export type EchodSubmissionStatus =
  | 'not_started'
  | 'draft'
  | 'submitted_private'
  | 'submitted_host_only'
  | 'submitted_public';

export interface EchodExperience {
  id: string;
  ticketId: string;
  eventId: string;
  rating: EchodRating | null;
  tags: EchodTag[];
  reflection: string;
  photos: EchodPhoto[];
  visibility: EchodVisibility;
  status: EchodSubmissionStatus;
  submittedAt: string | null;
}

export const REFLECTION_MAX_LENGTH = 300;
export const MAX_PHOTOS = 3;
