/**
 * Offline Word (.docx) export (US4, FR-009). Converts the mdast tree to a
 * WordprocessingML document with the `docx` library — fully offline, no network
 * and no account required (Principle II/III). Non-representable constructs are
 * reported as dropped elements rather than silently lost.
 */
import { Document, HeadingLevel, Packer, Paragraph, TextRun, type ISectionOptions } from 'docx';
import type { Root, RootContent, PhrasingContent, List, ListItem, Heading } from 'mdast';
import type { MarkdownElement } from '../lib/types';

const HEADING_LEVELS: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

interface RunStyle {
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  code?: boolean;
}

function phrasingToRuns(nodes: PhrasingContent[], style: RunStyle = {}): TextRun[] {
  const runs: TextRun[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        runs.push(
          new TextRun({ text: node.value, ...style, font: style.code ? 'Consolas' : undefined }),
        );
        break;
      case 'strong':
        runs.push(...phrasingToRuns(node.children, { ...style, bold: true }));
        break;
      case 'emphasis':
        runs.push(...phrasingToRuns(node.children, { ...style, italics: true }));
        break;
      case 'delete':
        runs.push(...phrasingToRuns(node.children, { ...style, strike: true }));
        break;
      case 'inlineCode':
        runs.push(new TextRun({ text: node.value, font: 'Consolas' }));
        break;
      case 'link':
        runs.push(...phrasingToRuns(node.children, style));
        break;
      case 'break':
        runs.push(new TextRun({ break: 1 }));
        break;
      default:
        if ('value' in node && typeof node.value === 'string') {
          runs.push(new TextRun({ text: node.value, ...style }));
        }
    }
  }
  return runs;
}

function listToParagraphs(list: List, dropped: Set<MarkdownElement>, depth = 0): Paragraph[] {
  const paras: Paragraph[] = [];
  list.children.forEach((item: ListItem, index) => {
    const prefix = list.ordered ? `${(list.start ?? 1) + index}. ` : '\u2022 ';
    const indent = '\u00a0\u00a0'.repeat(depth);
    for (const child of item.children) {
      if (child.type === 'paragraph') {
        paras.push(
          new Paragraph({
            children: [new TextRun(indent + prefix), ...phrasingToRuns(child.children)],
          }),
        );
      } else if (child.type === 'list') {
        paras.push(...listToParagraphs(child, dropped, depth + 1));
      }
    }
  });
  return paras;
}

function blockToParagraphs(node: RootContent, dropped: Set<MarkdownElement>): Paragraph[] {
  switch (node.type) {
    case 'heading': {
      const h = node as Heading;
      return [
        new Paragraph({ heading: HEADING_LEVELS[h.depth], children: phrasingToRuns(h.children) }),
      ];
    }
    case 'paragraph':
      return [new Paragraph({ children: phrasingToRuns(node.children) })];
    case 'blockquote':
      return node.children.flatMap((c) => blockToParagraphs(c, dropped));
    case 'code':
      return node.value
        .split('\n')
        .map(
          (line) => new Paragraph({ children: [new TextRun({ text: line, font: 'Consolas' })] }),
        );
    case 'list':
      return listToParagraphs(node, dropped);
    case 'thematicBreak':
      return [new Paragraph({ thematicBreak: true })];
    case 'table':
      // Tables are not yet mapped to WordprocessingML tables.
      dropped.add('table');
      return [];
    default:
      return [new Paragraph({ children: [] })];
  }
}

export interface DocxResult {
  bytes: Uint8Array;
  droppedElements: MarkdownElement[];
}

/** Convert an mdast tree into a .docx byte buffer. */
export async function exportToDocx(tree: Root): Promise<DocxResult> {
  const dropped = new Set<MarkdownElement>();
  const children = tree.children.flatMap((n) => blockToParagraphs(n, dropped));
  const section: ISectionOptions = { properties: {}, children };
  const doc = new Document({ sections: [section] });
  // `Packer.toBuffer` relies on Node's `Buffer`, which is absent in the browser
  // and the Tauri WebView; `Packer.toBlob` is the browser-safe path. Select the
  // available one so the export stays fully client-side and offline (FR-009).
  const bytes =
    typeof Buffer !== 'undefined'
      ? new Uint8Array(await Packer.toBuffer(doc))
      : new Uint8Array(await (await Packer.toBlob(doc)).arrayBuffer());
  return { bytes, droppedElements: [...dropped] };
}
