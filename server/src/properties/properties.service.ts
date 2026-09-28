import { getDb } from '../db/index.ts';
import { generateShortId } from '../shared/id.ts';
import { NotFoundError, ForbiddenError, ValidationError } from '../http/errors.ts';
import type { Property, PropertyStatus, User } from '../shared/types.ts';

export interface PropertyFilter {
  destinationId?: string | undefined;
  search?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  locationVerified?: boolean | string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface CreatePropertyInput {
  destinationId: string;
  title: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  amenities: string[];
  photos?: string[];
  latitude: number;
  longitude: number;
}

export interface UpdatePropertyInput {
  title?: string;
  description?: string;
  pricePerNight?: number;
  maxGuests?: number;
  amenities?: string[];
  photos?: string[];
  latitude?: number;
  longitude?: number;
  status?: PropertyStatus;
}

function parseJson<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val as T;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

export class PropertiesService {
  async search(filters: PropertyFilter): Promise<{ items: Property[]; total: number; page: number; limit: number }> {
    const db = await getDb();
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.max(1, Math.min(100, Number(filters.limit || 20)));
    const offset = (page - 1) * limit;

    const conditions: string[] = ["p.status = 'APPROVED'"];
    const params: any[] = [];

    if (filters.destinationId) {
      conditions.push('p.destination_id = ?');
      params.push(filters.destinationId);
    }

    if (filters.search) {
      conditions.push('(p.title LIKE ? OR p.description LIKE ? OR d.name LIKE ?)');
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
      conditions.push('p.price_per_night >= ?');
      params.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
      conditions.push('p.price_per_night <= ?');
      params.push(filters.maxPrice);
    }

    if (filters.locationVerified !== undefined) {
      const isVerified = String(filters.locationVerified) === 'true';
      conditions.push('p.location_verified = ?');
      params.push(isVerified ? 1 : 0);
    }

    const whereClause = conditions.join(' AND ');

    const countRow = await db.get<any>(
      `SELECT COUNT(*) as count FROM properties p
       JOIN destinations d ON d.id = p.destination_id
       WHERE ${whereClause}`,
      params
    );
    const total = Number(countRow?.count || 0);

    const rows = await db.query<any>(
      `SELECT p.*, d.name as destination_name, h.display_name as host_name
       FROM properties p
       JOIN destinations d ON d.id = p.destination_id
       JOIN host_profiles h ON h.id = p.host_id
       WHERE ${whereClause}
       ORDER BY p.rating DESC, p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const items = rows.map((r) => this.mapRow(r));
    return { items, total, page, limit };
  }

  async getById(propertyId: string, currentUser?: User): Promise<Property> {
    const db = await getDb();
    const r = await db.get<any>(
      `SELECT p.*, d.name as destination_name, h.display_name as host_name, h.user_id as host_user_id
       FROM properties p
       JOIN destinations d ON d.id = p.destination_id
       JOIN host_profiles h ON h.id = p.host_id
       WHERE p.id = ?`,
      [propertyId]
    );

    if (!r) {
      throw new NotFoundError(`Property '${propertyId}' not found.`);
    }

    // Only owner host or admin can see non-approved properties
    if (r.status !== 'APPROVED') {
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.id !== r.host_user_id)) {
        throw new NotFoundError(`Property '${propertyId}' not found or not published.`);
      }
    }

    return this.mapRow(r);
  }

  async create(input: CreatePropertyInput, currentUser: User): Promise<Property> {
    if (currentUser.role !== 'HOST' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Only hosts can list properties.');
    }

    if (!input.title || input.title.trim().length < 3) {
      throw new ValidationError('Property title must be at least 3 characters.');
    }
    if (!input.destinationId) {
      throw new ValidationError('A valid destination ID is required.');
    }
    if (!input.pricePerNight || input.pricePerNight <= 0) {
      throw new ValidationError('Price per night must be greater than zero.');
    }

    const db = await getDb();
    const hostProfile = await db.get<any>('SELECT id FROM host_profiles WHERE user_id = ?', [currentUser.id]);
    if (!hostProfile) {
      throw new ForbiddenError('Host profile not found. Please complete host setup first.');
    }

    const dest = await db.get<any>('SELECT id, name FROM destinations WHERE id = ?', [input.destinationId]);
    if (!dest) {
      throw new ValidationError(`Destination '${input.destinationId}' does not exist.`);
    }

    const id = generateShortId('prop');
    const now = new Date().toISOString();
    const amenitiesJson = JSON.stringify(input.amenities || []);
    const photosJson = JSON.stringify(input.photos || ['/images/hero.jpg']);

    await db.run(
      `INSERT INTO properties (id, host_id, destination_id, title, description, price_per_night, max_guests, amenities, photos, latitude, longitude, status, location_verified, verification_json, rating, review_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        hostProfile.id,
        input.destinationId,
        input.title.trim(),
        input.description || '',
        input.pricePerNight,
        input.maxGuests || 2,
        amenitiesJson,
        photosJson,
        input.latitude,
        input.longitude,
        'PENDING',
        0,
        null,
        0,
        0,
        now,
        now,
      ]
    );

    return this.getById(id, currentUser);
  }

