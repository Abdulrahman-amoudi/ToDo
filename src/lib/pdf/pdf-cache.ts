/**
 * IndexedDB Local PDF Cache
 * 
 * Caches PDF file Blobs in browser IndexedDB so previously opened PDFs
 * load in <50ms without re-downloading large multi-megabyte files over the network.
 */

const DB_NAME = 'bloub_pdf_cache_db';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_blobs';

interface CachedPdfRecord {
  url: string;
  blob: Blob;
  updatedAt: number;
}

function openPdfDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves a cached PDF Blob by URL, or null if not in cache.
 */
export async function getCachedPdfBlob(url: string): Promise<Blob | null> {
  try {
    const db = await openPdfDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        const record = request.result as CachedPdfRecord | undefined;
        if (record && record.blob) {
          resolve(record.blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Saves a PDF Blob to IndexedDB cache.
 */
export async function cachePdfBlob(url: string, blob: Blob): Promise<void> {
  try {
    const db = await openPdfDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: CachedPdfRecord = {
        url,
        blob,
        updatedAt: Date.now(),
      };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[PdfCache] Failed to cache PDF in IndexedDB:', err);
  }
}

/**
 * Clears expired or all cached PDFs.
 */
export async function clearPdfCache(): Promise<void> {
  try {
    const db = await openPdfDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('[PdfCache] Failed to clear PDF cache:', err);
  }
}
