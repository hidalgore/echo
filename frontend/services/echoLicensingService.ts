/**
 * ECHO Licensing Service
 * ══════════════════════
 * Locked subscription packaging for host licensing and hardware entitlement.
 */

import type { EchoLicenseFeatureId, EchoLicenseTier, EchoLicenseTierId } from '../types/v3';
import { ECHO_LICENSE_TIERS } from '../types/v3';

export function getEchoLicenseTier(tierId: EchoLicenseTierId): EchoLicenseTier {
  return ECHO_LICENSE_TIERS[tierId];
}

export function licenseIncludesFeature(tierId: EchoLicenseTierId, featureId: EchoLicenseFeatureId): boolean {
  return ECHO_LICENSE_TIERS[tierId].featureIds.includes(featureId);
}

export function getUpgradeTargetForFeature(featureId: EchoLicenseFeatureId): EchoLicenseTier | null {
  const ordered: EchoLicenseTierId[] = ['launch', 'pro', 'elite'];
  const tierId = ordered.find((id) => ECHO_LICENSE_TIERS[id].featureIds.includes(featureId));
  return tierId ? ECHO_LICENSE_TIERS[tierId] : null;
}

export function buildLicenseSummary(tierId: EchoLicenseTierId): string {
  const tier = ECHO_LICENSE_TIERS[tierId];
  const hardware = tier.includedHardware.includes('disc_core') ? 'Includes ECHO Disc Core' : 'Hardware not included';
  return `${tier.name} — $${tier.monthlyPriceUsd}/mo. ${hardware}. ${tier.positioning}`;
}
