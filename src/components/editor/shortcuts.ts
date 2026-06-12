import type { FormattingActionId } from '../../lib/types';
import { FORMATTING_ACTIONS } from '../toolbar/actions';

/**
 * Keyboard shortcut map for formatting actions (US2, FR-004). TipTap's
 * StarterKit already binds the common ones; this map is the single source of
 * truth for documentation, tooltips, and any custom binding.
 */
export const SHORTCUTS: Partial<Record<FormattingActionId, string>> = Object.fromEntries(
  Object.values(FORMATTING_ACTIONS)
    .filter((a) => a.shortcut)
    .map((a) => [a.id, a.shortcut as string]),
);

/** Normalize a keyboard event to a `Mod-…` shortcut string for lookup. */
export function eventToShortcut(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Mod');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  parts.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  return parts.join('-');
}

/** Resolve a keyboard event to the formatting action it triggers, if any. */
export function shortcutToActionId(e: KeyboardEvent): FormattingActionId | null {
  const combo = eventToShortcut(e);
  const entry = Object.entries(SHORTCUTS).find(([, s]) => s === combo);
  return (entry?.[0] as FormattingActionId) ?? null;
}
