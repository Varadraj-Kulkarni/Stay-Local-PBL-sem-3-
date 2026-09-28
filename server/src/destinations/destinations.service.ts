import { getDb } from '../db/index.ts';
import { NotFoundError } from '../http/errors.ts';
import type { Destination } from '../shared/types.ts';

export class DestinationsService {
  async getAll(): Promise<Destination[]> {
    const db = await getDb();
    const rows = await db.query<any>('SELECT * FROM destinations ORDER BY name ASC');
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      tagline: r.tagline,
      description: r.description,
      imageUrl: r.image_url,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
    }));
  }

  async getById(destinationId: string): Promise<Destination> {
    const db = await getDb();
    const r = await db.get<any>('SELECT * FROM destinations WHERE id = ?', [destinationId]);
    if (!r) {
      throw new NotFoundError(`Destination '${destinationId}' not found.`);
    }
    return {
      id: r.id,
      name: r.name,
      tagline: r.tagline,
      description: r.description,
      imageUrl: r.image_url,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
    };
  }
}
