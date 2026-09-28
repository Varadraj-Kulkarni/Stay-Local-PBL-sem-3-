import { getDb } from '../db/index.ts';
import { NotFoundError, ValidationError } from '../http/errors.ts';
import type { HostProfile, Property, PropertyStatus } from '../shared/types.ts';

export class AdminService {
  async listHosts(): Promise<HostProfile[]> {
    const db = await getDb();
    const rows = await db.query<any>('SELECT * FROM host_profiles ORDER BY created_at DESC');
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      displayName: r.display_name,
      bio: r.bio || null,
      approvalStatus: r.approval_status as 'PENDING' | 'APPROVED' | 'REJECTED',
      verifiedAt: r.verified_at || null,
      rejectionNote: r.rejection_note || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async updateHostStatus(hostId: string, approvalStatus: 'APPROVED' | 'REJECTED', rejectionNote?: string): Promise<HostProfile> {
    if (!['APPROVED', 'REJECTED'].includes(approvalStatus)) {
      throw new ValidationError('Invalid approvalStatus. Must be APPROVED or REJECTED.');
    }

    const db = await getDb();
    const existing = await db.get<any>('SELECT * FROM host_profiles WHERE id = ?', [hostId]);
    if (!existing) {
      throw new NotFoundError(`Host profile '${hostId}' not found.`);
    }

    const now = new Date().toISOString();
    const verifiedAt = approvalStatus === 'APPROVED' ? now : null;

    await db.run(
      `UPDATE host_profiles
       SET approval_status = ?, verified_at = ?, rejection_note = ?, updated_at = ?
       WHERE id = ?`,
      [approvalStatus, verifiedAt, rejectionNote || null, now, hostId]
    );

    return {
      id: existing.id,
      userId: existing.user_id,
      displayName: existing.display_name,
      bio: existing.bio || null,
      approvalStatus,
      verifiedAt,
      rejectionNote: rejectionNote || null,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }

  async listProperties(status?: string): Promise<Property[]> {
    const db = await getDb();
    let query = `
      SELECT p.*, d.name as destination_name, h.display_name as host_name
      FROM properties p
      JOIN destinations d ON d.id = p.destination_id
      JOIN host_profiles h ON h.id = p.host_id
    `;
    const params: any[] = [];

    if (status) {
      query += ` WHERE p.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC`;
    const rows = await db.query<any>(query, params);

    return rows.map((r) => ({
      id: r.id,
      hostId: r.host_id,
      destinationId: r.destination_id,
      title: r.title,
      description: r.description,
      pricePerNight: Number(r.price_per_night),
      maxGuests: Number(r.max_guests),
      amenities: JSON.parse(r.amenities || '[]'),
      photos: JSON.parse(r.photos || '[]'),
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      status: r.status as PropertyStatus,
      locationVerified: Boolean(r.location_verified),
      verification: r.verification_json ? JSON.parse(r.verification_json) : null,
      rating: Number(r.rating || 0),
      reviewCount: Number(r.review_count || 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      hostName: r.host_name,
      destinationName: r.destination_name,
    }));
  }

  async updatePropertyStatus(propertyId: string, status: PropertyStatus): Promise<Property> {
    if (!['APPROVED', 'REJECTED', 'INACTIVE'].includes(status)) {
      throw new ValidationError('Invalid property status. Must be APPROVED, REJECTED, or INACTIVE.');
    }

    const db = await getDb();
    const existing = await db.get<any>(
      `SELECT p.*, d.name as destination_name, h.display_name as host_name
       FROM properties p
       JOIN destinations d ON d.id = p.destination_id
       JOIN host_profiles h ON h.id = p.host_id
       WHERE p.id = ?`,
      [propertyId]
    );

    if (!existing) {
      throw new NotFoundError(`Property '${propertyId}' not found.`);
    }

    const now = new Date().toISOString();
    await db.run(`UPDATE properties SET status = ?, updated_at = ? WHERE id = ?`, [status, now, propertyId]);

    return {
      id: existing.id,
      hostId: existing.host_id,
      destinationId: existing.destination_id,
      title: existing.title,
      description: existing.description,
      pricePerNight: Number(existing.price_per_night),
      maxGuests: Number(existing.max_guests),
      amenities: JSON.parse(existing.amenities || '[]'),
      photos: JSON.parse(existing.photos || '[]'),
      latitude: Number(existing.latitude),
      longitude: Number(existing.longitude),
      status,
      locationVerified: Boolean(existing.location_verified),
      verification: existing.verification_json ? JSON.parse(existing.verification_json) : null,
      rating: Number(existing.rating || 0),
      reviewCount: Number(existing.review_count || 0),
      createdAt: existing.created_at,
      updatedAt: now,
      hostName: existing.host_name,
      destinationName: existing.destination_name,
    };
  }
}
