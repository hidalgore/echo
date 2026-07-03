/**
 * hooks/useCredentialRotation.ts
 * ══════════════════════════════
 * Phase 4 (W4): the rotating entry credential, always server-minted via
 * getPorts().ticket — the client never mints tokens (locked rule), and the
 * Phase 3 placeholder qr_code/nfc_credential strings on local wallet records
 * must never be rendered as credentials.
 *
 * Rotation rides the credential's REAL expires_at (~30s server cadence):
 * fetch on mount, then POST .../refresh just before expiry, forever, until
 * the caller unmounts or passes `undefined` (sheet closed). Timers do not
 * fire in the background, so returning to the foreground re-fetches
 * immediately — a door line is exactly where the app comes back from
 * standby with a dead token.
 *
 * Terminal refusals (404 owner-mismatch/absent, 409 ticket_not_active) stop
 * the loop; transient failures (network, 5xx, 429) retry at the fallback
 * cadence so a flaky connection recovers without user action.
 */

import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { CONFIG } from '../constants/config';
import { getPorts } from '../services/api/ports';
import type { CredentialDTO } from '../types/api/dto';

/** Rotate slightly before the server expiry so the shown token never dies mid-scan. */
const REFRESH_LEAD_MS = 2_000;
/** Floor between calls — never spin-loop on clock skew or a stale expires_at. */
const MIN_DELAY_MS = 1_000;
const TERMINAL_STATUSES = new Set([404, 409]);

export type CredentialRotationState = {
  credential: CredentialDTO | null;
  /** Envelope message for the last failure; null while healthy. */
  error: string | null;
};

export function useCredentialRotation(ticketId: string | undefined): CredentialRotationState {
  const [state, setState] = useState<CredentialRotationState>({ credential: null, error: null });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!ticketId) {
      setState({ credential: null, error: null });
      return;
    }
    activeRef.current = true;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const schedule = (delayMs: number, rotate: boolean) => {
      clearTimer();
      timerRef.current = setTimeout(() => void fetchCredential(rotate), delayMs);
    };

    const fetchCredential = async (rotate: boolean) => {
      const port = getPorts().ticket;
      const result = rotate
        ? await port.refreshCredential(ticketId)
        : await port.getCredential(ticketId);
      if (!activeRef.current) return;

      if (!result.ok) {
        setState({ credential: null, error: result.error.message });
        if (!TERMINAL_STATUSES.has(result.status)) {
          schedule(CONFIG.NFC_CREDENTIAL_ROTATE_INTERVAL_MS, false);
        }
        return;
      }

      setState({ credential: result.data, error: null });
      const untilExpiry = new Date(result.data.expires_at).getTime() - Date.now();
      const delay = Number.isFinite(untilExpiry)
        ? Math.max(untilExpiry - REFRESH_LEAD_MS, MIN_DELAY_MS)
        : CONFIG.NFC_CREDENTIAL_ROTATE_INTERVAL_MS;
      schedule(delay, true);
    };

    void fetchCredential(false);

    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') void fetchCredential(false);
    });

    return () => {
      activeRef.current = false;
      clearTimer();
      appState.remove();
    };
  }, [ticketId]);

  return state;
}
