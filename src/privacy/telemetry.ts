/**
 * Opt-in, anonymized, instantly-disableable telemetry (FR-014, Principle III).
 *
 * Telemetry is OFF by default. Events carry no document content and no personal
 * data — only an event name and coarse, non-identifying counters. When disabled,
 * `track()` is a no-op and performs zero network activity.
 */
import type { PrivacySettings } from '../lib/types';

export interface TelemetryEvent {
  name: string;
  /** Non-identifying numeric/string properties only. */
  props?: Record<string, number | string | boolean>;
}

let enabled = false;

/** Synchronize the telemetry switch from persisted settings. */
export function configureTelemetry(settings: Pick<PrivacySettings, 'telemetryEnabled'>): void {
  enabled = settings.telemetryEnabled === true;
}

export function isTelemetryEnabled(): boolean {
  return enabled;
}

/** Disallowed property keys that could carry personal data. */
const FORBIDDEN = new Set(['path', 'filePath', 'fileName', 'content', 'markdown', 'url', 'email']);

function sanitizeProps(
  props?: Record<string, number | string | boolean>,
): Record<string, number | string | boolean> | undefined {
  if (!props) return undefined;
  const out: Record<string, number | string | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (FORBIDDEN.has(k)) continue;
    out[k] = v;
  }
  return out;
}

/** Record a telemetry event. No-op (and no network) when disabled. */
export function track(event: TelemetryEvent): void {
  if (!enabled) return;
  const payload = { name: event.name, props: sanitizeProps(event.props), ts: Date.now() };
  // Transport is intentionally pluggable; nothing is sent unless a consented
  // collector is configured by the host. Default build performs no network I/O.
  void payload;
}
