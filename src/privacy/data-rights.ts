/**
 * Data-subject rights (FR-012): export and deletion of personal data to satisfy
 * GDPR and CCPA/CPRA. Document content is NOT personal data held by the app
 * (it stays in the user's own files), so it is explicitly excluded from export.
 */
import type { PrivacySettings } from '../lib/types';
import { DEFAULT_PRIVACY_SETTINGS } from '../lib/types';
import { settingsGet, settingsSet } from '../lib/ipc';
import { logger } from '../lib/logging';

export interface PersonalDataExport {
  exportedAt: string;
  settings: PrivacySettings;
  note: string;
}

/**
 * Export the personal data the app holds (its settings/consent profile).
 * Excludes document content, which is never collected by Markdit.
 */
export async function exportPersonalData(): Promise<PersonalDataExport | null> {
  const current = await settingsGet();
  if (!current.ok) return null;
  logger.info('data-rights.export');
  return {
    exportedAt: new Date().toISOString(),
    settings: current.value,
    note: 'Document content is stored only in your local files and is not collected by Markdit.',
  };
}

/**
 * Delete personal data: reset settings to the default-local profile and clear
 * any signed-in account / consents (the caller also clears the MSAL token cache).
 */
export async function deletePersonalData(): Promise<PrivacySettings | null> {
  const reset = await settingsSet({ ...DEFAULT_PRIVACY_SETTINGS });
  logger.info('data-rights.delete');
  return reset.ok ? reset.value : null;
}
