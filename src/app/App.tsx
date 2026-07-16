import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Reader } from '../components/reader/Reader';
import { RenderNotice } from '../components/reader/RenderNotice';
import { UpdateBanner } from '../components/reader/UpdateBanner';
import { ConflictDialog } from '../components/dialogs/ConflictDialog';
import {
  FileExplorer,
  type SelectedFile,
  type FileExplorerHandle,
} from '../components/sidebar/FileExplorer';
import { FileMenu } from '../components/toolbar/FileMenu';
import { StatusBar } from '../components/statusbar/StatusBar';
import {
  documentOpen,
  documentSaveAs,
  documentWatch,
  documentUnwatch,
  onDocumentChanged,
  isTauriAvailable,
  settingsGet,
  settingsSet,
} from '../lib/ipc';
import {
  getStartupFile,
  registerOpenFileHandler,
  readFileByPath,
  writeFileByPath,
  isDesktopShell,
} from '../lib/desktop';
import { addRecent, type RecentItem } from '../lib/recent';
import { resolveViaDirHandle, resolveViaPath } from '../lib/image';
import { DEFAULT_PRIVACY_SETTINGS, type PrivacySettings } from '../lib/types';
import { copyMarkdownAsRichText } from '../lib/clipboard';
import { writeFileHandle } from '../lib/folder-handle';
import { applyTheme } from './theme';
import { setLocale, getLocale, t } from '../lib/i18n';
import { configureTelemetry } from '../privacy/telemetry';

// Heavy views are code-split so first paint (the read view) stays fast: TipTap
// (the WYSIWYG editor) and Marp (the slide generator) only load on demand.
const Editor = lazy(() =>
  import('../components/editor/Editor').then((m) => ({ default: m.Editor })),
);
const SlidesDialog = lazy(() =>
  import('../components/dialogs/SlidesDialog').then((m) => ({ default: m.SlidesDialog })),
);

type ViewMode = 'read' | 'edit';

/** Delay after the last keystroke before auto-save writes to disk. */
const AUTOSAVE_DELAY_MS = 1000;
/** localStorage key remembering the auto-save preference across sessions. */
const AUTOSAVE_KEY = 'markdit.autosave';

const SAMPLE = `# Welcome to Markdit\n\nOpen a \`.md\` file or start typing.\n\n- Renders like on Git\n- **Bold**, *italic*, \`code\`\n- Tables, task lists and more (GFM)\n`;

