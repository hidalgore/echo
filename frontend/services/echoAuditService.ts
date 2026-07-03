/**
 * EchoAuditService — Immutable Audit Contract
 * Logs actor, action, timestamp, location, device, target, and result.
 * This in-memory helper is a frontend/mock contract. Production must persist
 * append-only records server-side with immutable retention.
 */

import type { EchoAuditRecord, EchoAuditResult, EchoAuditTargetType } from '../types/canonicalPlatform';
import type { TeamRole } from '../types/v3';

export function buildAuditRecord(args: {
  actorUserId: string;
  actorRole?: TeamRole;
  action: string;
  targetType: EchoAuditTargetType;
  targetId: string;
  result: EchoAuditResult;
  deviceId?: string;
  locationLabel?: string;
  metadata?: EchoAuditRecord['metadata'];
  nowIso?: string;
}): EchoAuditRecord {
  return {
    auditId: `audit_${Math.random().toString(36).slice(2)}_${Date.now()}`,
    actorUserId: args.actorUserId,
    actorRole: args.actorRole,
    action: args.action,
    timestamp: args.nowIso ?? new Date().toISOString(),
    location: args.locationLabel ? { label: args.locationLabel } : undefined,
    deviceId: args.deviceId,
    targetType: args.targetType,
    targetId: args.targetId,
    result: args.result,
    immutableRetention: true,
    metadata: args.metadata,
  };
}

export function assertAuditRecordIsAppendOnly(previous?: EchoAuditRecord, next?: EchoAuditRecord): true {
  if (previous && next && previous.auditId === next.auditId) {
    throw new Error('ECHO audit records are immutable. Create a reversal record instead of mutating the original.');
  }
  return true;
}
