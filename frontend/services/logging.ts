import { router, useGlobalSearchParams, usePathname, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCircleStore } from '../stores/circleStore';
import { useEventStore } from '../stores/eventStore';
import { useHostStore } from '../stores/hostStore';
import { useModeStore } from '../stores/modeStore';
import { useTicketStore } from '../stores/ticketStore';
import { useVerificationStore } from '../stores/verificationStore';

const LOGGING_ENABLED = true;
const LOG_PREFIX = '[ECHO]';
const MAX_STRING_LENGTH = 120;
const MAX_ARRAY_ITEMS = 8;
const MAX_OBJECT_KEYS = 16;
const SENSITIVE_KEY_PATTERN = /(password|token|secret|authorization|credential|qr|nfc|email|recipientHandle)/i;

let routerLoggingInstalled = false;
let storeLoggingInstalled = false;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const truncate = (value: string) =>
  value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;

const maskString = (value: string) => {
  if (!value) return value;
  if (value.startsWith('@')) return `${value.slice(0, 2)}***`;
  const atIndex = value.indexOf('@');
  if (atIndex > 1) return `${value.slice(0, 2)}***${value.slice(atIndex)}`;
  return `${value.slice(0, 3)}***`;
};

export const sanitizeForLog = (value: unknown, parentKey = '', depth = 0, seen = new WeakSet<object>()): unknown => {
  if (value == null) return value;
  if (depth > 4) return '[MaxDepth]';

  if (typeof value === 'string') {
    return SENSITIVE_KEY_PATTERN.test(parentKey) ? maskString(value) : truncate(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;

  if (value instanceof Date) return value.toISOString();

  if (value instanceof Set) {
    return {
      type: 'Set',
      size: value.size,
      values: Array.from(value).slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeForLog(item, parentKey, depth + 1, seen)),
    };
  }

  if (value instanceof Map) {
    return {
      type: 'Map',
      size: value.size,
      entries: Array.from(value.entries())
        .slice(0, MAX_ARRAY_ITEMS)
        .map(([k, v]) => [sanitizeForLog(k, `${parentKey}.key`, depth + 1, seen), sanitizeForLog(v, `${parentKey}.value`, depth + 1, seen)]),
    };
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncate(value.message),
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeForLog(item, parentKey, depth + 1, seen));
  }

  if (isObject(value)) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    const entries = Object.entries(value).slice(0, MAX_OBJECT_KEYS).map(([key, entryValue]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) return [key, '[REDACTED]'];
      return [key, sanitizeForLog(entryValue, key, depth + 1, seen)];
    });

    return Object.fromEntries(entries);
  }

  return String(value);
};

const stableSerialize = (value: unknown): string => {
  try {
    return JSON.stringify(sanitizeForLog(value));
  } catch {
    return String(value);
  }
};

const changedKeysBetween = (previous: Record<string, unknown>, next: Record<string, unknown>) => {
  const keys = Array.from(new Set([...Object.keys(previous), ...Object.keys(next)]));
  const changedKeys: string[] = [];
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};

  keys.forEach((key) => {
    if (stableSerialize(previous[key]) !== stableSerialize(next[key])) {
      changedKeys.push(key);
      before[key] = previous[key];
      after[key] = next[key];
    }
  });

  return { changedKeys, before, after };
};

