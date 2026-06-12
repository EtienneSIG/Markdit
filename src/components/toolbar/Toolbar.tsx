import type { Editor } from '@tiptap/react';
import { FORMATTING_ACTIONS } from './actions';
import type { FormattingActionId } from '../../lib/types';
import { t } from '../../lib/i18n';

export interface ToolbarProps {
  editor: Editor | null;
}

/** Dispatch a portable formatting action to the TipTap editor. */
function run(editor: Editor, id: FormattingActionId): void {
  const chain = editor.chain().focus();
  switch (id) {
    case 'bold':
      chain.toggleBold().run();
      break;
    case 'italic':
      chain.toggleItalic().run();
      break;
    case 'strikethrough':
      chain.toggleStrike().run();
      break;
    case 'inlineCode':
      chain.toggleCode().run();
      break;
    case 'heading':
      chain.toggleHeading({ level: 2 }).run();
      break;
    case 'bulletList':
      chain.toggleBulletList().run();
      break;
    case 'orderedList':
      chain.toggleOrderedList().run();
      break;
    case 'codeBlock':
      chain.toggleCodeBlock().run();
      break;
    case 'blockquote':
      chain.toggleBlockquote().run();
      break;
    case 'horizontalRule':
      chain.setHorizontalRule().run();
      break;
    default:
      // taskList, link, table require additional extensions; no-op for now.
      chain.run();
  }
}

function isActive(editor: Editor, id: FormattingActionId): boolean {
  const map: Partial<Record<FormattingActionId, string>> = {
    bold: 'bold',
    italic: 'italic',
    strikethrough: 'strike',
    inlineCode: 'code',
    bulletList: 'bulletList',
    orderedList: 'orderedList',
    codeBlock: 'codeBlock',
    blockquote: 'blockquote',
  };
  const name = map[id];
  return name ? editor.isActive(name) : false;
}

/** Inline SVG glyphs (decorative — buttons carry their accessible name). */
function Icon({ id }: { id: FormattingActionId }): JSX.Element {
  const common = {
    className: 'markdit-icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  switch (id) {
    case 'bold':
      return (
        <svg {...common} strokeWidth={2.4}>
          <path d="M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z" />
        </svg>
      );
    case 'italic':
      return (
        <svg {...common}>
          <line x1="19" y1="4" x2="10" y2="4" />
          <line x1="14" y1="20" x2="5" y2="20" />
          <line x1="15" y1="4" x2="9" y2="20" />
        </svg>
      );
    case 'strikethrough':
      return (
        <svg {...common}>
          <path d="M16 4H9a3 3 0 0 0-1 5.83" />
          <path d="M8 20h7a3 3 0 0 0 1-5.83" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      );
    case 'inlineCode':
      return (
        <svg {...common}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'heading':
      return (
        <svg {...common}>
          <path d="M6 4v16" />
          <path d="M18 4v16" />
          <path d="M6 12h12" />
        </svg>
      );
    case 'bulletList':
      return (
        <svg {...common}>
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'orderedList':
      return (
        <svg {...common}>
          <line x1="10" y1="6" x2="20" y2="6" />
          <line x1="10" y1="12" x2="20" y2="12" />
          <line x1="10" y1="18" x2="20" y2="18" />
          <path d="M4 4v4" strokeWidth={1.6} />
          <path d="M3 16h2l-2 3h2" strokeWidth={1.6} />
        </svg>
      );
    case 'blockquote':
      return (
        <svg {...common}>
          <path d="M6 17h3l2-4V7H5v6h2zM14 17h3l2-4V7h-6v6h2z" />
        </svg>
      );
    case 'codeBlock':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <polyline points="10 9 8 12 10 15" strokeWidth={1.6} />
          <polyline points="14 9 16 12 14 15" strokeWidth={1.6} />
        </svg>
      );
    case 'horizontalRule':
      return (
        <svg {...common}>
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

/** Ribbon groups (Word-like): each maps to documented portable constructs. */
const RIBBON_GROUPS: { labelKey: string; actions: FormattingActionId[] }[] = [
  { labelKey: 'ribbon.group.font', actions: ['bold', 'italic', 'strikethrough', 'inlineCode'] },
  {
    labelKey: 'ribbon.group.paragraph',
    actions: ['heading', 'bulletList', 'orderedList', 'blockquote'],
  },
  { labelKey: 'ribbon.group.insert', actions: ['codeBlock', 'horizontalRule'] },
];

/**
 * Accessible formatting ribbon (US2, FR-004, Principle IV). A single
 * `role="toolbar"` groups portable Markdown controls into Word-like sections;
 * every control maps to a documented, portable Markdown construct.
 */
export function Toolbar({ editor }: ToolbarProps): JSX.Element {
  return (
    <div className="markdit-ribbon" role="toolbar" aria-label="Formatting">
      {RIBBON_GROUPS.map((group) => (
        <div
          key={group.labelKey}
          className="markdit-ribbon-group"
          role="group"
          aria-label={t(group.labelKey)}
        >
          <div className="markdit-ribbon-buttons">
            {group.actions.map((id) => {
              const action = FORMATTING_ACTIONS[id];
              return (
                <button
                  key={id}
                  type="button"
                  title={
                    action.shortcut ? `${action.label} (${action.shortcut})` : action.label
                  }
                  aria-label={action.label}
                  aria-pressed={editor ? isActive(editor, id) : false}
                  disabled={!editor}
                  onClick={() => editor && run(editor, id)}
                >
                  <Icon id={id} />
                </button>
              );
            })}
          </div>
          <span className="markdit-ribbon-label" aria-hidden="true">
            {t(group.labelKey)}
          </span>
        </div>
      ))}
    </div>
  );
}
