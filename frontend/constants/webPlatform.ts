import type {
  EchoWebCheckoutGuardrail,
  EchoWebCreateEventStep,
  EchoWebHeroSignal,
  EchoWebNavItem,
  EchoWebPriority,
  EchoWebSearchFilter,
  EchoWebWorkspaceTab,
} from '../types/webPlatform';

export const ECHO_WEB_V2_PRIORITIES: EchoWebPriority[] = [
  'host_acquisition',
  'event_discovery',
  'nonprofit_support',
];

export const ECHO_WEB_V2_NAV: EchoWebNavItem[] = [
  { label: 'Home', route: '/' },
  { label: 'Events', route: '/events' },
  { label: 'For Hosts', route: '/hosts' },
  { label: 'Nonprofit', route: '/nonprofit' },
  { label: 'How It Works', route: '/how-it-works' },
  { label: 'Trust & Access', route: '/trust-access' },
  { label: 'Log In', route: '/login', secondary: true },
  { label: 'Start Hosting', route: '/host-application', primary: true },
  { label: 'Get the App', route: '/download', secondary: true },
];

export const ECHO_WEB_V2_HERO_SIGNALS: EchoWebHeroSignal[] = [
  {
    id: 'entry-ready',
    label: 'Entry Ready',
    value: 'Wallet access live',
    description: 'NFC-first tickets with QR fallback only inside the ticket view.',
    priority: 'hero',
  },
  {
    id: 'age-verified',
    label: '21+ Verified',
    value: 'Before payment',
    description: 'Restricted web purchases pause for phone-based age verification before checkout.',
    priority: 'hero',
  },
  {
    id: 'echo-circle',
    label: 'ECHO Circle',
    value: '3 of 5 claimed',
    description: 'Organizer starts the group; friends claim and pay separately from web or app.',
    priority: 'hero',
  },
  {
    id: 'door-mode-ready',
    label: 'Door Mode Ready',
    value: 'Host access prepared',
    description: 'Mobile/tablet remains primary for scanning; web supports Door Command Center.',
    priority: 'hero',
  },
  {
    id: 'event-health',
    label: 'Event Health 92%',
    value: 'Sales velocity rising',
    description: 'Host dashboard shows what is happening, why it matters, and what to do next.',
    priority: 'hero',
  },
];

export const ECHO_WEB_V2_SEARCH_FILTERS: EchoWebSearchFilter[] = [
  'query',
  'location',
  'date',
  'category',
  'age',
  'price',
  'verified_host',
  'circle_available',
];

export const ECHO_WEB_V2_CHECKOUT_GUARDRAILS: EchoWebCheckoutGuardrail[] = [
  {
    id: 'no-payment-before-age-verification',
    label: 'No payment before age verification',
    rule: 'For 18+/21+ purchases on web, checkout pauses and hands the user to phone verification before payment is enabled.',
    blocking: true,
  },
  {
    id: 'checkout-state-preserved',
    label: 'Resumable checkout state',
    rule: 'Ticket selection, fees, promo state, Circle path, and return URL must persist during phone verification handoff.',
    blocking: true,
  },
  {
    id: 'public-web-checkout',
    label: 'Full public web checkout',
    rule: 'Guests and logged-in users can complete checkout on web from day one without installing the app.',
    blocking: true,
  },
  {
    id: 'nonprofit-secondary',
    label: 'Nonprofit is supporting, not headline',
    rule: 'Nonprofit tools live under Nonprofit / For Hosts and only surface contextually for verified nonprofit hosts.',
    blocking: false,
  },
];

export const ECHO_WEB_V2_CREATE_EVENT_STEPS: EchoWebCreateEventStep[] = [
  'basics',
  'media',
  'tickets',
  'access_rules',
  'echo_circle',
  'market_pulse',
  'nonprofit_tools',
  'review_publish',
];

export const ECHO_WEB_V2_WORKSPACE_TABS: EchoWebWorkspaceTab[] = [
  'overview',
  'sales',
  'guests',
  'circle',
  'door',
  'payouts',
  'reports',
  'settings',
];
