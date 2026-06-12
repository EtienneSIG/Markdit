import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';
import { parse } from '../../markdown/parse';
import { serialize } from '../../markdown/serialize';
import {
  mdastToProseMirror,
  proseMirrorToMdast,
  type ProseMirrorDoc,
} from '../../markdown/tiptap-bridge';
import { Toolbar } from '../toolbar/Toolbar';
import { t } from '../../lib/i18n';

export interface EditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

/**
 * WYSIWYG editor (US2, FR-004). TipTap provides the visual surface; the
 * remark/rehype engine stays the single source of truth — the editor document
 * is converted to mdast and serialized to standard Markdown on every change
 * (Principle I/II). No proprietary format is ever persisted.
 */
export function Editor({ markdown, onChange }: EditorProps): JSX.Element {
  const lastEmitted = useRef<string>(markdown);

  const editor = useEditor({
    extensions: [StarterKit],
    content: mdastToProseMirror(parse(markdown)) as unknown as Record<string, unknown>,
    onUpdate: ({ editor: ed }) => {
      const doc = ed.getJSON() as unknown as ProseMirrorDoc;
      const md = serialize(proseMirrorToMdast(doc));
      lastEmitted.current = md;
      onChange(md);
    },
    editorProps: {
      attributes: {
        class: 'markdit-editor',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': t('editor.label'),
      },
    },
  });

  // Re-sync external markdown changes (e.g. file reload) without clobbering
  // in-flight edits.
  useEffect(() => {
    if (!editor) return;
    if (markdown !== lastEmitted.current) {
      editor.commands.setContent(
        mdastToProseMirror(parse(markdown)) as unknown as Record<string, unknown>,
        false,
      );
      lastEmitted.current = markdown;
    }
  }, [markdown, editor]);

  return (
    <div className="markdit-editor-shell">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
