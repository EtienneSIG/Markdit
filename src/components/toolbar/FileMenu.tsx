import { useCallback, useEffect, useRef, useState } from 'react';
import { loadRecent, clearRecent, type RecentItem } from '../../lib/recent';
import { t } from '../../lib/i18n';

export interface FileMenuProps {
  /** Pick a single Markdown file to open. */
  onOpenFile: () => void;
  /** Pick a folder to browse in the sidebar. */
  onOpenFolder: () => void;
  /** Reopen a previously opened file or folder. */
  onOpenRecent: (item: RecentItem) => void;
}

/**
 * Top-bar "File" menu: open a file, open a folder, and reopen any of the ten
 * most recently opened items (files or folders). The recent list is read from
 * on-device storage each time the menu opens; nothing leaves the device
 * (Principle III).
 */
export function FileMenu({ onOpenFile, onOpenFolder, onOpenRecent }: FileMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Refresh the recent list whenever the menu opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadRecent().then((items) => {
      if (!cancelled) setRecent(items);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  const handleClear = useCallback(() => {
    void clearRecent();
    setRecent([]);
  }, []);

  return (
    <div className="markdit-menu" ref={menuRef}>
      <button
        type="button"
        className="markdit-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t('file.menu')}
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
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
        {t('file.menu')}
        <svg
          className="markdit-icon markdit-menu-caret"
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
      {open && (
        <div className="markdit-menu-panel" role="menu">
          <button type="button" role="menuitem" onClick={() => run(onOpenFile)}>
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
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
            </svg>
            {t('file.open')}
          </button>
          <button type="button" role="menuitem" onClick={() => run(onOpenFolder)}>
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
            {t('file.openFolder')}
          </button>

          <div className="markdit-menu-sep" role="separator" />
          <p className="markdit-menu-heading">{t('file.recent')}</p>

          {recent.length === 0 ? (
            <p className="markdit-menu-empty">{t('file.noRecent')}</p>
          ) : (
            recent.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className="markdit-menu-recent"
                title={item.path ?? item.name}
                onClick={() => run(() => onOpenRecent(item))}
              >
                {item.kind === 'folder' ? (
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
                ) : (
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
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                  </svg>
                )}
                <span className="markdit-menu-recent-name">{item.name}</span>
              </button>
            ))
          )}

          {recent.length > 0 && (
            <>
              <div className="markdit-menu-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="markdit-menu-clear"
                onClick={handleClear}
              >
                {t('file.clearRecent')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
