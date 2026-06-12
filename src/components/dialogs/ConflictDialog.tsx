import { useEffect, useRef } from 'react';
import { t } from '../../lib/i18n';

export interface ConflictDialogProps {
  open: boolean;
  fileName: string;
  /** Discard in-memory edits and load the on-disk version. */
  onReload: () => void;
  /** Dismiss and keep the user's current (unsaved) version. */
  onKeep: () => void;
}

/**
 * Save-conflict / external-change prompt (T043, FR-007, Edge Case). Shown when
 * the open document is modified on disk outside Markdit. The user decides
 * whether to reload the disk version or keep their edits — nothing is clobbered
 * silently. Fully keyboard- and screen-reader-accessible (FR-013).
 */
export function ConflictDialog({
  open,
  fileName,
  onReload,
  onKeep,
}: ConflictDialogProps): JSX.Element | null {
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    keepRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onKeep();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onKeep]);

  if (!open) return null;

  return (
    <div className="markdit-modal-backdrop" onClick={onKeep}>
      <div
        className="markdit-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
        aria-describedby="conflict-dialog-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="conflict-dialog-title">{t('conflict.title')}</h2>
        <p id="conflict-dialog-body">
          {t('conflict.body')}
          {fileName ? ` (${fileName})` : ''}
        </p>
        <div className="markdit-modal-actions">
          <button type="button" onClick={onKeep} ref={keepRef}>
            {t('conflict.keep')}
          </button>
          <button type="button" onClick={onReload}>
            {t('conflict.reload')}
          </button>
        </div>
      </div>
    </div>
  );
}
