import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExportResult, PrivacySettings } from '../../src/lib/types';
import { DEFAULT_PRIVACY_SETTINGS } from '../../src/lib/types';

// Mock the Graph-backed exporters so the test never touches the network. If
// these are invoked when consent is missing, the consent-gate assertion fails.
const exportToOneNote = vi.fn<(md: string, title: string) => Promise<ExportResult>>();
const exportToLoop = vi.fn<(md: string, name: string) => Promise<ExportResult>>();

vi.mock('../../src/export/graph/onenote', () => ({
  exportToOneNote: (md: string, title: string) => exportToOneNote(md, title),
}));
vi.mock('../../src/export/graph/loop', () => ({
  exportToLoop: (md: string, name: string) => exportToLoop(md, name),
}));
// Telemetry must never make a request in tests; stub it out.
vi.mock('../../src/privacy/telemetry', () => ({ track: vi.fn() }));

// Fail the whole test run if any code attempts a real network fetch.
const fetchSpy = vi.fn(() => {
  throw new Error('Network access is forbidden in cloud-export unit tests');
});
vi.stubGlobal('fetch', fetchSpy);

import { exportCloud, canExportToCloud } from '../../src/export/exporter';

function settingsWithConsent(target: 'onenote' | 'loop'): PrivacySettings {
  return {
    ...DEFAULT_PRIVACY_SETTINGS,
    cloudExportConsents: {
      [target]: { granted: true, grantedAt: new Date().toISOString(), scopes: ['Notes.Create'] },
    },
  };
}

describe('Cloud export consent gate (T056, FR-010/FR-011, SC-006/SC-008)', () => {
  beforeEach(() => {
    exportToOneNote.mockReset();
    exportToLoop.mockReset();
    fetchSpy.mockClear();
  });

  it('returns "cancelled" and performs zero network calls when consent is missing', async () => {
    const settings = DEFAULT_PRIVACY_SETTINGS; // no consents granted
    expect(canExportToCloud(settings, 'onenote')).toBe(false);

    const res = await exportCloud('onenote', '# Hi\n', 'note.md', settings);

    expect(res.status).toBe('cancelled');
    expect(res.outputLocation).toBeNull();
    expect(exportToOneNote).not.toHaveBeenCalled();
    expect(exportToLoop).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns "success" via mocked Graph when OneNote consent is granted', async () => {
    const settings = settingsWithConsent('onenote');
    exportToOneNote.mockResolvedValue({
      target: 'onenote',
      status: 'success',
      outputLocation: 'https://onenote.example/page',
      droppedElements: [],
      message: 'ok',
    });

    const res = await exportCloud('onenote', '# Hi\n', 'note.md', settings);

    expect(canExportToCloud(settings, 'onenote')).toBe(true);
    expect(exportToOneNote).toHaveBeenCalledOnce();
    expect(res.status).toBe('success');
    expect(res.outputLocation).toBe('https://onenote.example/page');
  });

  it('returns "partial" with droppedElements when the target cannot represent everything', async () => {
    const settings = settingsWithConsent('loop');
    exportToLoop.mockResolvedValue({
      target: 'loop',
      status: 'partial',
      outputLocation: 'https://loop.example/doc',
      droppedElements: ['table', 'code'],
      message: 'partial',
    });

    const res = await exportCloud('loop', '| a | b |\n| - | - |\n', 'doc.md', settings);

    expect(exportToLoop).toHaveBeenCalledOnce();
    expect(res.status).toBe('partial');
    expect(res.droppedElements).toEqual(expect.arrayContaining(['table', 'code']));
  });
});
