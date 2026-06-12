import { describe, it, expect } from 'vitest';
import { parse } from '../../src/markdown/parse';
import { exportToDocx } from '../../src/export/docx';

describe('Offline Word export (US4, FR-009)', () => {
  it('produces a non-empty .docx (ZIP/OOXML) buffer', async () => {
    const md = '# Title\n\nA paragraph with **bold** text.\n\n- item one\n- item two\n';
    const { bytes } = await exportToDocx(parse(md));
    expect(bytes.byteLength).toBeGreaterThan(0);
    // .docx is a ZIP archive — must start with the PK signature.
    expect(bytes[0]).toBe(0x50); // 'P'
    expect(bytes[1]).toBe(0x4b); // 'K'
  });

  it('reports unsupported elements as dropped instead of failing', async () => {
    const md = '| a | b |\n| - | - |\n| 1 | 2 |\n';
    const { droppedElements } = await exportToDocx(parse(md));
    expect(droppedElements).toContain('table');
  });
});
