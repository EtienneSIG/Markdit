import { useEffect, useState } from 'react';
import { updaterCheck, isTauriAvailable } from '../../lib/ipc';
import { t } from '../../lib/i18n';

type CheckState = 'checking' | 'upToDate' | 'available' | 'unavailable';

/**
 * Bottom-right status bar (inspired by the Wiki viewer footer). Surfaces the
 * open-source license and the app version, plus a lightweight update-check
 * indicator. The version check only runs under the desktop runtime; in the web
 * build it reports "unavailable" without contacting any server (Principle III).
 *
 * `localeTag` is threaded in so the labels re-render when the language changes.
 */
export function StatusBar({ localeTag }: { localeTag: string }): JSX.Element {
  const [check, setCheck] = useState<CheckState>(
    isTauriAvailable() ? 'checking' : 'unavailable',
  );
  void localeTag;

  useEffect(() => {
    if (!isTauriAvailable()) {
      setCheck('unavailable');
      return;
    }
    let cancelled = false;
    setCheck('checking');
    (async () => {
      const res = await updaterCheck();
      if (cancelled) return;
      if (!res.ok) setCheck('unavailable');
      else setCheck(res.value.available ? 'available' : 'upToDate');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const checkLabel = t(`footer.check.${check}`);
  const checkClass =
    check === 'available'
      ? 'markdit-statusbar-check is-available'
      : check === 'upToDate'
        ? 'markdit-statusbar-check is-ok'
        : 'markdit-statusbar-check';

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
      <span className={checkClass} role="status" aria-live="polite">
        {checkLabel}
      </span>
    </footer>
  );
}
