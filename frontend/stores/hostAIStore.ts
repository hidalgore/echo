/**
 * Host AI Store
 * ═════════════
 * Mock AI intelligence with simulated latency.
 * Manages state for Overview, Create Event, and Post-Event Recap surfaces.
 */
import { create } from 'zustand';
import type {
  IntelligenceState, IntelligenceInsight, EventHealthValue,
  AITitleSuggestion, AIDescriptionOption, DescriptionTone,
  EventReadiness, ReadinessStatus, PricingGuidance,
  ClarityIssue, PostEventRecap, RecapTone,
} from '../types/hostAI';

// ─── Simulated latency helper ───────────────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number) => base + Math.random() * 400;

// ─── Mock data ──────────────────────────────────────────────────────────────

const MOCK_INSIGHTS: Record<IntelligenceState, IntelligenceInsight> = {
  no_event: {
    state: 'no_event', eyebrow: 'ECHO Intelligence',
    mainInsight: 'Your HOST profile is ready. Creating your first event will unlock performance insights and smarter recommendations.',
    ctaLabel: 'Create Event', ctaAction: '/(host)/create',
  },
  draft_exists: {
    state: 'draft_exists', eyebrow: 'ECHO Intelligence',
    mainInsight: 'Your draft is close. A stronger title and clearer event details will improve conversion once you publish.',
    supportLine: 'Events with complete listings tend to perform better before launch.',
    ctaLabel: 'Improve Listing', ctaAction: '/(host)/create',
  },
  weak_momentum: {
    state: 'weak_momentum', eyebrow: 'ECHO Intelligence',
    mainInsight: 'Sales are slower than expected for this stage. A reminder post tonight may help increase conversions.',
    supportLine: 'This event is pacing behind similar events in your market.',
    ctaLabel: 'Generate Promo Copy', ctaAction: 'generate_promo',
  },
  strong_momentum: {
    state: 'strong_momentum', eyebrow: 'ECHO Intelligence',
    mainInsight: 'Your event is performing ahead of recent average. Consider adding a final ticket tier or expanding capacity if space allows.',
    supportLine: 'Demand is rising faster than expected.',
    ctaLabel: 'Review Tickets', ctaAction: '/(host)/create',
  },
  event_today: {
    state: 'event_today', eyebrow: 'ECHO Intelligence',
    mainInsight: 'Your event is today. Prepare Door Mode and review guest flow before arrivals begin.',
    supportLine: 'Early setup helps entry run smoothly during peak arrival windows.',
    ctaLabel: 'Open Door Checklist', ctaAction: '/(host)/(tabs)/door',
  },
  live_event: {
    state: 'live_event', eyebrow: 'ECHO Intelligence',
    mainInsight: 'Door operations are the priority right now. Monitor check-ins and keep Door Mode ready.',
    supportLine: 'Guest arrival volume is likely active now.',
    ctaLabel: 'Open Door Mode', ctaAction: '/(host)/(tabs)/door',
  },
  post_event_recap: {
    state: 'post_event_recap', eyebrow: 'ECHO Intelligence',
    mainInsight: 'Your event recap is ready with performance insights and recommendations for next time.',
    supportLine: 'Review what worked and what to improve before launching your next event.',
    ctaLabel: 'View Recap', ctaAction: '/(host)/recap',
  },
};

const MOCK_TITLES: AITitleSuggestion[] = [
  { id: 't1', text: 'Midnight Pulse: Friday Night at Nova' },
  { id: 't2', text: 'Late Night Social at Nova' },
  { id: 't3', text: 'Rooftop Rhythm: Friday After Dark' },
];

const MOCK_DESCRIPTIONS: Record<DescriptionTone, string> = {
  concise: 'Join us for an unforgettable night of music, drinks, and energy. Doors open at 9 PM with DJ sets running until 2 AM. Limited tickets available.',
  energetic: 'Get ready for the hottest night of the month! Electric beats, craft cocktails, and a crowd that knows how to move. This is the one you don\'t want to miss.',
  premium: 'An elevated evening experience featuring curated sounds, premium bar selections, and an intimate atmosphere designed for those who appreciate nightlife done right.',
};

