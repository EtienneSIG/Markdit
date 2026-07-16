/**
 * Update check against the public GitHub Releases API. This is a lightweight
 * version comparison — it only reads the latest published tag and never sends
 * anything about the user or their documents (Principle III). It runs only in
 * the desktop shell; the web preview has no install mechanism and reports no
 * update. Getting the update itself is a manual download from the releases page
 * (opened in the system browser), so no code-signing trust anchor is required.
 */

import { isDesktopShell } from './desktop';

/** GitHub `owner/repo` that hosts Markdit releases. */
const REPO = 'EtienneSIG/Markdit';

export interface UpdateInfo {
  available: boolean;
  /** Latest published version (without a leading "v"). */
  version?: string;
  /** URL of the release page to download from. */
  url?: string;
}

/** Compare dotted numeric versions. Returns >0 when `a` is newer than `b`. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/**
 * Look up the latest release. Returns null when there's no desktop shell, the
 * network is unreachable, or GitHub rate-limits the request — the caller then
 * reports the check as unavailable.
 */
export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo | null> {
  if (!isDesktopShell()) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: string; html_url?: string };
    const latest = (data.tag_name ?? '').replace(/^v/i, '').trim();
    if (!latest) return null;
    return {
      available: compareVersions(latest, currentVersion) > 0,
      version: latest,
      url: data.html_url ?? `https://github.com/${REPO}/releases/latest`,
    };
  } catch {
    return null;
  }
}
