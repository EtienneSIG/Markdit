/**
 * Generate (or refresh) the golden expected serialization for every corpus
 * input fixture. Run after intentional engine changes:
 *   node scripts/generate-corpus.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';

const here = dirname(fileURLToPath(import.meta.url));
const inputDir = join(here, '..', 'tests', 'corpus', 'input');
const expectedDir = join(here, '..', 'tests', 'corpus', 'expected');

mkdirSync(expectedDir, { recursive: true });

const parser = unified().use(remarkParse).use(remarkGfm);
// NOTE: keep these options in exact sync with src/markdown/serialize.ts.
const stringifier = unified().use(remarkGfm).use(remarkStringify, {
  bullet: '-',
  emphasis: '*',
  strong: '*',
  fence: '`',
  fences: true,
  listItemIndent: 'one',
  rule: '-',
  tightDefinitions: true,
  resourceLink: false,
});

let count = 0;
for (const file of readdirSync(inputDir).filter((f) => f.endsWith('.md'))) {
  const input = readFileSync(join(inputDir, file), 'utf-8');
  const tree = parser.parse(input);
  const out = stringifier.stringify(tree);
  writeFileSync(join(expectedDir, file), out, 'utf-8');
  count += 1;
}
console.log(`Generated ${count} golden file(s) in ${expectedDir}`);
