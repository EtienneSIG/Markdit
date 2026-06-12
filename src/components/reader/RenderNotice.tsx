import { t } from '../../lib/i18n';

export interface RenderNoticeProps {
  /** Number of remote resources that were blocked in the current document. */
  blockedCount: number;
  onEnableRemote: () => void;
}

/**
 * Accessible banner shown when remote content was blocked (FR-003, SC-008).
 * Gives the user an explicit, informed way to opt in.
 */
export function RenderNotice({
  blockedCount,
  onEnableRemote,
}: RenderNoticeProps): JSX.Element | null {
  if (blockedCount <= 0) return null;
  return (
    <div className="markdit-notice" role="status" aria-live="polite">
      <span>{t('notice.remoteBlocked')}</span>
      <button type="button" onClick={onEnableRemote}>
        {t('notice.enableRemote')}
      </button>
    </div>
  );
}
