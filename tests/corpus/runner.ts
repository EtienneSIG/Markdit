/**
 * Golden-file round-trip corpus harness (T014).
 *
 * Loads CommonMark + GFM fixtures from `tests/corpus/input/` and their expected
 * canonical serialization from `tests/corpus/expected/`. The expected files are
 * the deterministic output of the engine and guard against accidental
 * round-trip regressions (FR-005, SC-003, Principle I).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const INPUT_DIR = join(here, 'input');
export const EXPECTED_DIR = join(here, 'expected');

export interface CorpusCase {
  name: string;
  input: string;
  /** Expected canonical serialization, or null if not yet generated. */
  expected: string | null;
}

export function loadCorpus(): CorpusCase[] {
  if (!existsSync(INPUT_DIR)) return [];
  return readdirSync(INPUT_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const input = readFileSync(join(INPUT_DIR, file), 'utf-8');
      const expectedPath = join(EXPECTED_DIR, file);
      const expected = existsSync(expectedPath) ? readFileSync(expectedPath, 'utf-8') : null;
      return { name: file, input, expected };
    });
}