  async update(propertyId: string, input: UpdatePropertyInput, currentUser: User): Promise<Property> {
    const db = await getDb();
    const existing = await db.get<any>(
      `SELECT p.*, h.user_id as host_user_id FROM properties p
       JOIN host_profiles h ON h.id = p.host_id
       WHERE p.id = ?`,
      [propertyId]
    );

    if (!existing) {
      throw new NotFoundError(`Property '${propertyId}' not found.`);
    }

    if (currentUser.role !== 'ADMIN' && currentUser.id !== existing.host_user_id) {
      throw new ForbiddenError('You can only update properties that you own.');
    }

    const now = new Date().toISOString();
    let newStatus = existing.status;

    // Invariant: Material edits move listing status to PENDING
    const isMaterialEdit =
      input.title !== undefined ||
      input.description !== undefined ||
      input.pricePerNight !== undefined ||
      input.maxGuests !== undefined ||
      input.amenities !== undefined ||
      input.latitude !== undefined ||
      input.longitude !== undefined;

    if (isMaterialEdit && currentUser.role !== 'ADMIN') {
      newStatus = 'PENDING';
    } else if (input.status) {
      newStatus = input.status;
    }

    const title = input.title !== undefined ? input.title.trim() : existing.title;
    const description = input.description !== undefined ? input.description : existing.description;
    const pricePerNight = input.pricePerNight !== undefined ? input.pricePerNight : existing.price_per_night;
    const maxGuests = input.maxGuests !== undefined ? input.maxGuests : existing.max_guests;
    const amenities = input.amenities !== undefined ? JSON.stringify(input.amenities) : existing.amenities;
    const photos = input.photos !== undefined ? JSON.stringify(input.photos) : existing.photos;
    const latitude = input.latitude !== undefined ? input.latitude : existing.latitude;
    const longitude = input.longitude !== undefined ? input.longitude : existing.longitude;

    await db.run(
      `UPDATE properties
       SET title = ?, description = ?, price_per_night = ?, max_guests = ?, amenities = ?, photos = ?, latitude = ?, longitude = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [title, description, pricePerNight, maxGuests, amenities, photos, latitude, longitude, newStatus, now, propertyId]
    );

    return this.getById(propertyId, currentUser);
  }

  async attachPhoto(propertyId: string, photo: { assetId: string; assetUrl: string; caption?: string; isVerificationPhoto?: boolean }, currentUser: User) {
    const db = await getDb();
    const prop = await this.getById(propertyId, currentUser);
    const photoId = generateShortId('photo');
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO property_photos (id, property_id, asset_id, asset_url, caption, is_verification_photo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [photoId, propertyId, photo.assetId, photo.assetUrl, photo.caption || null, photo.isVerificationPhoto ? 1 : 0, now]
    );

    // Also append to photos array if not present
    const currentPhotos = prop.photos || [];
    if (!currentPhotos.includes(photo.assetUrl)) {
      currentPhotos.push(photo.assetUrl);
      await db.run('UPDATE properties SET photos = ? WHERE id = ?', [JSON.stringify(currentPhotos), propertyId]);
    }

    return {
      id: photoId,
      propertyId,
      assetId: photo.assetId,
      assetUrl: photo.assetUrl,
      caption: photo.caption || null,
      isVerificationPhoto: !!photo.isVerificationPhoto,
      createdAt: now,
    };
  }

  async getHostProperties(userId: string): Promise<Property[]> {
    const db = await getDb();
    const rows = await db.query<any>(
      `SELECT p.*, d.name as destination_name, h.display_name as host_name
       FROM properties p
       JOIN destinations d ON d.id = p.destination_id
       JOIN host_profiles h ON h.id = p.host_id
       WHERE h.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(r: any): Property {
    return {
      id: r.id,
      hostId: r.host_id,
      destinationId: r.destination_id,
      title: r.title,
      description: r.description,
      pricePerNight: Number(r.price_per_night),
      maxGuests: Number(r.max_guests),
      amenities: parseJson<string[]>(r.amenities, []),
      photos: parseJson<string[]>(r.photos, []),
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      status: r.status as PropertyStatus,
      locationVerified: Boolean(r.location_verified),
      verification: parseJson(r.verification_json, null),
      rating: Number(r.rating || 0),
      reviewCount: Number(r.review_count || 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      hostName: r.host_name,
      destinationName: r.destination_name,
    };
  }
}
