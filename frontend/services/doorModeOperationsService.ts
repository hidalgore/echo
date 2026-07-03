/**
 * Door Mode Operations Service
 * Adds emergency lockdown, trusted scanner device controls, and scan latency
 * acceptance helpers for the locked Access Control System v1.
 */

import type { DoorModeSession, EmergencyLockdown, TrustedDevice } from '../types/canonicalPlatform';

export function createDoorModeSession(args: {
  sessionId: string;
  eventId: string;
  checkpoint: DoorModeSession['checkpoint'];
  scannerDeviceId: string;
  startedByUserId: string;
  status?: DoorModeSession['status'];
}): DoorModeSession {
  return {
    sessionId: args.sessionId,
    eventId: args.eventId,
    checkpoint: args.checkpoint,
    scannerDeviceId: args.scannerDeviceId,
    startedByUserId: args.startedByUserId,
    status: args.status ?? 'online',
    faceIdResumeEnabled: true,
    offlineEncryptionEnabled: true,
    remoteDisableEnabled: true,
    scanLatencyTargetMs: 500,
    startedAt: new Date().toISOString(),
  };
}

export function isTrustedScannerDevice(device: TrustedDevice): boolean {
  return device.trusted && device.reputation === 'trusted' && !device.revokedAt;
}

export function scanLatencyPasses(scanLatencyMs: number): boolean {
  return scanLatencyMs <= 500;
}

export function initiateEmergencyLockdown(args: {
  lockdownId: string;
  eventId: string;
  initiatedByUserId: string;
  reason: string;
}): EmergencyLockdown {
  return {
    lockdownId: args.lockdownId,
    eventId: args.eventId,
    initiatedByUserId: args.initiatedByUserId,
    reason: args.reason,
    admissionsPaused: true,
    incidentManagementActive: true,
    startedAt: new Date().toISOString(),
  };
}
