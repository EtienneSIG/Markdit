import { describe, it, expect } from 'vitest';
import { FORMATTING_ACTIONS, FORMATTING_ACTION_LIST } from '../../src/components/toolbar/actions';
import { parse } from '../../src/markdown/parse';
import { serialize } from '../../src/markdown/serialize';

describe('Formatting action catalog (FR-004, Principle II)', () => {
  it('exposes every advertised action as portable', () => {
    expect(FORMATTING_ACTION_LIST.length).toBeGreaterThanOrEqual(13);
    for (const action of FORMATTING_ACTION_LIST) {
      expect(action.isPortable).toBe(true);
      expect(action.markdownMapping.length).toBeGreaterThan(0);
    }
  });

  it('each mapping round-trips through the engine to a standard construct', () => {
    for (const action of FORMATTING_ACTION_LIST) {
      const sample = action.markdownMapping.replace(/text|code|item|url|Heading|quote|lang/g, 'X');
      const out = serialize(parse(sample));
      // Must serialize to non-empty, deterministic standard Markdown.
      expect(out.trim().length).toBeGreaterThan(0);
      expect(serialize(parse(out))).toBe(out);
    }
  });

  it('bold maps to ** and italic to * (deterministic markers)', () => {
    expect(FORMATTING_ACTIONS.bold.markdownMapping).toContain('**');
    expect(serialize(parse('**X**'))).toBe('**X**\n');
    expect(serialize(parse('*X*'))).toBe('*X*\n');
  });
});
