import { useCallback, useEffect, useState } from 'react';
import { isDesktopShell, openExternal } from '../../lib/desktop';
import { checkForUpdate } from '../../lib/update';
import { t } from '../../lib/i18n';

type CheckState =
  | 'idle'
  | 'checking'
  | 'upToDate'
  | 'available'
  | 'unavailable'
  | 'installing';

/**
 * Bottom-right status bar (inspired by the Wiki viewer footer). Surfaces the
 * open-source license and the app version, plus an interactive update-check
 * indicator: click to (re-)check on demand, and when a newer release exists a
 * highlighted badge appears that opens the download page. The check only reaches
 * out under the desktop runtime, querying nothing but GitHub's public release
 * list; in the web build it reports "unavailable" without contacting any server
 * (Principle III).
 *
 * `localeTag` is threaded in so the labels re-render when the language changes.
 */
export function StatusBar({ localeTag }: { localeTag: string }): JSX.Element {
  const [check, setCheck] = useState<CheckState>('idle');
  const [version, setVersion] = useState<string | undefined>(undefined);
  const [releaseUrl, setReleaseUrl] = useState<string | undefined>(undefined);
  void localeTag;

  const runCheck = useCallback(async () => {
    if (!isDesktopShell()) {
      setCheck('unavailable');
      return;
    }
    setCheck('checking');
    const info = await checkForUpdate(__APP_VERSION__);
    if (!info) {
      setCheck('unavailable');
      return;
    }
    if (info.available) {
      setVersion(info.version);
      setReleaseUrl(info.url);
      setCheck('available');
    } else {
      setCheck('upToDate');
    }
  }, []);

  // Silent check once on mount.
  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  const handleInstall = useCallback(() => {
    // No signed in-app installer: open the release page to download the update.
    if (releaseUrl) void openExternal(releaseUrl);
  }, [releaseUrl]);

  return (
    <footer className="markdit-statusbar" aria-label={t('app.title')}>
      <span className="markdit-statusbar-license" title={t('footer.license')}>
        {__APP_LICENSE__}
      </span>
      <span className="markdit-statusbar-sep" aria-hidden="true">
        ·
      </span>
      <span className="markdit-statusbar-version">v{__APP_VERSION__}</span>
      <span className="markdit-statusbar-sep" aria-hidden="true">
        ·
      </span>

      {check === 'available' ? (
        <button
          type="button"
          className="markdit-statusbar-check is-available"
          onClick={handleInstall}
          title={version ? t('update.availableVersion', { version }) : t('update.available')}
        >
          <span className="markdit-update-dot" aria-hidden="true" />
          {version ? t('footer.update.badge', { version }) : t('footer.check.available')}
        </button>
      ) : check === 'installing' ? (
        <span className="markdit-statusbar-check is-available" role="status" aria-live="polite">
          {t('update.installing')}
        </span>
      ) : (
        <button
          type="button"
          className={
            check === 'upToDate'
              ? 'markdit-statusbar-check is-ok'
              : 'markdit-statusbar-check'
          }
          onClick={() => void runCheck()}
          disabled={check === 'checking'}
          title={t('footer.check.idle')}
          aria-live="polite"
        >
          {check === 'checking'
            ? t('footer.check.checking')
            : check === 'upToDate'
              ? t('footer.check.upToDate')
              : check === 'unavailable'
                ? t('footer.check.unavailable')
                : t('footer.check.idle')}
        </button>
      )}
    </footer>
  );
}
