import { useCallback, useEffect, useState } from 'react';
import { Reader } from '../components/reader/Reader';
import { RenderNotice } from '../components/reader/RenderNotice';
import { Editor } from '../components/editor/Editor';
import {
  documentOpen,
  documentSaveAs,
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

  const enableRemote = useCallback(async () => {
    const res = await settingsSet({ allowRemoteContent: true });
    if (res.ok) setSettings(res.value);
    else setSettings((s) => ({ ...s, allowRemoteContent: true }));
  }, []);

  return (
    <div className="markdit-app">
      <header className="markdit-titlebar">
        <strong>{t('app.title')}</strong>
        <span className="markdit-filename">{filePath ?? 'Untitled.md'}</span>
        <nav className="markdit-actions">
          <button type="button" onClick={() => setView('read')} aria-pressed={view === 'read'}>
            {t('view.read')}
          </button>
          <button type="button" onClick={() => setView('edit')} aria-pressed={view === 'edit'}>
            {t('view.edit')}
          </button>
          {isTauriAvailable() && (
            <>
              <button type="button" onClick={handleOpen}>
                {t('action.open')}
              </button>
              <button type="button" onClick={handleSave}>
                {t('action.save')}
              </button>
            </>
          )}
        </nav>
      </header>

      <RenderNotice blockedCount={blockedCount} onEnableRemote={enableRemote} />

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
  );
}
