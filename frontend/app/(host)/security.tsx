/**
 * app/(host)/security.tsx — Host dashboard → Security.
 * Feed with trustShieldService + securityCenterService (see build notes).
 */
import React from 'react';
import HostSecurityCenter from '../../components/security/HostSecurityCenter';
import { buildHostBotDefenseStatus } from '../../services/trustShieldService';
import { mockStaff, mockTrustedDevices, mockHostAuditLog, defaultPayoutProtection } from '../../services/securityCenterService';

export default function HostSecurityRoute() {
  const botDefense = buildHostBotDefenseStatus({
    suspiciousAttemptsBlocked: 142, checkoutHolds: 3, ticketAbuseRatePct: 3,
    payoutRiskRatePct: 0.5, doorDuplicateAttempts: 0, expectedDemand: 4000, capacity: 1500,
  });
  return (
    <HostSecurityCenter
      botDefense={botDefense}
      staff={mockStaff()}
      devices={mockTrustedDevices()}
      payout={defaultPayoutProtection(true)}
      auditLog={mockHostAuditLog()}
      eventRisk={[{ eventId: 'e1', eventTitle: 'Nightfall Music Festival', risk: 'low', note: 'No abnormal checkout activity.' }]}
    />
  );
}