const MOCK_RECAP_STRONG: PostEventRecap = {
  summary: { tone: 'strong', narrative: 'This event performed well, with strong final-week momentum and healthy attendance. Sales accelerated in the last 48 hours, while early conversion started softer than expected.' },
  whatWorked: [
    { id: 'w1', text: 'Final-week demand was strong' },
    { id: 'w2', text: 'Check-in flow remained smooth' },
    { id: 'w3', text: 'Ticket pricing supported healthy sell-through' },
  ],
  whatToImprove: [
    { id: 'i1', text: 'Earlier promotion could improve sell-through' },
    { id: 'i2', text: 'Event details could better highlight lineup value' },
  ],
  recommendations: [
    { id: 'r1', copy: 'Launch promotion 2 days earlier to improve early awareness.', ctaLabel: 'Generate Promo Plan', ctaAction: 'generate_promo' },
    { id: 'r2', copy: 'Use a clearer event title to improve listing conversion.', ctaLabel: 'Create Better Title', ctaAction: 'improve_title' },
    { id: 'r3', copy: 'Reuse this event format with minor improvements.', ctaLabel: 'Duplicate Event', ctaAction: 'duplicate' },
  ],
};

// ─── Store ──────────────────────────────────────────────────────────────────

interface HostAIState {
  // ── Loading states ──
  insightLoading: boolean;
  titlesLoading: boolean;
  descriptionsLoading: boolean;
  readinessLoading: boolean;
  pricingLoading: boolean;
  recapLoading: boolean;

  // ── Data ──
  currentInsight: IntelligenceInsight | null;
  currentHealthChip: EventHealthValue | null;
  titleSuggestions: AITitleSuggestion[];
  descriptionOptions: AIDescriptionOption[];
  eventReadiness: EventReadiness | null;
  pricingGuidance: PricingGuidance | null;
  clarityIssues: ClarityIssue[];
  recap: PostEventRecap | null;
  insightDismissed: boolean;

  // ── Actions ──
  fetchInsight: (state?: IntelligenceState) => Promise<void>;
  fetchHealthChip: () => void;
  fetchTitleSuggestions: (currentTitle: string) => Promise<void>;
  fetchDescriptionOptions: (context: string) => Promise<void>;
  fetchReadiness: (fields: Record<string, boolean>) => Promise<void>;
  fetchPricingGuidance: (price: number, eventType: string) => Promise<void>;
  checkClarity: (description: string) => void;
  fetchRecap: (eventId: string) => Promise<void>;
  dismissInsight: () => void;
  clearTitles: () => void;
  clearDescriptions: () => void;
}

