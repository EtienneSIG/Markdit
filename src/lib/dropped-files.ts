import type { FileNode } from '../components/sidebar/FileExplorer';

/** The Entries API is read-only; retained Files allow browsing until reload. */
export async function readDroppedEntry(
  entry: FileSystemEntry,
  path = entry.name,
): Promise<FileNode | null> {
  if (entry.isFile) {
    if (!/\.(md|markdown|mdown|mkd)$/i.test(entry.name)) return null;
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject),
    );
    return { kind: 'file', name: entry.name, path, file };
  }
  if (!entry.isDirectory) return null;
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const children: FileNode[] = [];
  // Directory readers return batches, not necessarily all entries at once.
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject),
    );
    if (batch.length === 0) break;
    for (const child of batch) {
      const node = await readDroppedEntry(child, `${path}/${child.name}`);
      if (node) children.push(node);
    }
  }
  children.sort((a, b) =>
    a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1,
  );
  return children.length ? { kind: 'directory', name: entry.name, path, children } : null;
}

export interface DropSource {
  handle?: Promise<FileSystemHandle | null>;
  entry: FileSystemEntry | null;
  file: File | null;
}

/** Capture handles and entries synchronously while the drop event is active. */
export function captureDrop(transfer: DataTransfer): DropSource[] {
  const items = Array.from(transfer.items).filter((item) => item.kind === 'file');
  if (items.length === 0) {
    return Array.from(transfer.files, (file) => ({ entry: null, file }));
  }
  return items.map((item) => {
    const source = item as DataTransferItem & {
      getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>;
    };
    return {
      handle: source.getAsFileSystemHandle?.(),
      entry: source.webkitGetAsEntry?.() ?? null,
      file: source.getAsFile(),
    };
  });
}
