/**
 * Persists the last opened folder so the user doesn't have to re-pick it every
 * session. Browser `FileSystemDirectoryHandle`s are structured-cloneable, so we
 * stash the handle itself in IndexedDB (localStorage can't hold it). Nothing
 * leaves the device — only an opaque handle reference is stored (Principle III).
 *
 * On restore the handle's permission must be re-checked: the browser may report
 * `granted` (read immediately), `prompt` (needs a user gesture to re-grant), or
 * `denied`.
 */

const DB_NAME = 'markdit';
const STORE_NAME = 'handles';
const LAST_FOLDER_KEY = 'lastFolder';

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

/** Remember the most recently opened directory handle. */
export async function saveLastFolder(handle: FileSystemDirectoryHandle): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await runRequest(tx.objectStore(STORE_NAME).put(handle, LAST_FOLDER_KEY));
    db.close();
  } catch {
    // Persistence is best-effort; ignore storage failures (e.g. private mode).
  }
}

/** Retrieve the last opened directory handle, or null if none/unavailable. */
export async function loadLastFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!isIndexedDbAvailable()) return null;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const handle = await runRequest(tx.objectStore(STORE_NAME).get(LAST_FOLDER_KEY));
    db.close();
    if (handle && (handle as FileSystemHandle).kind === 'directory') {
      return handle as FileSystemDirectoryHandle;
    }
    return null;
  } catch {
    return null;
  }
}

/** Forget the remembered folder (e.g. after permission is permanently denied). */
export async function clearLastFolder(): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await runRequest(tx.objectStore(STORE_NAME).delete(LAST_FOLDER_KEY));
    db.close();
  } catch {
    // Ignore.
  }
}

/**
 * Write text back to a file handle (File System Access API). Re-requests
 * readwrite permission if needed (must be called from a user gesture). Nothing
 * leaves the device — the file is written in place (Principle III). Returns
 * false when permission is refused or the API is unavailable.
 */
export async function writeFileHandle(
  handle: FileSystemFileHandle,
  text: string,
): Promise<boolean> {
  if (typeof handle.createWritable !== 'function') return false;
  const granted =
    (await handle.requestPermission?.({ mode: 'readwrite' })) ?? 'granted';
  if (granted !== 'granted') return false;
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
  return true;
}
