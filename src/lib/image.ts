/**
 * Image helpers shared by the editor (insert / paste / drop) and the reader
 * (local image resolution). Images inserted through the editor are embedded as
 * self-contained base64 data URIs so the Markdown stays portable and nothing
 * leaves the device (Principle III). Images referenced by a relative path in an
 * opened file are resolved on-device from the file's folder.
 */

import { isDesktopShell, readImageDataUrl } from './desktop';

/** True when a dropped/pasted file is a raster/vector image we can embed. */
export function isImageFile(file: File): boolean {
  return /^image\//i.test(file.type);
}

/** Extract image files from a clipboard/drag `DataTransfer`. */
export function imageFilesFrom(data: DataTransfer | null): File[] {
  if (!data) return [];
  const files: File[] = [];
  for (const item of Array.from(data.files)) {
    if (isImageFile(item)) files.push(item);
  }
  // Some sources expose the image only through `items` (e.g. copied bitmaps).
  if (files.length === 0 && data.items) {
    for (const item of Array.from(data.items)) {
      if (item.kind === 'file' && /^image\//i.test(item.type)) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
  }
  return files;
}

/** Read an image blob into a base64 data URL. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

/**
 * True when an image `src` must be resolved locally: a relative or absolute
 * filesystem reference rather than something the webview can already load
 * (remote URL, data/blob URI, or a non-file protocol).
 */
export function isLocalImageSrc(src: string | undefined): boolean {
  if (!src) return false;
  if (/^(data:|blob:)/i.test(src)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(src)) return false; // any scheme (http:, https:, mailto:, file:, …)
  return true;
}

/**
 * Resolve a relative image `src` against a browser directory handle, returning a
 * blob URL the reader can display. Returns null when the path escapes the folder
 * (`..`), the file is missing, or the File System Access API is unavailable.
 */
export async function resolveViaDirHandle(
  dir: FileSystemDirectoryHandle,
  src: string,
): Promise<string | null> {
  try {
    const clean = decodeURI(src).replace(/^\.\//, '').split(/[?#]/)[0];
    const segments = clean.split('/').filter((s) => s.length > 0);
    if (segments.length === 0 || segments.includes('..')) return null;
    let current = dir;
    for (const segment of segments.slice(0, -1)) {
      current = await current.getDirectoryHandle(segment);
    }
    const fileHandle = await current.getFileHandle(segments[segments.length - 1]!);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

/**
 * Resolve a relative/absolute image `src` for a document opened by native path
 * (Windows file association), via the desktop core. Returns a base64 data URL,
 * or null in the web build / on failure.
 */
export async function resolveViaPath(docPath: string, src: string): Promise<string | null> {
  if (!isDesktopShell()) return null;
  try {
    const clean = decodeURI(src).split(/[?#]/)[0];
    return await readImageDataUrl(docPath, clean);
  } catch {
    return null;
  }
}
