import { useMemo } from 'react';
import { parse } from '../../markdown/parse';
import { serialize } from '../../markdown/serialize';

export interface SourceViewProps {
  markdown: string;
  onChange: (markdown: string) => void;
  /** When true, the textarea is read-only (preview of canonical source). */
  readOnly?: boolean;
}

/**
 * Toggleable raw Markdown source view (US2, FR-006). Shows the canonical,
 * portable Markdown — the single source of truth — and allows direct editing.
 */
export function SourceView({ markdown, onChange, readOnly = false }: SourceViewProps): JSX.Element {
  // Show the canonical (normalized) serialization so the source view always
  // reflects exactly what would be written to disk.
  const canonical = useMemo(() => serialize(parse(markdown)), [markdown]);

  return (
    <textarea
      className="markdit-source"
      aria-label="Markdown source"
      spellCheck={false}
      readOnly={readOnly}
      value={readOnly ? canonical : markdown}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
