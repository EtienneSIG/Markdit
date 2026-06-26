import { useCallback, useEffect, useRef, useState } from 'react';
import { isTauriAvailable, documentOpen } from '../../lib/ipc';
import { loadFolders, saveFolders, clearFolders } from '../../lib/folder-handle';
import { t } from '../../lib/i18n';

/** Sidebar width bounds (px) and persistence key for the resize handle. */
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 560;
const DEFAULT_SIDEBAR_WIDTH = 256;
const SIDEBAR_WIDTH_KEY = 'markdit.sidebarWidth';

const clampWidth = (w: number): number =>
  Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, w));

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
  /** File handle for saving back to disk (browser File System Access API). */
  handle?: FileSystemFileHandle;
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
                title={node.name}
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
              title={node.name}
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

/** A top-level entry in the sidebar: an opened folder or a group of files. */
interface WorkspaceRoot {
  id: string;
  name: string;
  kind: 'folder' | 'files';
  nodes: FileNode[];
  /** Present for folder roots; used to persist/re-grant access. */
  dirHandle?: FileSystemDirectoryHandle;
}

interface RootSectionProps {
  root: WorkspaceRoot;
  activePath: string | null;
  onSelect: (node: FileNode) => void;
  onRemove: (id: string) => void;
}

/** A collapsible top-level root (folder or files group) with a remove control. */
function RootSection({ root, activePath, onSelect, onRemove }: RootSectionProps): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <li role="treeitem" aria-expanded={!collapsed} className="markdit-root">
      <div className="markdit-root-row">
        <button
          type="button"
          className="markdit-tree-row markdit-tree-dir markdit-root-toggle"
          title={root.name}
          onClick={() => setCollapsed((c) => !c)}
        >
          <span aria-hidden="true">{collapsed ? '▸' : '▾'}</span> {root.name}
        </button>
        <button
          type="button"
          className="markdit-root-remove"
          aria-label={t('sidebar.removeRoot').replace('{name}', root.name)}
          title={t('sidebar.removeRoot').replace('{name}', root.name)}
          onClick={() => onRemove(root.id)}
        >
          ✕
        </button>
      </div>
      {!collapsed &&
        (root.nodes.length > 0 ? (
          <Tree nodes={root.nodes} activePath={activePath} depth={1} onSelect={onSelect} />
        ) : (
          <p className="markdit-sidebar-empty markdit-root-empty">{t('sidebar.rootEmpty')}</p>
        ))}
    </li>
  );
}

/**
 * Persistent left navigation sidebar (always visible) for browsing and opening
 * Markdown files. Uses the browser File System Access API to read chosen
 * folders and files locally — no upload, nothing leaves the device
 * (Principle III). Supports several folders at once plus individually added
 * files (multi-root workspace). When running without the File System Access
 * API, falls back to the native Tauri open dialog.
 */
