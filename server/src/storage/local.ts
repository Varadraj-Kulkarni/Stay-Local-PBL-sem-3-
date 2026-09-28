import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface StorageProvider {
  saveFile(assetId: string, extension: string, buffer: Buffer): Promise<{ url: string; path: string }>;
  getFile(filePath: string): Promise<Buffer | null>;
  getPublicUrl(assetId: string, extension: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor(baseDir: string = './data/uploads', baseUrl: string = '/api/v1/media') {
    this.baseDir = baseDir;
    this.baseUrl = baseUrl;
    mkdirSync(this.baseDir, { recursive: true });
  }

  getPublicUrl(assetId: string, extension: string): string {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return `${this.baseUrl}/${assetId}${ext}`;
  }

  async saveFile(assetId: string, extension: string, buffer: Buffer): Promise<{ url: string; path: string }> {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    const filename = `${assetId}${ext}`;
    const filePath = join(this.baseDir, filename);

    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, buffer);

    return {
      url: this.getPublicUrl(assetId, extension),
      path: filePath,
    };
  }

  async getFile(filePath: string): Promise<Buffer | null> {
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath);
  }
}
