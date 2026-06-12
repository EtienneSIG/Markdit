/**
 * Consent state machine governing remote content and cloud export
 * (Principle III, FR-011, SC-008). No content leaves the device, and no remote
 * resource is fetched, without an explicit, recorded consent.
 */
import type { ConsentRecord, PrivacySettings } from '../lib/types';
import { settingsGet, settingsSet } from '../lib/ipc';
import { logger } from '../lib/logging';

export type CloudTarget = 'onenote' | 'loop';

function nowIso(): string {
  return new Date().toISOString();
}

/** Whether a given cloud target currently has a granted consent. */
export function hasConsent(settings: PrivacySettings, target: CloudTarget): boolean {
  return settings.cloudExportConsents[target]?.granted === true;
}

/** Whether remote content (e.g. remote images) is permitted to load. */
export function allowsRemoteContent(settings: PrivacySettings): boolean {
  return settings.allowRemoteContent === true;
}

/** Grant consent for a cloud export target with explicit scopes. */
export async function grantConsent(
  target: CloudTarget,
  scopes: string[],
): Promise<PrivacySettings | null> {
  const current = await settingsGet();
  if (!current.ok) return null;
  const record: ConsentRecord = { granted: true, grantedAt: nowIso(), scopes };
  const patch: Partial<PrivacySettings> = {
    cloudExportConsents: { ...current.value.cloudExportConsents, [target]: record },
  };
  const updated = await settingsSet(patch);
  logger.info('consent.granted', { target, scopeCount: scopes.length });
  return updated.ok ? updated.value : null;
}

/**
 * Revoke consent for a cloud export target. Clears the related sign-in account
 * so the MSAL token cache is invalidated by the caller (FR-012 / data rights).
 */
export async function revokeConsent(target: CloudTarget): Promise<PrivacySettings | null> {
  const current = await settingsGet();
  if (!current.ok) return null;
  const consents = { ...current.value.cloudExportConsents };
  consents[target] = { granted: false, grantedAt: null, scopes: [] };
  const stillConsented = (Object.keys(consents) as CloudTarget[]).some((t) => consents[t]?.granted);
  const patch: Partial<PrivacySettings> = {
    cloudExportConsents: consents,
    // Drop the cached account if no target remains consented.
    signedInAccount: stillConsented ? current.value.signedInAccount : null,
  };
  const updated = await settingsSet(patch);
  logger.info('consent.revoked', { target });
  return updated.ok ? updated.value : null;
}
