/**
 * Recently-opened items (files and folders), capped at the ten most recent, so
 * the File menu can offer one-click reopen. Metadata (name, kind, path, time)
 * lives in IndexedDB alongside the structured-cloneable `FileSystemHandle`s that
 * back browser-opened items. Desktop (file-association) items keep only an
 * absolute path and are reopened through the Tauri core. Nothing leaves the
 * device — only opaque handle references and local paths are stored
 * (Principle III).
 */

const DB_NAME = 'markdit';
const STORE_NAME = 'handles';
const META_KEY = 'recentItems';
const HANDLE_PREFIX = 'recent:';
const MAX_RECENT = 10;

export interface RecentItem {
  /** Stable id; also the IndexedDB key of the backing handle, if any. */
  id: string;
  name: string;
  kind: 'file' | 'folder';
  /** Absolute OS path (desktop) or display path (browser tree), when known. */
  path?: string;
  openedAt: number;
}

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Identity used to de-duplicate: same kind + same target reopens the entry. */
function keyOf(item: Pick<RecentItem, 'kind' | 'name' | 'path'>): string {
  return `${item.kind}:${item.path ?? item.name}`;
}

async function readMeta(db: IDBDatabase): Promise<RecentItem[]> {
  const tx = db.transaction(STORE_NAME, 'readonly');
  const stored = await runRequest(tx.objectStore(STORE_NAME).get(META_KEY));
  return Array.isArray(stored) ? (stored as RecentItem[]) : [];
}

/** The recent items, newest first. Empty when unavailable. */
export async function loadRecent(): Promise<RecentItem[]> {
  if (!isIndexedDbAvailable()) return [];
  try {
    const db = await openDb();
    const items = await readMeta(db);
    db.close();
    return [...items].sort((a, b) => b.openedAt - a.openedAt).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

/**
 * Record an opened item. Any existing entry for the same target is replaced and
 * moved to the top; the list is trimmed to the ten most recent, deleting the
 * backing handles of anything that falls off.
 */
export async function addRecent(
  entry: { name: string; kind: 'file' | 'folder'; path?: string },
  handle?: FileSystemHandle,
): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  try {
    const db = await openDb();
    const existing = await readMeta(db);
    const key = keyOf(entry);
    const superseded = existing.filter((i) => keyOf(i) === key);
    const kept = existing.filter((i) => keyOf(i) !== key);

    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item: RecentItem = {
      id,
      name: entry.name,
      kind: entry.kind,
      path: entry.path,
      openedAt: Date.now(),
    };

    const next = [item, ...kept].sort((a, b) => b.openedAt - a.openedAt);
    const trimmed = next.slice(0, MAX_RECENT);
    const dropped = next.slice(MAX_RECENT);

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await runRequest(store.put(trimmed, META_KEY));
    if (handle) await runRequest(store.put(handle, `${HANDLE_PREFIX}${id}`));
    for (const gone of [...superseded, ...dropped]) {
      await runRequest(store.delete(`${HANDLE_PREFIX}${gone.id}`));
    }
    db.close();
  } catch {
    // Best-effort; ignore storage failures (e.g. private mode).
  }
}

/** The stored handle backing a recent item, or undefined for path-only items. */
export async function getRecentHandle(id: string): Promise<FileSystemHandle | undefined> {
  if (!isIndexedDbAvailable()) return undefined;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const handle = await runRequest(tx.objectStore(STORE_NAME).get(`${HANDLE_PREFIX}${id}`));
    db.close();
    return (handle as FileSystemHandle | undefined) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Forget all recent items and their backing handles. */
export async function clearRecent(): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  try {
    const db = await openDb();
    const items = await readMeta(db);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await runRequest(store.delete(META_KEY));
    for (const item of items) {
      await runRequest(store.delete(`${HANDLE_PREFIX}${item.id}`));
    }
    db.close();
  } catch {
    // Ignore.
  }
}