export function FileExplorer({ activePath, onOpenFile }: FileExplorerProps): JSX.Element {
  const [roots, setRoots] = useState<WorkspaceRoot[]>([]);
  const [error, setError] = useState<string | null>(null);
  /** Remembered folders awaiting a user gesture to re-grant read permission. */
  const [pendingFolders, setPendingFolders] = useState<FileSystemDirectoryHandle[]>([]);

  /** User-adjustable sidebar width (px), restored from the previous session. */
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_SIDEBAR_WIDTH;
    const saved = Number(window.localStorage?.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(saved) && saved > 0 ? clampWidth(saved) : DEFAULT_SIDEBAR_WIDTH;
  });
  const navRef = useRef<HTMLElement>(null);

  // Persist the chosen width so the layout is stable across sessions.
  useEffect(() => {
    try {
      window.localStorage?.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    } catch {
      // Storage may be unavailable (private mode); width stays in-memory only.
    }
  }, [sidebarWidth]);

  /** Drag the right edge to resize; uses pointer capture for a smooth drag. */
  const startResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = navRef.current?.getBoundingClientRect().width ?? DEFAULT_SIDEBAR_WIDTH;
    const onMove = (ev: PointerEvent) => {
      setSidebarWidth(clampWidth(startWidth + (ev.clientX - startX)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  /** Keyboard resize for accessibility (WCAG 2.2): arrows nudge the width. */
  const onResizerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 32 : 16;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSidebarWidth((w) => clampWidth(w - step));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSidebarWidth((w) => clampWidth(w + step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    }
  }, []);

  const canPickDirectory =
    typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
  const canPickFiles =
    typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function';

  /** Persist the current folder roots (file roots stay session-only). */
  const persistFolders = useCallback((next: WorkspaceRoot[]) => {
    const handles = next
      .filter((r) => r.kind === 'folder' && r.dirHandle)
      .map((r) => r.dirHandle!);
    if (handles.length > 0) void saveFolders(handles);
    else void clearFolders();
  }, []);

  /** Add (or refresh) a folder root from a directory handle. */
  const addFolderRoot = useCallback(
    async (dir: FileSystemDirectoryHandle) => {
      const nodes = await readDirectory(dir);
      setRoots((prev) => {
        // Replace an existing root for the same folder name to avoid duplicates.
        const withoutDupe = prev.filter(
          (r) => !(r.kind === 'folder' && r.name === dir.name),
        );
        const next: WorkspaceRoot[] = [
          ...withoutDupe,
          { id: `folder:${dir.name}`, name: dir.name, kind: 'folder', nodes, dirHandle: dir },
        ];
        persistFolders(next);
        return next;
      });
      setPendingFolders((p) => p.filter((h) => h.name !== dir.name));
    },
    [persistFolders],
  );

  /** Pick a folder and add it as a new root (keeps any existing roots). */
  const openFolder = useCallback(async () => {
    setError(null);
    try {
      const dir = await window.showDirectoryPicker!({ mode: 'readwrite' });
      await addFolderRoot(dir);
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') setError(String(err));
    }
  }, [addFolderRoot]);

  /** Pick one or more Markdown files and add them under a "Files" root. */
  const openFiles = useCallback(async () => {
    setError(null);
    try {
      const handles = await window.showOpenFilePicker!({
        multiple: true,
        types: [
          {
            description: 'Markdown',
            accept: { 'text/markdown': ['.md', '.markdown', '.mdown', '.mkd'] },
          },
        ],
      });
      const newFiles: FileNode[] = handles.map((h) => ({
        name: h.name,
        kind: 'file',
        handle: h,
        path: `files/${h.name}`,
      }));
      setRoots((prev) => {
        const existing = prev.find((r) => r.id === 'files');
        const mergedNodes = existing
          ? [
              ...existing.nodes,
              ...newFiles.filter((f) => !existing.nodes.some((n) => n.path === f.path)),
            ].sort((a, b) => a.name.localeCompare(b.name))
          : newFiles.sort((a, b) => a.name.localeCompare(b.name));
        const filesRoot: WorkspaceRoot = {
          id: 'files',
          name: t('sidebar.filesGroup'),
          kind: 'files',
          nodes: mergedNodes,
        };
        return [filesRoot, ...prev.filter((r) => r.id !== 'files')];
      });
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') setError(String(err));
    }
  }, []);

  /** Remove a root (folder or files group) from the sidebar. */
  const removeRoot = useCallback(
    (id: string) => {
      setRoots((prev) => {
        const next = prev.filter((r) => r.id !== id);
        persistFolders(next);
        return next;
      });
    },
    [persistFolders],
  );

  /** Re-grant access to a remembered folder (requires a user gesture). */
  const reopenFolder = useCallback(
    async (dir: FileSystemDirectoryHandle) => {
      setError(null);
      try {
        const granted = (await dir.requestPermission?.({ mode: 'readwrite' })) ?? 'granted';
        if (granted === 'granted') {
          await addFolderRoot(dir);
        } else {
          setPendingFolders((p) => p.filter((h) => h.name !== dir.name));
        }
      } catch (err) {
        setError(String(err));
      }
    },
    [addFolderRoot],
  );

  // Restore remembered folders on mount. Folders the browser still grants are
  // loaded immediately; those needing a fresh gesture surface a one-click
  // "reopen" prompt; the rest are forgotten.
  useEffect(() => {
    if (!canPickDirectory) return;
    let cancelled = false;
    void (async () => {
      const dirs = await loadFolders();
      if (cancelled || dirs.length === 0) return;
      for (const dir of dirs) {
        const state = (await dir.queryPermission?.({ mode: 'readwrite' })) ?? 'prompt';
        if (cancelled) return;
        if (state === 'granted') {
          try {
            await addFolderRoot(dir);
          } catch {
            if (!cancelled) setPendingFolders((p) => [...p, dir]);
          }
        } else if (state === 'prompt') {
          setPendingFolders((p) => [...p, dir]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canPickDirectory, addFolderRoot]);

  /** Fallback open via the native Tauri dialog (no File System Access API). */
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
        onOpenFile({ name: node.name, path: node.path, markdown, handle: node.handle });
      } catch (err) {
        setError(String(err));
      }
    },
    [onOpenFile],
  );

  const hasContent = roots.length > 0;

  return (
    <nav
      ref={navRef}
      className="markdit-sidebar"
      aria-label={t('sidebar.title')}
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="markdit-sidebar-header">
        <strong>{t('sidebar.files')}</strong>
        <div className="markdit-sidebar-header-actions">
          {canPickDirectory && (
            <button type="button" onClick={openFolder} title={t('sidebar.openFolder')}>
              {t('sidebar.openFolder')}
            </button>
          )}
          {canPickFiles ? (
            <button type="button" onClick={openFiles} title={t('sidebar.openFiles')}>
              {t('sidebar.openFiles')}
            </button>
          ) : (
            !canPickDirectory &&
            isTauriAvailable() && (
              <button type="button" onClick={openSingleFile} title={t('action.open')}>
                {t('action.open')}
              </button>
            )
          )}
        </div>
      </div>

      {pendingFolders.map((dir) => (
        <button
          key={`pending:${dir.name}`}
          type="button"
          className="markdit-sidebar-reopen"
          onClick={() => reopenFolder(dir)}
        >
          {t('sidebar.reopen').replace('{name}', dir.name)}
        </button>
      ))}

      {hasContent ? (
        <div className="markdit-sidebar-body">
          <ul className="markdit-tree markdit-tree--roots" role="tree" aria-label={t('sidebar.files')}>
            {roots.map((root) => (
              <RootSection
                key={root.id}
                root={root}
                activePath={activePath}
                onSelect={handleSelect}
                onRemove={removeRoot}
              />
            ))}
          </ul>
        </div>
      ) : (
        <div className="markdit-sidebar-body">
          <p className="markdit-sidebar-empty">
            {canPickDirectory || canPickFiles ? t('sidebar.empty') : t('sidebar.unsupported')}
          </p>
        </div>
      )}

      {error && (
        <p className="markdit-sidebar-error" role="alert">
          {error}
        </p>
      )}

      <div
        className="markdit-sidebar-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label={t('sidebar.resize')}
        aria-valuenow={sidebarWidth}
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        tabIndex={0}
        onPointerDown={startResize}
        onKeyDown={onResizerKeyDown}
        onDoubleClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
        title={t('sidebar.resize')}
      />
    </nav>
  );
}
