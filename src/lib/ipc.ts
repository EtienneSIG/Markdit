/**
 * Typed IPC bridge to the Rust/Tauri core (contracts/tauri-commands.md).
 *
 * Errors cross the boundary as values (`IpcResult`), never thrown opaquely.
 * The Tauri runtime is detected at call time so the frontend (and unit tests)
 * run in a plain browser/jsdom environment without the desktop shell present.
 */
import type { CommandError, IpcResult, PrivacySettings } from './types';

type InvokeFn = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

interface TauriGlobal {
  core?: { invoke?: InvokeFn };
  invoke?: InvokeFn;
}

function getInvoke(): InvokeFn | null {
  const tauri = (globalThis as { __TAURI__?: TauriGlobal }).__TAURI__;
  return tauri?.core?.invoke ?? tauri?.invoke ?? null;
}

export function isTauriAvailable(): boolean {
  return getInvoke() !== null;
}

function toCommandError(err: unknown): CommandError {
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err &&
    typeof (err as CommandError).message === 'string'
  ) {
    return err as CommandError;
  }
  return { code: 'IO_ERROR', message: String(err) };
}

/** Invoke a core command, returning a typed result instead of throwing. */
export async function invokeCommand<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<IpcResult<T>> {
  const invoke = getInvoke();
  if (!invoke) {
    return {
      ok: false,
      error: { code: 'IO_ERROR', message: 'Desktop runtime unavailable (Tauri not detected).' },
    };
  }
  try {
    const value = (await invoke(cmd, args)) as T;
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: toCommandError(err) };
  }
}

// --- Document commands -----------------------------------------------------

export interface OpenedDocument {
  path: string;
  fileName: string;
  markdown: string;
  sizeBytes: number;
  contentHash: string;
}

export const documentOpen = (path?: string) =>
  invokeCommand<OpenedDocument>('document_open', path ? { path } : {});

export const documentSave = (path: string, markdown: string, expectedDiskHash: string) =>
  invokeCommand<{ contentHash: string }>('document_save', { path, markdown, expectedDiskHash });

export const documentSaveAs = (markdown: string) =>
  invokeCommand<{ path: string; fileName: string; contentHash: string }>('document_save_as', {
    markdown,
  });

export const documentWatch = (path: string) => invokeCommand<void>('document_watch', { path });
export const documentUnwatch = (path: string) => invokeCommand<void>('document_unwatch', { path });

/** Payload of the `document://changed` external-change event. */
export interface DocumentChangedEvent {
  path: string;
  diskHash: string;
}

interface TauriEventApi {
  listen?: (
    event: string,
    handler: (e: { payload: DocumentChangedEvent }) => void,
  ) => Promise<() => void>;
}

/**
 * Subscribe to the core's `document://changed` event (external file change).
 * Returns an unsubscribe function. No-op (returns a noop unsubscribe) when the
 * desktop runtime or its event API is unavailable, so the web build is safe.
 */
export async function onDocumentChanged(
  handler: (e: DocumentChangedEvent) => void,
): Promise<() => void> {
  const tauri = (globalThis as { __TAURI__?: { event?: TauriEventApi } }).__TAURI__;
  const listen = tauri?.event?.listen;
  if (!listen) return () => {};
  return listen('document://changed', (e) => handler(e.payload));
}

// --- Export, settings, updater --------------------------------------------

export const exportDocx = (docxBytes: number[], suggestedName: string) =>
  invokeCommand<{ outputPath: string }>('export_docx', { docxBytes, suggestedName });

export const settingsGet = () => invokeCommand<PrivacySettings>('settings_get');
export const settingsSet = (patch: Partial<PrivacySettings>) =>
  invokeCommand<PrivacySettings>('settings_set', { patch });

export const updaterCheck = () =>
  invokeCommand<{ available: boolean; version?: string }>('updater_check');
export const updaterInstall = () => invokeCommand<void>('updater_install');
