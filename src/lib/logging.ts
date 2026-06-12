/**
 * PII-free logging (T013). Logs MUST NOT contain document content or personal
 * data — only event names, severities, and non-identifying metadata.
 * Aligns with Principle III (privacy by design).
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Keys that must never be logged, even if accidentally passed in. */
const FORBIDDEN_KEYS = new Set([
  'markdown',
  'content',
  'filePath',
  'fileName',
  'username',
  'email',
]);

function scrub(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (FORBIDDEN_KEYS.has(key)) {
      safe[key] = '[redacted]';
    } else if (typeof value === 'string' && value.length > 120) {
      // Never let large free-text (likely content) leak into logs.
      safe[key] = '[redacted:long-string]';
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

export function log(level: LogLevel, event: string, meta?: Record<string, unknown>): void {
  const entry = { level, event, meta: scrub(meta), ts: new Date().toISOString() };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, meta?: Record<string, unknown>) => log('debug', event, meta),
  info: (event: string, meta?: Record<string, unknown>) => log('info', event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => log('warn', event, meta),
  error: (event: string, meta?: Record<string, unknown>) => log('error', event, meta),
};
