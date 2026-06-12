import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * T045 [US3] — The shipped installer must carry a valid Authenticode signature
 * (SC-005, FR-007). Unsigned or tampered installers must be rejected by Windows
 * SmartScreen and by our own verification.
 *
 * This check operates on a *built, signed* installer artifact, which is produced
 * by the release pipeline (`tauri build` + Authenticode signing — see
 * `.github/workflows/release.yml`). It cannot run against the Vite web harness,
 * so it is skipped unless the signed artifact is present (e.g. in CI after the
 * bundle step). Point MARKDIT_INSTALLER at the produced `.msi`/`.exe` to run it.
 */
const installer = process.env.MARKDIT_INSTALLER;
const hasArtifact = !!installer && existsSync(installer);

test.describe('Installer Authenticode signature (T045, SC-005)', () => {
  test.skip(!hasArtifact, 'Signed installer artifact not available (set MARKDIT_INSTALLER).');

  test('the installer is signed with a valid, trusted certificate', () => {
    // Use PowerShell Get-AuthenticodeSignature to validate the signature chain.
    const target = path.resolve(installer!);
    const out = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `(Get-AuthenticodeSignature -FilePath '${target}').Status`,
      ],
      { encoding: 'utf8' },
    ).trim();

    // 'Valid' = signed by a trusted publisher with an intact hash.
    expect(out).toBe('Valid');
  });
});
