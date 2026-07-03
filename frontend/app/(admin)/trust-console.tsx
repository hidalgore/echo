/**
 * app/(admin)/trust-console.tsx — INTERNAL Admin Trust Console.
 * Gate behind ECHO admin auth before shipping. Demo data via securityCenterService.
 */
import React from 'react';
import AdminTrustConsole from '../../components/admin/AdminTrustConsole';
import { mockAdminQueues } from '../../services/securityCenterService';
import { buildRiskDecision } from '../../services/botRiskService';

export default function AdminTrustConsoleRoute() {
  const riskFeed = [
    buildRiskDecision({ subjectType: 'checkout', subjectId: 'dev42:evt9', score: 90, reasons: ['multi_account_device', 'over_device_limit'], action: 'block' }),
    buildRiskDecision({ subjectType: 'user', subjectId: 'u_1182', score: 58, reasons: ['high_request_speed'], action: 'challenge' }),
    buildRiskDecision({ subjectType: 'scanner', subjectId: 'door_3', score: 22, reasons: [], action: 'allow' }),
  ];
  return <AdminTrustConsole queues={mockAdminQueues()} riskFeed={riskFeed} />;
}
