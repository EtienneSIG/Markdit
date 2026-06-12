import { useEffect, useRef, useState } from 'react';
import type { ExportResult, ExportTargetId, PrivacySettings } from '../../lib/types';
import { EXPORT_TARGETS, exportWord, exportCloud, canExportToCloud } from '../../export/exporter';
import { grantConsent } from '../../privacy/consent';
import { t } from '../../lib/i18n';

export interface ExportDialogProps {
  open: boolean;
  markdown: string;
  fileName: string;
  settings: PrivacySettings;
  onSettingsChange: (settings: PrivacySettings) => void;
  onClose: () => void;
}

/**
 * Accessible export dialog (US4, T064/T065, FR-010/011/013). Reports the
 * non-representable elements that will be dropped and gates cloud targets behind
 * explicit, recorded consent before any content leaves the device.
 */
export function ExportDialog({
  open,
  markdown,
  fileName,
  settings,
  onSettingsChange,
  onClose,
}: ExportDialogProps): JSX.Element | null {
  const [target, setTarget] = useState<ExportTargetId>('word');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog on open and close on Escape (keyboard a11y).
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const meta = EXPORT_TARGETS.find((tg) => tg.id === target)!;
  const isCloud = meta.mode === 'cloud';
  const cloudTarget = target as 'onenote' | 'loop';
  const needsConsent = isCloud && !canExportToCloud(settings, cloudTarget);

  const handleGrantConsent = async () => {
    const updated = await grantConsent(cloudTarget, meta.requiredScopes);
    if (updated) onSettingsChange(updated);
  };

  const handleExport = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res =
        target === 'word'
          ? await exportWord(markdown, fileName.replace(/\.md$/i, '.docx'))
          : await exportCloud(cloudTarget, markdown, fileName, settings);
      setResult(res);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="markdit-modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="markdit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="export-dialog-title">{t('export.title')}</h2>

        <label htmlFor="export-target">{t('export.target')}</label>
        <select
          id="export-target"
          value={target}
          onChange={(e) => {
            setTarget(e.target.value as ExportTargetId);
            setResult(null);
          }}
        >
          {EXPORT_TARGETS.map((tg) => (
            <option key={tg.id} value={tg.id}>
              {tg.displayName}
            </option>
          ))}
        </select>

        {meta.unsupportedElements.length > 0 && (
          <div className="markdit-export-dropped">
            <p>{t('export.dropped')}</p>
            <ul>
              {meta.unsupportedElements.map((el) => (
                <li key={el}>{el}</li>
              ))}
            </ul>
          </div>
        )}

        {needsConsent && (
          <div className="markdit-export-consent" role="note">
            <p>{t('export.consentNeeded')}</p>
            <button type="button" onClick={handleGrantConsent}>
              {t('export.grantConsent')}
            </button>
          </div>
        )}

        {result && (
          <p role="status" aria-live="polite">
            {result.status === 'failed' ? t('export.failed') : t('export.success')}
            {result.message ? ` — ${result.message}` : ''}
          </p>
        )}

        <div className="markdit-modal-actions">
          <button type="button" onClick={onClose} ref={closeRef}>
            {result ? t('export.close') : t('export.cancel')}
          </button>
          <button type="button" onClick={handleExport} disabled={busy || needsConsent}>
            {t('export.run')}
          </button>
        </div>
      </div>
    </div>
  );
}
