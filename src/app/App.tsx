import { useCallback, useEffect, useState } from 'react';
import { Reader } from '../components/reader/Reader';
import { RenderNotice } from '../components/reader/RenderNotice';
import { Editor } from '../components/editor/Editor';
import { ExportDialog } from '../components/dialogs/ExportDialog';
import { ConflictDialog } from '../components/dialogs/ConflictDialog';
import { FileExplorer, type SelectedFile } from '../components/sidebar/FileExplorer';
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
import { DEFAULT_PRIVACY_SETTINGS, type PrivacySettings } from '../lib/types';
import { applyTheme } from './theme';
import { setLocale, t } from '../lib/i18n';
import { configureTelemetry } from '../privacy/telemetry';

type ViewMode = 'read' | 'edit';

const SAMPLE = `# Welcome to Markdit\n\nOpen a \`.md\` file or start typing.\n\n- Renders like on Git\n- **Bold**, *italic*, \`code\`\n- Tables, task lists and more (GFM)\n`;

export function App(): JSX.Element {
  const [markdown, setMarkdown] = useState<string>(SAMPLE);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('read');
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [exportOpen, setExportOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load persisted settings (privacy profile) on startup.
  useEffect(() => {
    (async () => {
      const res = await settingsGet();
      const next = res.ok ? res.value : DEFAULT_PRIVACY_SETTINGS;
      setSettings(next);
      applyTheme(next.theme);
      setLocale(next.locale);
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
    if (res.ok) setMarkdown(res.value.markdown);
  }, [filePath]);

  const handleOpen = useCallback(async () => {
    const res = await documentOpen();
    if (res.ok) {
      setMarkdown(res.value.markdown);
      setFilePath(res.value.path);
    }
  }, []);

  const handleSave = useCallback(async () => {
    const res = await documentSaveAs(markdown);
    if (res.ok) setFilePath(res.value.path);
  }, [markdown]);

  const handleOpenFromSidebar = useCallback((file: SelectedFile) => {
    setMarkdown(file.markdown);
    setFilePath(file.path);
    setView('read');
  }, []);

  const enableRemote = useCallback(async () => {
    const res = await settingsSet({ allowRemoteContent: true });
    if (res.ok) setSettings(res.value);
    else setSettings((s) => ({ ...s, allowRemoteContent: true }));
  }, []);

  const fileLabel = filePath ? filePath.split(/[\\/]/).pop()! : 'Untitled.md';

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
          {isTauriAvailable() && (
            <>
              <button type="button" onClick={handleOpen}>
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
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                {t('action.open')}
              </button>
              <button type="button" onClick={handleSave}>
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
                  <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
                  <path d="M8 4v5h7V4M8 21v-7h8v7" />
                </svg>
                {t('action.save')}
              </button>
            </>
          )}
          <button type="button" className="is-primary" onClick={() => setExportOpen(true)}>
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
              <path d="m7 8 5-5 5 5" />
              <path d="M5 21h14" />
            </svg>
            {t('action.export')}
          </button>
        </nav>
      </header>

      <RenderNotice blockedCount={blockedCount} onEnableRemote={enableRemote} />

      <div className="markdit-body">
        {!sidebarCollapsed && (
          <FileExplorer activePath={filePath} onOpenFile={handleOpenFromSidebar} />
        )}

        <main className="markdit-main">
          {view === 'read' ? (
            <Reader
              markdown={markdown}
              allowRemoteContent={settings.allowRemoteContent}
              theme={settings.theme}
            />
          ) : (
            <Editor markdown={markdown} onChange={setMarkdown} />
          )}
        </main>
      </div>

      <ExportDialog
        open={exportOpen}
        markdown={markdown}
        fileName={fileLabel}
        settings={settings}
        onSettingsChange={setSettings}
        onClose={() => setExportOpen(false)}
      />

      <ConflictDialog
        open={conflictOpen}
        fileName={fileLabel}
        onReload={handleReloadFromDisk}
        onKeep={() => setConflictOpen(false)}
      />
    </div>
  );
}
