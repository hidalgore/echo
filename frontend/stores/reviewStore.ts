/**
 * Review & Post-Event Store
 * ══════════════════════════
 * Reviews, attendee list, and photo uploads for past events.
 * Photos validated via EXIF metadata (date/time/GPS).
 */
import { create } from 'zustand';

export type EventPhoto = {
  id: string;
  uri: string;
  verified: boolean;         // EXIF check passed
  verificationNote?: string; // "Date matches" / "Location verified"
  uploadedAt: string;
};

export type EventReview = {
  id: string;
  ticketId: string;
  eventId: string;
  rating: number;            // 1-5
  comment: string;
  createdAt: string;
};

export type EventAttendee = {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'organizer' | 'member';
};

interface ReviewState {
  reviews: Record<string, EventReview>;        // keyed by ticketId
  photos: Record<string, EventPhoto[]>;        // keyed by ticketId
  attendees: Record<string, EventAttendee[]>;  // keyed by ticketId

  submitReview: (ticketId: string, eventId: string, rating: number, comment: string) => void;
  addPhoto: (ticketId: string, photo: EventPhoto) => void;
  removePhoto: (ticketId: string, photoId: string) => void;
  getReview: (ticketId: string) => EventReview | null;
  getPhotos: (ticketId: string) => EventPhoto[];
  getAttendees: (ticketId: string) => EventAttendee[];
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: {},
  photos: {},
  attendees: {
    // Mock attendees for demo
    fallback: [
      { id: 'att_1', name: 'You', role: 'organizer' },
      { id: 'att_2', name: 'Natasha K.', role: 'member' },
      { id: 'att_3', name: 'Alex J.', role: 'member' },
    ],
  },

  submitReview: (ticketId, eventId, rating, comment) => {
    set((state) => ({
      reviews: {
        ...state.reviews,
        [ticketId]: {
          id: `rev_${Date.now()}`,
          ticketId,
          eventId,
          rating,
          comment,
          createdAt: new Date().toISOString(),
        },
      },
    }));
  },

  addPhoto: (ticketId, photo) => {
    set((state) => {
      const existing = state.photos[ticketId] || [];
      if (existing.length >= 5) return state;
      return { photos: { ...state.photos, [ticketId]: [...existing, photo] } };
    });
  },

  removePhoto: (ticketId, photoId) => {
    set((state) => ({
      photos: {
        ...state.photos,
        [ticketId]: (state.photos[ticketId] || []).filter(p => p.id !== photoId),
      },
    }));
  },

  getReview: (ticketId) => get().reviews[ticketId] || null,
  getPhotos: (ticketId) => get().photos[ticketId] || [],
  getAttendees: (ticketId) => get().attendees[ticketId] || get().attendees.fallback || [],
}));
