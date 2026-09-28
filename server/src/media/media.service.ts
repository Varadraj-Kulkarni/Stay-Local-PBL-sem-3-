import { getDb } from '../db/index.ts';
import { getStorage } from '../storage/index.ts';
import { generateShortId } from '../shared/id.ts';
import { NotFoundError, ValidationError } from '../http/errors.ts';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class MediaService {
  async initUpload(input: { fileName: string; contentType: string; sizeBytes: number }): Promise<{
    assetId: string;
    uploadUrl: string;
    expiresAt: string;
    maxSizeBytes: number;
    allowedMimeTypes: string[];
  }> {
    if (!ALLOWED_MIME_TYPES.includes(input.contentType)) {
      throw new ValidationError(`Unsupported file type '${input.contentType}'. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    if (input.sizeBytes > MAX_FILE_SIZE) {
      throw new ValidationError(`File size ${input.sizeBytes} exceeds maximum allowed size of 10 MiB.`);
    }

    const assetId = generateShortId('asset');
    const db = await getDb();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    await db.run(
      `INSERT INTO uploads (asset_id, file_name, content_type, size_bytes, file_path, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [assetId, input.fileName, input.contentType, input.sizeBytes, '', now]
    );

    return {
      assetId,
      uploadUrl: `/api/v1/uploads/raw/${assetId}`,
      expiresAt,
      maxSizeBytes: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    };
  }

  async saveUploadedBytes(assetId: string, buffer: Buffer, contentType?: string): Promise<{ url: string; assetId: string }> {
    const db = await getDb();
    const upload = await db.get<any>('SELECT * FROM uploads WHERE asset_id = ?', [assetId]);

    const effectiveType = contentType || upload?.content_type || 'image/jpeg';
    let ext = '.jpg';
    if (effectiveType === 'image/png') ext = '.png';
    else if (effectiveType === 'image/webp') ext = '.webp';

    const storage = getStorage();
    const { url, path } = await storage.saveFile(assetId, ext, buffer);

    if (upload) {
      await db.run('UPDATE uploads SET file_path = ?, size_bytes = ? WHERE asset_id = ?', [path, buffer.length, assetId]);
    } else {
      const now = new Date().toISOString();
      await db.run(
        `INSERT INTO uploads (asset_id, file_name, content_type, size_bytes, file_path, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [assetId, `${assetId}${ext}`, effectiveType, buffer.length, path, now]
      );
    }

    return { url, assetId };
  }

  async getFile(filename: string): Promise<{ buffer: Buffer; contentType: string }> {
    const storage = getStorage();
    let ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';

    const path = `./data/uploads/${filename}`;
    const buffer = await storage.getFile(path);
    if (!buffer) {
      throw new NotFoundError(`Asset '${filename}' not found.`);
    }

    return { buffer, contentType };
  }
}