const summarizeCounts = (items: Array<string | null | undefined>) => {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = item ?? 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

export function logEvent(scope: string, event: string, data?: unknown, level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
  if (!LOGGING_ENABLED) return;

  const payload = data === undefined ? undefined : sanitizeForLog(data);
  const label = `${LOG_PREFIX} ${new Date().toISOString()} ${scope} :: ${event}`;

  if (level === 'error') {
    payload === undefined ? console.error(label) : console.error(label, payload);
    return;
  }

  if (level === 'warn') {
    payload === undefined ? console.warn(label) : console.warn(label, payload);
    return;
  }

  payload === undefined ? console.log(label) : console.log(label, payload);
}

export function logTransition(scope: string, from: unknown, to: unknown, meta?: unknown) {
  logEvent(scope, 'transition', {
    from: sanitizeForLog(from),
    to: sanitizeForLog(to),
    ...(meta !== undefined ? { meta: sanitizeForLog(meta) } : {}),
  });
}

export function useValueTransitionLogger<T>(scope: string, label: string, value: T, options?: { logInitial?: boolean }) {
  const previousSerializedRef = useRef<string | null>(null);
  const previousValueRef = useRef<unknown>(undefined);
  const serialized = stableSerialize(value);

  useEffect(() => {
    const nextValue = sanitizeForLog(value);

    if (previousSerializedRef.current === null) {
      previousSerializedRef.current = serialized;
      previousValueRef.current = nextValue;
      if (options?.logInitial) {
        logEvent(scope, `${label}.initial`, { value: nextValue });
      }
      return;
    }

    if (previousSerializedRef.current !== serialized) {
      logTransition(`${scope}.${label}`, previousValueRef.current, nextValue);
      previousSerializedRef.current = serialized;
      previousValueRef.current = nextValue;
    }
  }, [label, options?.logInitial, scope, serialized]);
}

const describeRouteTarget = (target: unknown) => {
  if (typeof target === 'string') return target;
  if (isObject(target)) {
    return sanitizeForLog({
      pathname: (target as { pathname?: string }).pathname ?? null,
      params: (target as { params?: unknown }).params ?? null,
    });
  }
  return sanitizeForLog(target);
};

const installRouterMethodLogging = () => {
  if (routerLoggingInstalled) return;
  routerLoggingInstalled = true;

  const routerInstance = router as unknown as Record<string, unknown> & { __echoPatched?: boolean };
  if (routerInstance.__echoPatched) return;

  const methods = ['navigate', 'push', 'replace', 'back', 'dismiss', 'dismissAll', 'setParams'];

  methods.forEach((methodName) => {
    const original = routerInstance[methodName];
    if (typeof original !== 'function') return;

    routerInstance[methodName] = (...args: unknown[]) => {
      const target = args.length > 0 ? describeRouteTarget(args[0]) : null;
      logEvent('navigation.intent', methodName, {
        target,
        args: sanitizeForLog(args.slice(1)),
      });
      return (original as (...fnArgs: unknown[]) => unknown).apply(routerInstance, args);
    };
  });

  routerInstance.__echoPatched = true;
  logEvent('logging', 'router_logging_enabled');
};

const installStoreLogger = <TState extends object>(config: {
  name: string;
  store: {
    getState: () => TState;
    subscribe: (listener: (state: TState) => void) => () => void;
  };
  snapshot: (state: TState) => Record<string, unknown>;
}) => {
  let previousSnapshot = config.snapshot(config.store.getState());

  config.store.subscribe((state) => {
    const nextSnapshot = config.snapshot(state);
    const { changedKeys, before, after } = changedKeysBetween(previousSnapshot, nextSnapshot);

    if (changedKeys.length > 0) {
      logEvent(`store.${config.name}`, 'state_changed', {
        changedKeys,
        before,
        after,
      });
    }

    previousSnapshot = nextSnapshot;
  });
};

const installStoreLogging = () => {
  if (storeLoggingInstalled) return;
  storeLoggingInstalled = true;

  installStoreLogger({
    name: 'auth',
    store: useAuthStore as unknown as { getState: () => ReturnType<typeof useAuthStore.getState>; subscribe: (listener: (state: ReturnType<typeof useAuthStore.getState>) => void) => () => void },
    snapshot: (state) => ({
      userId: state.user?.id ?? null,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      hasSeenIntro: state.hasSeenIntro,
    }),
  });

  installStoreLogger({
    name: 'circle',
    store: useCircleStore as unknown as { getState: () => ReturnType<typeof useCircleStore.getState>; subscribe: (listener: (state: ReturnType<typeof useCircleStore.getState>) => void) => () => void },
    snapshot: (state) => ({
      circleId: state.circle?.id ?? null,
      status: state.circle?.status ?? null,
      secondsRemaining: state.secondsRemaining,
      claimedTickets: state.circle?.members.filter((member) => member.status === 'claimed').length ?? 0,
      totalTickets: state.circle?.totalTickets ?? 0,
      memberStatusCounts: summarizeCounts(state.circle?.members?.map((member) => member.status) ?? []),
    }),
  });

  installStoreLogger({
    name: 'events',
    store: useEventStore as unknown as { getState: () => ReturnType<typeof useEventStore.getState>; subscribe: (listener: (state: ReturnType<typeof useEventStore.getState>) => void) => () => void },
    snapshot: (state) => ({
      eventCount: state.events.length,
      trendingCount: state.trending.length,
      happeningNowCount: state.happeningNow.length,
      upcomingCount: state.upcoming.length,
      searchResultCount: state.searchResults.length,
      savedCount: state.savedIds.size,
      isLoading: state.isLoading,
    }),
  });

  installStoreLogger({
    name: 'host',
    store: useHostStore as unknown as { getState: () => ReturnType<typeof useHostStore.getState> & { activeDraft?: { id?: string | null } | null; drafts?: Array<{ id: string }> }; subscribe: (listener: (state: ReturnType<typeof useHostStore.getState> & { activeDraft?: { id?: string | null } | null; drafts?: Array<{ id: string }> }) => void) => () => void },
    snapshot: (state) => ({
      hostCount: state.hosts.length,
      followingCount: state.hosts.filter((host) => host.isFollowing).length,
      initialized: state.initialized,
      activeDraftId: state.activeDraft?.id ?? null,
      draftCount: state.drafts?.length ?? 0,
    }),
  });

  installStoreLogger({
    name: 'role',
    store: useModeStore as unknown as { getState: () => ReturnType<typeof useModeStore.getState>; subscribe: (listener: (state: ReturnType<typeof useModeStore.getState>) => void) => () => void },
    snapshot: (state) => ({
      currentRole: state.currentRole,
      hostReady: state.hostReady,
      activeMode: state.activeMode,
    }),
  });

  installStoreLogger({
    name: 'tickets',
    store: useTicketStore as unknown as { getState: () => ReturnType<typeof useTicketStore.getState>; subscribe: (listener: (state: ReturnType<typeof useTicketStore.getState>) => void) => () => void },
    snapshot: (state) => ({
      ticketCount: state.tickets.length,
      activeCount: state.tickets.filter((ticket) => ticket.status === 'active').length,
      inactiveCount: state.tickets.filter((ticket) => ticket.status !== 'active').length,
      isLoading: state.isLoading,
      lastPurchasedTicketId: state.lastPurchasedTicketId,
    }),
  });

  installStoreLogger({
    name: 'verification',
    store: useVerificationStore as unknown as { getState: () => ReturnType<typeof useVerificationStore.getState>; subscribe: (listener: (state: ReturnType<typeof useVerificationStore.getState>) => void) => () => void },
    snapshot: (state) => ({
      status: state.status,
      verifiedAgeBand: state.verifiedAgeBand,
      verifiedAt: state.verifiedAt,
      method: state.method,
      attemptCount: state.attemptCount,
      isLocked: state.isLocked,
      nonprofitStatus: state.nonprofitStatus,
      nonprofitName: state.nonprofitName,
    }),
  });

  logEvent('logging', 'store_logging_enabled');
};

export function installAppLogging() {
  installRouterMethodLogging();
  installStoreLogging();
}

export function NavigationTransitionLogger() {
  const pathname = usePathname();
  const segments = useSegments();
  const params = useGlobalSearchParams();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const payload = {
      pathname,
      segments,
      params,
    };

    if (previousPath === null) {
      logEvent('navigation.route', 'initial', payload);
    } else if (previousPath !== pathname) {
      logTransition('navigation.route', previousPath, pathname, payload);
    } else {
      logEvent('navigation.route', 'params_changed', payload);
    }

    previousPathRef.current = pathname;
  }, [pathname, stableSerialize(params), stableSerialize(segments)]);

  return null;
}
