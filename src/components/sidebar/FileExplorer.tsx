import { useCallback, useState } from 'react';
import { isTauriAvailable, documentOpen } from '../../lib/ipc';
import { t } from '../../lib/i18n';

/** A node in the Markdown file tree shown in the sidebar. */
export interface FileNode {
  name: string;
  kind: 'file' | 'directory';
  /** File handle for browser File System Access API (files only). */
  handle?: FileSystemFileHandle;
  /** Lazily-built children for directories. */
  children?: FileNode[];
  /** Display path relative to the opened root. */
  path: string;
}

export interface SelectedFile {
  name: string;
  path: string;
  markdown: string;
}

export interface FileExplorerProps {
  activePath: string | null;
  onOpenFile: (file: SelectedFile) => void;
}

const MD_EXT = /\.(md|markdown|mdown|mkd)$/i;

/** Recursively read a directory handle into a tree of Markdown files/folders. */
async function readDirectory(
  dir: FileSystemDirectoryHandle,
  basePath = '',
): Promise<FileNode[]> {
  const nodes: FileNode[] = [];
  for await (const entry of dir.values()) {
    const path = basePath ? `${basePath}/${entry.name}` : entry.name;
    if (entry.kind === 'directory') {
      const children = await readDirectory(entry as FileSystemDirectoryHandle, path);
      // Only keep folders that contain Markdown files somewhere inside.
      if (children.length > 0) {
        nodes.push({ name: entry.name, kind: 'directory', children, path });
      }
    } else if (MD_EXT.test(entry.name)) {
      nodes.push({ name: entry.name, kind: 'file', handle: entry as FileSystemFileHandle, path });
    }
  }
  // Folders first, then files; both alphabetical.
  return nodes.sort((a, b) =>
    a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1,
  );
}

interface TreeProps {
  nodes: FileNode[];
  activePath: string | null;
  depth: number;
  onSelect: (node: FileNode) => void;
}

function Tree({ nodes, activePath, depth, onSelect }: TreeProps): JSX.Element {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  return (
    <ul className="markdit-tree" role="group">
      {nodes.map((node) => {
        if (node.kind === 'directory') {
          const isCollapsed = collapsed[node.path] ?? false;
          return (
            <li key={node.path} role="treeitem" aria-expanded={!isCollapsed}>
              <button
                type="button"
                className="markdit-tree-row markdit-tree-dir"
                style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
                onClick={() => setCollapsed((c) => ({ ...c, [node.path]: !isCollapsed }))}
              >
                <span aria-hidden="true">{isCollapsed ? '▸' : '▾'}</span> {node.name}
              </button>
              {!isCollapsed && node.children && (
                <Tree
                  nodes={node.children}
                  activePath={activePath}
                  depth={depth + 1}
                  onSelect={onSelect}
                />
              )}
            </li>
          );
        }
        return (
          <li key={node.path} role="treeitem" aria-selected={activePath === node.path}>
            <button
              type="button"
              className={`markdit-tree-row markdit-tree-file${
                activePath === node.path ? ' is-active' : ''
              }`}
              style={{ paddingLeft: `${depth * 0.75 + 1.25}rem` }}
              onClick={() => onSelect(node)}
            >
              {node.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Persistent left navigation sidebar (always visible) for browsing and opening
 * Markdown files. Uses the browser File System Access API to read a chosen
 * folder locally — no upload, nothing leaves the device (Principle III). When
 * running under Tauri, falls back to the native open dialog.
 */
export function FileExplorer({ activePath, onOpenFile }: FileExplorerProps): JSX.Element {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [rootName, setRootName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPickDirectory = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

  const openFolder = useCallback(async () => {
    setError(null);
    try {
      const dir = await window.showDirectoryPicker!({ mode: 'read' });
      const nodes = await readDirectory(dir);
      setRootName(dir.name);
      setTree(nodes);
    } catch (err) {
      // User cancelled the picker — not an error worth surfacing.
      if ((err as DOMException)?.name !== 'AbortError') {
        setError(String(err));
      }
    }
  }, []);

  const openSingleFile = useCallback(async () => {
    const res = await documentOpen();
    if (res.ok) {
      onOpenFile({ name: res.value.fileName, path: res.value.path, markdown: res.value.markdown });
    }
  }, [onOpenFile]);

  const handleSelect = useCallback(
    async (node: FileNode) => {
      if (node.kind !== 'file' || !node.handle) return;
      try {
        const file = await node.handle.getFile();
        const markdown = await file.text();
        onOpenFile({ name: node.name, path: node.path, markdown });
      } catch (err) {
        setError(String(err));
      }
    },
    [onOpenFile],
  );

  return (
    <nav className="markdit-sidebar" aria-label={t('sidebar.title')}>
      <div className="markdit-sidebar-header">
        <strong>{t('sidebar.files')}</strong>
        {canPickDirectory ? (
          <button type="button" onClick={openFolder} title={t('sidebar.openFolder')}>
            {t('sidebar.openFolder')}
          </button>
        ) : (
          isTauriAvailable() && (
            <button type="button" onClick={openSingleFile} title={t('action.open')}>
              {t('action.open')}
            </button>
          )
        )}
      </div>

      {rootName && <div className="markdit-sidebar-root">{rootName}</div>}

      <div className="markdit-sidebar-body" role="tree" aria-label={t('sidebar.files')}>
        {tree.length > 0 ? (
          <Tree nodes={tree} activePath={activePath} depth={0} onSelect={handleSelect} />
        ) : (
          <p className="markdit-sidebar-empty">
            {canPickDirectory ? t('sidebar.empty') : t('sidebar.unsupported')}
          </p>
        )}
      </div>

      {error && (
        <p className="markdit-sidebar-error" role="alert">
          {error}
        </p>
      )}
    </nav>
  );
}
