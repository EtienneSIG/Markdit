import type { Editor } from '@tiptap/react';
import { FORMATTING_ACTION_LIST } from './actions';
import type { FormattingActionId } from '../../lib/types';

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

/**
 * Accessible formatting toolbar (US2, FR-004, Principle IV). Each control maps
 * to a documented, portable Markdown construct.
 */
export function Toolbar({ editor }: ToolbarProps): JSX.Element {
  return (
    <div className="markdit-toolbar" role="toolbar" aria-label="Formatting">
      {FORMATTING_ACTION_LIST.map((action) => (
        <button
          key={action.id}
          type="button"
          title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
          aria-label={action.label}
          aria-pressed={editor ? isActive(editor, action.id) : false}
          disabled={!editor}
          onClick={() => editor && run(editor, action.id)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
