import { useCallback, useEffect, useState } from 'react';
import { updaterCheck, updaterInstall, isTauriAvailable } from '../../lib/ipc';
import { t } from '../../lib/i18n';

type State =
  | { phase: 'hidden' }
  | { phase: 'available'; version?: string }
  | { phase: 'installing' }
  | { phase: 'failed'; version?: string };

/**
 * Update notification banner (FR-008). On desktop startup it asks the Rust
 * core whether a signed update is available and, if so, surfaces an accessible
 * banner letting the user install it. It is a no-op in the web build and stays
 * hidden when no update is offered, so it never gets in the way.
 */
export function UpdateBanner(): JSX.Element | null {
  const [state, setState] = useState<State>({ phase: 'hidden' });

  useEffect(() => {
    if (!isTauriAvailable()) return;
    let cancelled = false;
    (async () => {
      const res = await updaterCheck();
      if (cancelled) return;
      if (res.ok && res.value.available) {
        setState({ phase: 'available', version: res.value.version });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const version = state.phase === 'available' ? state.version : undefined;
    setState({ phase: 'installing' });
    const res = await updaterInstall();
    if (!res.ok) setState({ phase: 'failed', version });
    // On success the app is relaunched by the updater; nothing more to do here.
  }, [state]);

  const handleDismiss = useCallback(() => setState({ phase: 'hidden' }), []);

  if (state.phase === 'hidden') return null;

  const version = 'version' in state ? state.version : undefined;
  const message =
    state.phase === 'failed'
      ? t('update.failed')
      : version
        ? t('update.availableVersion').replace('{version}', version)
        : t('update.available');

  return (
    <div className="markdit-notice markdit-notice--update" role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" onClick={handleInstall} disabled={state.phase === 'installing'}>
        {state.phase === 'installing' ? t('update.installing') : t('update.install')}
      </button>
      <button
        type="button"
        className="markdit-notice-dismiss"
        onClick={handleDismiss}
        aria-label={t('update.dismiss')}
        title={t('update.dismiss')}
      >
        ✕
      </button>
    </div>
  );
}