export function App(): JSX.Element {
  const [markdown, setMarkdown] = useState<string>(SAMPLE);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileDir, setFileDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [view, setView] = useState<ViewMode>('read');
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [slidesOpen, setSlidesOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [locale, setLocaleState] = useState<string>('en');

  // Tracks unsaved edits so auto-save only writes after a genuine change and
  // never fires spuriously when a file is (re)opened.
  const [dirty, setDirty] = useState(false);
  const [autosave, setAutosave] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTOSAVE_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'failed'>('idle');
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);

  // Load persisted settings (privacy profile) on startup.
  useEffect(() => {
    (async () => {
      const res = await settingsGet();
      const next = res.ok ? res.value : DEFAULT_PRIVACY_SETTINGS;
      setSettings(next);
      applyTheme(next.theme);
      setLocale(next.locale);
      setLocaleState(getLocale());
      document.documentElement.lang = getLocale();
      configureTelemetry(next);
    })();
  }, []);

  const blockedCount = settings.allowRemoteContent
    ? 0
    : (markdown.match(/!\[[^\]]*\]\(https?:\/\//g) ?? []).length;

  // Watch the open file for external changes and prompt before clobbering edits
  // (FR-007). Only active under the desktop runtime; a no-op in the web build.
  useEffect(() => {
    if (!filePath || !isTauriAvailable()) return;
    let unlisten: (() => void) | undefined;
    void documentWatch(filePath);
    void onDocumentChanged((e) => {
      if (e.path === filePath) setConflictOpen(true);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
      void documentUnwatch(filePath);
    };
  }, [filePath]);

  const handleReloadFromDisk = useCallback(async () => {
    setConflictOpen(false);
    if (!filePath) return;
    const res = await documentOpen(filePath);
    if (res.ok) {
      setMarkdown(res.value.markdown);
      setDirty(false);
    }
  }, [filePath]);

  const handleSave = useCallback(async () => {
    // Prefer saving in place to the file opened from the sidebar (File System
    // Access API). Fall back to the desktop Save As dialog when no handle is
    // available (e.g. a freshly typed, never-saved document).
    if (fileHandle) {
      setSaveStatus('saving');
      try {
        const ok = await writeFileHandle(fileHandle, markdown);
        setSaveStatus(ok ? 'saved' : 'failed');
        if (ok) setDirty(false);
      } catch {
        setSaveStatus('failed');
      }
      window.setTimeout(() => setSaveStatus('idle'), 2500);
      return;
    }
    // A file opened by absolute path (file association) has no browser handle;
    // write it back in place through the desktop core.
    if (filePath && isDesktopShell()) {
      setSaveStatus('saving');
      const ok = await writeFileByPath(filePath, markdown);
      setSaveStatus(ok ? 'saved' : 'failed');
      if (ok) setDirty(false);
      window.setTimeout(() => setSaveStatus('idle'), 2500);
      return;
    }
    const res = await documentSaveAs(markdown);
    if (res.ok) {
      setFilePath(res.value.path);
      setSaveStatus('saved');
      setDirty(false);
    } else {
      setSaveStatus('failed');
    }
    window.setTimeout(() => setSaveStatus('idle'), 2500);
  }, [markdown, fileHandle, filePath]);

  const handleOpenFromSidebar = useCallback((file: SelectedFile) => {
    setMarkdown(file.markdown);
    setFilePath(file.path);
    setFileHandle(file.handle ?? null);
    setFileDir(file.dirHandle ?? null);
    setDirty(false);
    setView('read');
  }, []);

  // Imperative access to the sidebar so the File menu can open files/folders and
  // reopen recent items even while the sidebar is collapsed.
  const fileExplorerRef = useRef<FileExplorerHandle>(null);

  /**
   * Open a Markdown file by absolute OS path (Windows file association /
   * "Open with Markdit"). Reads through the desktop core; a no-op in the web
   * build. The document is loaded without a browser handle — saving falls back
   * to writing the same path (see handleSave).
   */
  const openByPath = useCallback(async (path: string) => {
    if (!isDesktopShell()) return;
    try {
      const doc = await readFileByPath(path);
      setMarkdown(doc.markdown);
      setFilePath(doc.path);
      setFileHandle(null);
      setFileDir(null);
      setDirty(false);
      setView('read');
      void addRecent({ name: doc.fileName, kind: 'file', path: doc.path });
    } catch {
      /* File missing or unreadable — leave the current document in place. */
    }
  }, []);

  // On startup, open a file passed on the command line (file association). The
  // last folder is deliberately never reopened here (handled in FileExplorer).
  useEffect(() => {
    void (async () => {
      const path = await getStartupFile();
      if (path) void openByPath(path);
    })();
  }, [openByPath]);

  // Route files opened while Markdit is already running (a second launch is
  // funnelled to this window by the single-instance guard) into the editor.
  useEffect(() => registerOpenFileHandler((path) => void openByPath(path)), [openByPath]);

  // File menu actions. Opening anything also reveals the sidebar so the result
  // is visible.
  const handleMenuOpenFile = useCallback(() => {
    setSidebarCollapsed(false);
    fileExplorerRef.current?.openFiles();
  }, []);
  const handleMenuOpenFolder = useCallback(() => {
    setSidebarCollapsed(false);
    fileExplorerRef.current?.openFolder();
  }, []);
  const handleMenuOpenRecent = useCallback((item: RecentItem) => {
    setSidebarCollapsed(false);
    void fileExplorerRef.current?.openRecent(item);
  }, []);

  // Resolve local images (referenced by relative/absolute path) on-device: from
  // the opened folder's directory handle in the browser, or via the desktop core
  // for a file opened by native path. Loose files with no folder context skip
  // resolution. Nothing leaves the device (Principle III).
  const canResolveImages = fileDir !== null || (filePath !== null && isDesktopShell());
  const resolveImage = useCallback(
    (src: string): Promise<string | null> => {
      if (fileDir) return resolveViaDirHandle(fileDir, src);
      if (filePath && isDesktopShell()) return resolveViaPath(filePath, src);
      return Promise.resolve(null);
    },
    [fileDir, filePath],
  );

  // Editing marks the document dirty so auto-save can pick it up. TipTap only
  // calls onChange for genuine user edits (external re-syncs don't emit), so
  // this never fires on open/reload.
  const handleMarkdownChange = useCallback((next: string) => {
    setMarkdown(next);
    setDirty(true);
  }, []);

  // Ctrl/Cmd+S saves the current document to disk (FR-006).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  const handleCopy = useCallback(async () => {
    const ok = await copyMarkdownAsRichText(markdown);
    setCopyStatus(ok ? 'copied' : 'failed');
    window.setTimeout(() => setCopyStatus('idle'), 2500);
  }, [markdown]);

  const fileLabel = filePath ? filePath.split(/[\\/]/).pop()! : 'Untitled.md';

  // Download the current document as a `.md` file (works in both the desktop
  // webview and the browser build).
  const downloadMarkdown = useCallback((): string => {
    const filename = /\.(md|markdown|mdown|mkd)$/i.test(fileLabel) ? fileLabel : `${fileLabel}.md`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return filename;
  }, [markdown, fileLabel]);

  const handleDownload = useCallback(() => {
    setShareMenuOpen(false);
    downloadMarkdown();
  }, [downloadMarkdown]);

  // Share by email. Attachments can't be set from a `mailto:` URL, so the
  // Markdown is first downloaded (so the user can attach it), then the OS
  // default mail client opens pre-filled — compatible with every client
  // (Outlook, Thunderbird, Apple Mail, web handlers, …).
  const handleShareEmail = useCallback(() => {
    setShareMenuOpen(false);
    try {
      const filename = downloadMarkdown();
      const subject = filename.replace(/\.(md|markdown|mdown|mkd)$/i, '');
      const body = t('share.mailBody', { name: filename });
      setShareStatus('sharing');
      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const a = document.createElement('a');
      a.href = mailto;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => setShareStatus('idle'), 2500);
    } catch {
      setShareStatus('failed');
      window.setTimeout(() => setShareStatus('idle'), 2500);
    }
  }, [downloadMarkdown]);

  // Close the share menu on outside click or Escape.
  useEffect(() => {
    if (!shareMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShareMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [shareMenuOpen]);

  // Persist the auto-save preference across sessions (on-device only).
  useEffect(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, autosave ? '1' : '0');
    } catch {
      /* ignore quota/private-mode errors */
    }
  }, [autosave]);

  // Auto-save: while editing, write to disk shortly after the user stops
  // typing. Gated on an in-place target (a browser handle, or a native path
  // opened via file association) so it never pops a Save As dialog, and on
  // `dirty` so (re)opening a file never triggers a spurious write.
  useEffect(() => {
    if (!autosave) return;
    if (view !== 'edit') return;
    if (!dirty) return;
    if (!fileHandle && !(filePath && isDesktopShell())) return;
    const id = window.setTimeout(() => {
      void handleSave();
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [autosave, view, dirty, markdown, fileHandle, filePath, handleSave]);

  const enableRemote = useCallback(async () => {
    const res = await settingsSet({ allowRemoteContent: true });
    if (res.ok) setSettings(res.value);
    else setSettings((s) => ({ ...s, allowRemoteContent: true }));
  }, []);

  // Toggle the UI language between English and French (FR-016). The choice is
  // persisted to the on-device privacy profile; nothing is sent off the device.
  const toggleLocale = useCallback(async () => {
    const nextLocale = getLocale() === 'fr' ? 'en' : 'fr';
    setLocale(nextLocale);
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    const res = await settingsSet({ locale: nextLocale });
    if (res.ok) setSettings(res.value);
    else setSettings((s) => ({ ...s, locale: nextLocale }));
  }, []);

  return (
    <div className="markdit-app">
      <header className="markdit-topbar">
        <div className="markdit-topbar-left">
          <button
            type="button"
            className="markdit-burger"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={t('sidebar.toggle')}
            aria-pressed={!sidebarCollapsed}
            title={t('sidebar.toggle')}
          >
            <svg
              className="markdit-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <span className="markdit-brand">
            <span className="markdit-brand-mark" aria-hidden="true">
              M
            </span>
            {t('app.title')}
          </span>
          <span className="markdit-breadcrumb-sep" aria-hidden="true">
            ›
          </span>
          <span className="markdit-filename" title={filePath ?? fileLabel}>
            {fileLabel}
          </span>
        </div>

        <div className="markdit-topbar-center">
          <div className="markdit-segmented" role="group" aria-label={t('view.mode')}>
            <button type="button" onClick={() => setView('read')} aria-pressed={view === 'read'}>
              {t('view.read')}
            </button>
            <button type="button" onClick={() => setView('edit')} aria-pressed={view === 'edit'}>
              {t('view.edit')}
            </button>
          </div>
        </div>

        <nav className="markdit-topbar-right markdit-actions" aria-label={t('app.title')}>
          <button
            type="button"
            className="markdit-lang-toggle"
            onClick={toggleLocale}
            aria-label={t('lang.switchTo')}
            title={t('lang.switchTo')}
          >
            <svg
              className="markdit-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
            </svg>
            <span className="markdit-lang-code">{locale === 'fr' ? 'FR' : 'EN'}</span>
          </button>
          <FileMenu
            onOpenFile={handleMenuOpenFile}
            onOpenFolder={handleMenuOpenFolder}
            onOpenRecent={handleMenuOpenRecent}
          />
          {(fileHandle !== null || (filePath !== null && isDesktopShell()) || isTauriAvailable()) && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              title={t('action.save')}
            >
              <svg
                className="markdit-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                {saveStatus === 'saved' ? (
                  <path d="m5 13 4 4L19 7" />
                ) : (
                  <>
                    <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
                    <path d="M8 4v5h7V4M8 21v-7h8v7" />
                  </>
                )}
              </svg>
              {saveStatus === 'saving'
                ? t('action.saving')
                : saveStatus === 'saved'
                  ? t('action.saved')
                  : saveStatus === 'failed'
                    ? t('action.saveFailed')
                    : t('action.save')}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            title={t('action.copy')}
            aria-label={
              copyStatus === 'copied'
                ? t('action.copied')
                : copyStatus === 'failed'
                  ? t('action.copyFailed')
                  : t('action.copy')
            }
          >
            <svg
              className="markdit-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              {copyStatus === 'copied' ? (
                <path d="m5 13 4 4L19 7" />
              ) : (
                <>
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </>
              )}
            </svg>
            {copyStatus === 'copied' ? t('action.copied') : t('action.copy')}
          </button>
          {(fileHandle !== null || isTauriAvailable()) && (
            <button
              type="button"
              className={autosave ? 'is-active' : undefined}
              onClick={() => setAutosave((v) => !v)}
              aria-pressed={autosave}
              title={autosave ? t('action.autosaveOn') : t('action.autosaveOff')}
            >
              <svg
                className="markdit-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 4v5h-5" />
              </svg>
              {t('action.autosave')}
            </button>
          )}
          <div className="markdit-share" ref={shareMenuRef}>
            <button
              type="button"
              className="markdit-share-toggle"
              onClick={() => setShareMenuOpen((v) => !v)}
              disabled={shareStatus === 'sharing'}
              aria-haspopup="menu"
              aria-expanded={shareMenuOpen}
              title={t('share.title')}
            >
              <svg
                className="markdit-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
              </svg>
              {shareStatus === 'sharing'
                ? t('share.opening')
                : shareStatus === 'failed'
                  ? t('share.failed')
                  : t('share.title')}
              <svg
                className="markdit-icon markdit-share-caret"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {shareMenuOpen && (
              <div className="markdit-share-menu" role="menu">
                <button type="button" role="menuitem" onClick={handleShareEmail}>
                  <svg
                    className="markdit-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  {t('share.email')}
                </button>
                <button type="button" role="menuitem" onClick={handleDownload}>
                  <svg
                    className="markdit-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                  {t('share.download')}
                </button>
              </div>
            )}
          </div>
          <button type="button" className="is-primary" onClick={() => setSlidesOpen(true)}>
            <svg
              className="markdit-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <rect x="3" y="4" width="18" height="12" rx="1" />
              <path d="M12 16v4" />
              <path d="M8 20h8" />
            </svg>
            {t('action.slides')}
          </button>
        </nav>
      </header>

      <UpdateBanner />
      <RenderNotice blockedCount={blockedCount} onEnableRemote={enableRemote} />

      <div className="markdit-body">
        <FileExplorer
          ref={fileExplorerRef}
          activePath={filePath}
          onOpenFile={handleOpenFromSidebar}
          collapsed={sidebarCollapsed}
        />

        <main className="markdit-main">
          {view === 'read' ? (
            <Reader
              markdown={markdown}
              allowRemoteContent={settings.allowRemoteContent}
              theme={settings.theme}
              resolveImage={canResolveImages ? resolveImage : undefined}
            />
          ) : (
            <Suspense fallback={null}>
              <Editor markdown={markdown} onChange={handleMarkdownChange} />
            </Suspense>
          )}
        </main>
      </div>

      {slidesOpen && (
        <Suspense fallback={null}>
          <SlidesDialog
            open={slidesOpen}
            markdown={markdown}
            fileName={fileLabel}
            onClose={() => setSlidesOpen(false)}
          />
        </Suspense>
      )}

      <ConflictDialog
        open={conflictOpen}
        fileName={fileLabel}
        onReload={handleReloadFromDisk}
        onKeep={() => setConflictOpen(false)}
      />

      <StatusBar localeTag={locale} />
    </div>
  );
}
