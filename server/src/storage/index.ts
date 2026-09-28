import type { StorageProvider } from './local.ts';
import { LocalStorageProvider } from './local.ts';

let storageInstance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (storageInstance) return storageInstance;

  const mode = process.env['STAYLOCAL_STORAGE_MODE'] || 'local';
  const baseDir = process.env['STAYLOCAL_UPLOADS_DIR'] || './data/uploads';
  const baseUrl = process.env['STAYLOCAL_STORAGE_BASE_URL'] || '/api/v1/media';

  storageInstance = new LocalStorageProvider(baseDir, baseUrl);
  return storageInstance;
}

export type { StorageProvider };
