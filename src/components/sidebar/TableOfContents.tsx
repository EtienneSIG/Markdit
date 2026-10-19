import { useEffect, useId, useState, type RefObject } from 'react';
import { t } from '../../lib/i18n';

interface Entry {
  element: HTMLHeadingElement;
  label: string;
  level: number;
}

export function TableOfContents({
  contentRef,
}: {
  contentRef: RefObject<HTMLElement>;
}): JSX.Element | null {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const listId = useId();

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Observe the rendered surface so lazy editor mounting and live edits use
    // the same heading targets, without changing the Markdown or assigning IDs.
    const update = () => {
      const surface = content.querySelector('.markdit-reader, .markdit-editor');
      const next = Array.from(
        surface?.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6') ?? [],
      )
        .map((element) => ({
          element,
          label: element.textContent?.trim() || element.querySelector('img')?.alt || '',
          level: Number(element.tagName.slice(1)),
        }))
        .filter((entry) => entry.label);
      setEntries((previous) =>
        previous.length === next.length &&
        previous.every(
          (entry, index) =>
            entry.element === next[index].element &&
            entry.label === next[index].label &&
            entry.level === next[index].level,
        )
          ? previous
          : next,
      );
    };

    update();
    const observer = new MutationObserver(update);
    observer.observe(content, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [contentRef]);

  if (entries.length === 0) return null;
  const baseLevel = Math.min(...entries.map((entry) => entry.level));

  return (
    <aside className={`markdit-toc${collapsed ? ' is-collapsed' : ''}`} aria-label={t('toc.title')}>
      <div className="markdit-toc-header">
        {!collapsed && <h2>{t('toc.title')}</h2>}
        <button
          type="button"
          className="markdit-burger"
          aria-label={t('toc.toggle')}
          title={t('toc.toggle')}
          aria-expanded={!collapsed}
          aria-controls={listId}
          onClick={() => setCollapsed((value) => !value)}
        >
          <svg
            className="markdit-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d={collapsed ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'} />
          </svg>
        </button>
      </div>
      <nav id={listId} aria-label={t('toc.title')} hidden={collapsed}>
        <ol>
          {entries.map((entry, index) => (
            <li key={index}>
              <button
                type="button"
                style={{ paddingInlineStart: `${0.75 + (entry.level - baseLevel) * 0.75}rem` }}
                onClick={() => {
                  entry.element.tabIndex = -1;
                  entry.element.focus({ preventScroll: true });
                  entry.element.scrollIntoView({ block: 'start' });
                }}
              >
                {entry.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
