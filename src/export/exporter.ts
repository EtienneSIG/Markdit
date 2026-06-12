/**
 * Export orchestration (US4). Selects the export target, applies consent gates
 * for cloud targets, and reports dropped (non-representable) elements so the
 * user is informed before anything leaves the device (Principle II/III/VI).
 */
import type { ExportResult, ExportTarget, PrivacySettings } from '../lib/types';
import { parse } from '../markdown/parse';
import { exportToDocx } from './docx';
import { exportDocx as saveDocxViaCore } from '../lib/ipc';
import { exportToOneNote } from './graph/onenote';
import { exportToLoop } from './graph/loop';
import { hasConsent } from '../privacy/consent';
import { track } from '../privacy/telemetry';

export const EXPORT_TARGETS: ExportTarget[] = [
  {
    id: 'word',
    displayName: 'Microsoft Word (.docx)',
    mode: 'offline',
    requiresAuth: false,
    requiredScopes: [],
    supportedElements: [
      'heading',
      'paragraph',
      'emphasis',
      'strong',
      'strikethrough',
      'list',
      'code',
      'inlineCode',
      'blockquote',
      'link',
      'thematicBreak',
    ],
    unsupportedElements: ['table', 'image', 'taskList'],
  },
  {
    id: 'onenote',
    displayName: 'Microsoft OneNote',
    mode: 'cloud',
    requiresAuth: true,
    requiredScopes: ['Notes.Create'],
    supportedElements: ['heading', 'paragraph', 'emphasis', 'strong', 'list', 'link', 'image'],
    unsupportedElements: ['table', 'code'],
  },
  {
    id: 'loop',
    displayName: 'Microsoft Loop',
    mode: 'cloud',
    requiresAuth: true,
    requiredScopes: ['Files.ReadWrite'],
    supportedElements: ['heading', 'paragraph', 'emphasis', 'strong', 'list', 'link'],
    unsupportedElements: ['table', 'code', 'image'],
  },
];

/** Export the current Markdown to Word (.docx), fully offline. */
export async function exportWord(markdown: string, suggestedName: string): Promise<ExportResult> {
  const { bytes, droppedElements } = await exportToDocx(parse(markdown));
  track({ name: 'export', props: { target: 'word', dropped: droppedElements.length } });
  const saved = await saveDocxViaCore(Array.from(bytes), suggestedName);
  if (!saved.ok) {
    return {
      target: 'word',
      status: saved.error.code === 'CANCELLED' ? 'cancelled' : 'failed',
      outputLocation: null,
      droppedElements,
      message: saved.error.message,
    };
  }
  return {
    target: 'word',
    status: droppedElements.length > 0 ? 'partial' : 'success',
    outputLocation: saved.value.outputPath,
    droppedElements,
    message:
      droppedElements.length > 0
        ? `Exported with ${droppedElements.length} unsupported element(s) omitted.`
        : 'Exported successfully.',
  };
}

/** Guard a cloud export behind recorded consent (FR-011, SC-008). */
export function canExportToCloud(settings: PrivacySettings, target: 'onenote' | 'loop'): boolean {
  return hasConsent(settings, target);
}

/**
 * Export to a consented cloud target (OneNote/Loop). When consent is missing,
 * returns `cancelled` and performs zero network requests (FR-011, SC-008).
 */
export async function exportCloud(
  target: 'onenote' | 'loop',
  markdown: string,
  nameOrTitle: string,
  settings: PrivacySettings,
): Promise<ExportResult> {
  if (!canExportToCloud(settings, target)) {
    return {
      target,
      status: 'cancelled',
      outputLocation: null,
      droppedElements: [],
      message: 'Consent required before exporting to this destination.',
    };
  }
  track({ name: 'export', props: { target } });
  return target === 'onenote'
    ? exportToOneNote(markdown, nameOrTitle)
    : exportToLoop(markdown, nameOrTitle);
}
