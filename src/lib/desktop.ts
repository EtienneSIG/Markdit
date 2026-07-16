/**
 * Thin bridge to the Tauri desktop shell for the few operations the browser
 * File System Access API cannot do — namely reading/writing a file given an
 * absolute OS path. This is used for Windows file associations ("Open with
 * Markdit" / double-click a `.md`), where the OS hands us a native path rather
 * than a `FileSystemFileHandle`.
 *
 * It talks to the always-present `__TAURI_INTERNALS__.invoke` (available in the
 * WebView2 shell regardless of `withGlobalTauri`) and only ever calls the app's
 * own custom commands, which are not subject to the capability ACL. In the plain
 * web build the shell is absent and every entry point degrades to a no-op.
 * Nothing leaves the device (Principle III).
 */

type InvokeFn = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

interface TauriInternals {
  invoke?: InvokeFn;
}

function internals(): TauriInternals | null {
  return (globalThis as { __TAURI_INTERNALS__?: TauriInternals }).__TAURI_INTERNALS__ ?? null;
}

/** True when running inside the Tauri desktop shell (WebView2). */
export function isDesktopShell(): boolean {
  return typeof internals()?.invoke === 'function';
}

async function invokeInternal<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const inv = internals()?.invoke;
  if (!inv) throw new Error('Desktop shell unavailable');
  return (await inv(cmd, args ?? {})) as T;
}

export interface OpenedDocument {
  path: string;
  fileName: string;
  markdown: string;
  sizeBytes: number;
  contentHash: string;
}

/** Read a Markdown file from an absolute OS path via the desktop core. */
export async function readFileByPath(path: string): Promise<OpenedDocument> {
  return invokeInternal<OpenedDocument>('document_open', { path });
}

/** Write Markdown back to an absolute OS path. Returns false on failure. */
export async function writeFileByPath(path: string, markdown: string): Promise<boolean> {
  try {
    await invokeInternal('document_save', { path, markdown, expectedDiskHash: '' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Path of a Markdown file passed on the command line (file association), or null
 * on first launch with no file / in the web build. Read once on startup.
 */
export async function getStartupFile(): Promise<string | null> {
  if (!isDesktopShell()) return null;
  try {
    return (await invokeInternal<string | null>('document_startup_file')) ?? null;
  } catch {
    return null;
  }
}

interface OpenFileWindow {
  __markditOpenFile?: (path: string) => void;
  __markditPendingOpen?: string[];
}

/**
 * Register the handler the desktop core calls (via `eval`) when a second launch
 * routes a file into this already-running window. Also drains any paths that
 * were queued before the handler was installed. Returns an unregister function.
 */
export function registerOpenFileHandler(handler: (path: string) => void): () => void {
  const w = window as unknown as OpenFileWindow;
  w.__markditOpenFile = handler;
  const pending = w.__markditPendingOpen;
  if (Array.isArray(pending) && pending.length > 0) {
    w.__markditPendingOpen = [];
    for (const path of pending) handler(path);
  }
  return () => {
    if (w.__markditOpenFile === handler) delete w.__markditOpenFile;
  };
}
