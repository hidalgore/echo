/**
 * ECHO'd Experience Store
 * ═══════════════════════
 * Manages the post-event feedback flow state.
 */
import { create } from 'zustand';
import type {
  EchodExperience,
  EchodRating,
  EchodTag,
  EchodVisibility,
  EchodPhoto,
  EchodSubmissionStatus,
} from '../types/echod';

interface EchodState {
  /** Active draft being composed */
  draft: EchodExperience | null;
  /** All submitted experiences keyed by ticketId */
  submissions: Record<string, EchodExperience>;

  // ── Actions ──
  startDraft: (ticketId: string, eventId: string) => void;
  setRating: (rating: EchodRating) => void;
  toggleTag: (tag: EchodTag) => void;
  setReflection: (text: string) => void;
  addPhoto: (photo: EchodPhoto) => void;
  removePhoto: (photoId: string) => void;
  setVisibility: (visibility: EchodVisibility) => void;
  submit: () => void;
  discardDraft: () => void;
  getSubmission: (ticketId: string) => EchodExperience | null;
  getStatus: (ticketId: string) => EchodSubmissionStatus;
}

export const useEchodStore = create<EchodState>((set, get) => ({
  draft: null,
  submissions: {},

  startDraft: (ticketId, eventId) => {
    const existing = get().submissions[ticketId];
    if (existing) return; // Already submitted
    set({
      draft: {
        id: `echod_${Date.now()}`,
        ticketId,
        eventId,
        rating: null,
        tags: [],
        reflection: '',
        photos: [],
        visibility: 'host_only', // Locked default
        status: 'draft',
        submittedAt: null,
      },
    });
  },

  setRating: (rating) =>
    set((s) => (s.draft ? { draft: { ...s.draft, rating } } : {})),

  toggleTag: (tag) =>
    set((s) => {
      if (!s.draft) return {};
      const tags = s.draft.tags.includes(tag)
        ? s.draft.tags.filter((t) => t !== tag)
        : [...s.draft.tags, tag];
      return { draft: { ...s.draft, tags } };
    }),

  setReflection: (text) =>
    set((s) => (s.draft ? { draft: { ...s.draft, reflection: text.slice(0, 300) } } : {})),

  addPhoto: (photo) =>
    set((s) => {
      if (!s.draft || s.draft.photos.length >= 3) return {};
      return { draft: { ...s.draft, photos: [...s.draft.photos, photo] } };
    }),

  removePhoto: (photoId) =>
    set((s) => {
      if (!s.draft) return {};
      return { draft: { ...s.draft, photos: s.draft.photos.filter((p) => p.id !== photoId) } };
    }),

  setVisibility: (visibility) =>
    set((s) => (s.draft ? { draft: { ...s.draft, visibility } } : {})),

  submit: () =>
    set((s) => {
      if (!s.draft || !s.draft.rating) return {};
      const statusMap: Record<EchodVisibility, EchodSubmissionStatus> = {
        public: 'submitted_public',
        host_only: 'submitted_host_only',
        private: 'submitted_private',
      };
      const submitted: EchodExperience = {
        ...s.draft,
        status: statusMap[s.draft.visibility],
        submittedAt: new Date().toISOString(),
      };
      return {
        draft: null,
        submissions: { ...s.submissions, [submitted.ticketId]: submitted },
      };
    }),

  discardDraft: () => set({ draft: null }),

  getSubmission: (ticketId) => get().submissions[ticketId] ?? null,

  getStatus: (ticketId) => {
    if (get().draft?.ticketId === ticketId) return 'draft';
    return get().submissions[ticketId]?.status ?? 'not_started';
  },
}));
