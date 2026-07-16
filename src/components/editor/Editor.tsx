import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useCallback, useEffect, useRef } from 'react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { parse } from '../../markdown/parse';
import { serialize } from '../../markdown/serialize';
import {
  mdastToProseMirror,
  proseMirrorToMdast,
  type ProseMirrorDoc,
} from '../../markdown/tiptap-bridge';
import { blobToDataUrl, imageFilesFrom } from '../../lib/image';
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
  const editorRef = useRef<TiptapEditor | null>(null);

  // Embed dropped/pasted images as self-contained base64 data URIs so the
  // Markdown stays portable (nothing is uploaded; nothing leaves the device).
  const insertImages = useCallback(async (files: File[]) => {
    const ed = editorRef.current;
    if (!ed) return;
    for (const file of files) {
      try {
        const src = await blobToDataUrl(file);
        ed.chain().focus().setImage({ src, alt: file.name }).run();
      } catch {
        /* Skip unreadable images. */
      }
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: false }),
      Image.configure({ inline: true, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
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
      handlePaste: (_view, event) => {
        const files = imageFilesFrom(event.clipboardData);
        if (files.length === 0) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = imageFilesFrom((event as DragEvent).dataTransfer);
        if (files.length === 0) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
    },
  });

  // Expose the live editor to the paste/drop handlers defined above.
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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
