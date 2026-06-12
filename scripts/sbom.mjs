/**
 * Generate a CycloneDX SBOM for the JavaScript dependency tree (Principle V,
 * FR-015). Produces sbom/markdit-sbom.json. Requires devDependency
 * @cyclonedx/cyclonedx-npm (invoked via npx).
 */
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'sbom');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'markdit-sbom.json');

const result = spawnSync(
  'npx',
  ['--yes', '@cyclonedx/cyclonedx-npm', '--output-format', 'JSON', '--output-file', outFile],
  { stdio: 'inherit', shell: process.platform === 'win32', cwd: root },
);

if (result.status !== 0) {
  console.error('SBOM generation failed.');
  process.exit(result.status ?? 1);
}
console.log(`SBOM written to ${outFile}`);
