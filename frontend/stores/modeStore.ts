/**
 * Mode Store
 * ══════════
 * One account, two modes. Replaces roleStore.
 * - enabledModes[]: which modes the user has unlocked
 * - activeMode: which mode is currently active
 * - capabilities: derived from hostProfile + payoutProfile + riskProfile
 *
 * Re-exports legacy roleStore API for backward compatibility.
 */
import { create } from 'zustand';
import {
  type AppMode,
  type HostAccessStatus,
  type PayoutStatus,
  type RiskStatus,
  type AccountStatus,
  type HostCapabilities,
  deriveCapabilities,
} from '../types/hostProfile';

// ─── Legacy compat types ────────────────────────────────────────────────────
export type UserRole = 'attendee' | 'host';

interface ModeState {
  // ── Core mode system ──
  activeMode: AppMode;
  enabledModes: AppMode[];
  accountStatus: AccountStatus;

  // ── Host status inputs (fed by hostProfileStore) ──
  hostAccessStatus: HostAccessStatus;
  payoutStatus: PayoutStatus;
  riskStatus: RiskStatus;

  // ── Derived capabilities ──
  capabilities: HostCapabilities;

  // ── Actions ──
  setActiveMode: (mode: AppMode) => void;
  enableMode: (mode: AppMode) => void;
  updateHostInputs: (inputs: {
    hostAccessStatus?: HostAccessStatus;
    payoutStatus?: PayoutStatus;
    riskStatus?: RiskStatus;
    accountStatus?: AccountStatus;
  }) => void;

  // ── Queries ──
  isHostEnabled: () => boolean;
  canSwitchToHost: () => boolean;
  getMenuState: () => MenuState;

  // ── Legacy compat (used by existing components) ──
  currentRole: UserRole;
  availableRoles: UserRole[];
  hostReady: boolean;
  setRole: (role: UserRole) => void;
  canAccessRole: (role: UserRole) => boolean;
  setHostReady: (ready: boolean) => void;
}

export type MenuState =
  | 'consumer_only'      // HOST not started
  | 'setup_in_progress'  // HOST setup started but not done
  | 'host_active'        // HOST enabled and available
  | 'host_restricted';   // HOST enabled but limited

function recompute(
  hostAccessStatus: HostAccessStatus,
  payoutStatus: PayoutStatus,
  riskStatus: RiskStatus,
  accountStatus: AccountStatus,
): HostCapabilities {
  return deriveCapabilities(hostAccessStatus, payoutStatus, riskStatus, accountStatus);
}

export const useModeStore = create<ModeState>((set, get) => ({
  // ── Defaults ──
  activeMode: 'echo',
  enabledModes: ['echo'],
  accountStatus: 'active',
  hostAccessStatus: 'not_started',
  payoutStatus: 'not_started',
  riskStatus: 'clear',
  capabilities: recompute('not_started', 'not_started', 'clear', 'active'),

  // ── Legacy compat defaults ──
  currentRole: 'attendee',
  availableRoles: ['attendee', 'host'],
  hostReady: false,

  setActiveMode: (mode) => {
    const s = get();
    if (!s.enabledModes.includes(mode)) return;
    if (mode === 'host' && !s.capabilities.canAccessHostMode) return;
    const legacyRole: UserRole = mode === 'host' ? 'host' : 'attendee';
    set({ activeMode: mode, currentRole: legacyRole });
  },

  enableMode: (mode) => {
    const s = get();
    if (s.enabledModes.includes(mode)) return;
    set({ enabledModes: [...s.enabledModes, mode] });
  },

  updateHostInputs: (inputs) => {
    const s = get();
    const hostAccessStatus = inputs.hostAccessStatus ?? s.hostAccessStatus;
    const payoutStatus = inputs.payoutStatus ?? s.payoutStatus;
    const riskStatus = inputs.riskStatus ?? s.riskStatus;
    const accountStatus = inputs.accountStatus ?? s.accountStatus;
    const capabilities = recompute(hostAccessStatus, payoutStatus, riskStatus, accountStatus);

    // Auto-enable host mode when activated
    let enabledModes = s.enabledModes;
    const hostActive = hostAccessStatus === 'active' || hostAccessStatus === 'restricted';
    if (hostActive && !enabledModes.includes('host')) {
      enabledModes = [...enabledModes, 'host'];
    }

    set({
      hostAccessStatus,
      payoutStatus,
      riskStatus,
      accountStatus,
      capabilities,
      enabledModes,
      hostReady: hostActive,
    });
  },

  isHostEnabled: () => get().enabledModes.includes('host'),

  canSwitchToHost: () => {
    const s = get();
    return s.enabledModes.includes('host') && s.capabilities.canAccessHostMode;
  },

  getMenuState: (): MenuState => {
    const s = get();
    switch (s.hostAccessStatus) {
      case 'not_started':
        return 'consumer_only';
      case 'in_progress':
        return 'setup_in_progress';
      case 'active':
        return 'host_active';
      case 'action_required':
        return 'setup_in_progress';
      case 'restricted':
        return 'host_restricted';
      case 'suspended':
        return 'consumer_only';
      default:
        return 'consumer_only';
    }
  },

  // ── Legacy compat ──
  canAccessRole: (role) => {
    if (role === 'attendee') return true;
    if (role === 'host') return get().capabilities.canAccessHostMode;
    return false;
  },
  setRole: (role) => {
    if (role === 'host') get().setActiveMode('host');
    else get().setActiveMode('echo');
  },
  setHostReady: (ready) => {
    if (ready) {
      get().updateHostInputs({ hostAccessStatus: 'active' });
    }
  },
}));

// ── Legacy compat exports ───────────────────────────────────────────────────
// These map old roleStore API → new modeStore so existing components don't break.

export const useRoleStore = useModeStore;

export const getRoleLabel = (role: UserRole): string => ({
  attendee: 'ECHO',
  host: 'HOST',
}[role]);

export const getRoleColor = (role: UserRole): string => ({
  attendee: '#7B4DFF',
  host: '#20C7FF',
}[role]);