export const useHostAIStore = create<HostAIState>((set, get) => ({
  insightLoading: false,
  titlesLoading: false,
  descriptionsLoading: false,
  readinessLoading: false,
  pricingLoading: false,
  recapLoading: false,
  currentInsight: null,
  currentHealthChip: null,
  titleSuggestions: [],
  descriptionOptions: [],
  eventReadiness: null,
  pricingGuidance: null,
  clarityIssues: [],
  recap: null,
  insightDismissed: false,

  fetchInsight: async (state) => {
    set({ insightLoading: true });
    await delay(jitter(600));
    const s = state || 'draft_exists';
    set({ currentInsight: MOCK_INSIGHTS[s], insightLoading: false, insightDismissed: false });
  },

  fetchHealthChip: () => {
    // Simulate: pick based on mock state
    set({ currentHealthChip: 'strong_momentum' });
  },

  fetchTitleSuggestions: async (currentTitle) => {
    set({ titlesLoading: true });
    await delay(jitter(800));
    // Simulate: shuffle suggestions
    const shuffled = [...MOCK_TITLES].sort(() => Math.random() - 0.5);
    set({ titleSuggestions: shuffled, titlesLoading: false });
  },

  fetchDescriptionOptions: async (context) => {
    set({ descriptionsLoading: true });
    await delay(jitter(1000));
    const options: AIDescriptionOption[] = [
      { tone: 'concise', text: MOCK_DESCRIPTIONS.concise },
      { tone: 'energetic', text: MOCK_DESCRIPTIONS.energetic },
      { tone: 'premium', text: MOCK_DESCRIPTIONS.premium },
    ];
    set({ descriptionOptions: options, descriptionsLoading: false });
  },

  fetchReadiness: async (fields) => {
    set({ readinessLoading: true });
    await delay(jitter(500));
    const hasTitle = fields.title ?? false;
    const hasDesc = fields.description ?? false;
    const hasTickets = fields.tickets ?? false;
    const hasImage = fields.image ?? false;
    const hasPayout = fields.payout ?? false;

    const cat = (label: string, done: boolean): { label: string; status: 'strong' | 'good' | 'needs_attention' | 'incomplete' } => ({
      label,
      status: done ? 'strong' : 'incomplete',
    });

    const categories = [
      cat('Listing Quality', hasTitle && hasDesc),
      cat('Pricing Readiness', hasTickets),
      cat('Conversion Readiness', hasTitle && hasDesc && hasImage),
      cat('Door Readiness', true),
      cat('Payout Readiness', hasPayout),
    ];

    const statuses = categories.map((c) => c.status);
    let overall: ReadinessStatus = 'strong';
    if (statuses.includes('incomplete')) overall = 'incomplete';
    else if (statuses.includes('needs_attention')) overall = 'needs_attention';
    else if (statuses.includes('good')) overall = 'good';

    set({ eventReadiness: { overall, categories }, readinessLoading: false });
  },

  fetchPricingGuidance: async (price, eventType) => {
    set({ pricingLoading: true });
    await delay(jitter(700));

    let guidance: PricingGuidance;
    if (price < 15) {
      guidance = {
        tone: 'recommendation',
        recommendation: 'Consider a lower first tier to improve early conversions.',
        support: 'This recommendation is based on event type, market, and current setup.',
        ctaLabel: 'Add Early Tier', ctaAction: 'add_tier',
      };
    } else if (price > 80) {
      guidance = {
        tone: 'caution',
        recommendation: 'Current pricing may slow early sales for this event type.',
        support: 'This recommendation is based on event type, market, and current setup.',
        ctaLabel: 'Adjust Pricing', ctaAction: 'adjust_price',
      };
    } else {
      guidance = {
        tone: 'affirmation',
        recommendation: 'Your current pricing structure looks balanced for launch.',
        support: 'This recommendation is based on event type, market, and current setup.',
        ctaLabel: 'Keep Current Pricing', ctaAction: 'keep',
      };
    }
    set({ pricingGuidance: guidance, pricingLoading: false });
  },

  checkClarity: (description) => {
    const issues: ClarityIssue[] = [];
    if (description.length > 20 && /\d{1,2}(:\d{2})?\s*(pm|am)/i.test(description) && /\d{1,2}(:\d{2})?\s*(pm|am)/i.test(description.slice(description.indexOf('m') + 1))) {
      issues.push({ id: 'c1', field: 'description', message: 'Your description may confuse guests about start time.', ctaLabel: 'Fix with AI' });
    }
    if (description.length > 50 && !/(21\+|18\+|all ages)/i.test(description) && description.toLowerCase().includes('bar')) {
      issues.push({ id: 'c2', field: 'description', message: 'Age restriction may need clarification for events with bar access.', ctaLabel: 'Add Age Info' });
    }
    set({ clarityIssues: issues });
  },

  fetchRecap: async (eventId) => {
    set({ recapLoading: true });
    await delay(jitter(1200));
    set({ recap: MOCK_RECAP_STRONG, recapLoading: false });
  },

  dismissInsight: () => set({ insightDismissed: true }),
  clearTitles: () => set({ titleSuggestions: [] }),
  clearDescriptions: () => set({ descriptionOptions: [] }),
}));
