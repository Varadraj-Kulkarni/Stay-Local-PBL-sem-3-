import { getDb } from '../db/index.ts';
import {
  calculateHaversineDistanceMeters,
  VERIFICATION_THRESHOLD_METERS,
  VERIFICATION_DISCLAIMER,
} from '../shared/haversine.ts';
import { ForbiddenError, NotFoundError, ValidationError } from '../http/errors.ts';
import { generateShortId } from '../shared/id.ts';
import type { VerificationResult, User } from '../shared/types.ts';

export interface VerificationInput {
  photoAssetId: string;
  capturedLatitude: number;
  capturedLongitude: number;
  accuracyMeters?: number;
  capturedAt?: string;
  verificationMode: 'LIVE' | 'SIMULATED_AT_PROPERTY' | 'SIMULATED_AWAY';
}

export class VerificationService {
  async verifyProperty(propertyId: string, input: VerificationInput, currentUser: User): Promise<VerificationResult> {
    const db = await getDb();
    const prop = await db.get<any>(
      `SELECT p.*, h.user_id as host_user_id FROM properties p
       JOIN host_profiles h ON h.id = p.host_id
       WHERE p.id = ?`,
      [propertyId]
    );

    if (!prop) {
      throw new NotFoundError(`Property '${propertyId}' not found.`);
    }

    if (currentUser.role !== 'ADMIN' && currentUser.id !== prop.host_user_id) {
      throw new ForbiddenError('Only the property owner or admin can verify property location.');
    }

    if (!input.photoAssetId) {
      throw new ValidationError('A captured room photo asset ID is required.');
    }

    const env = process.env['STAYLOCAL_ENV'] || 'development';
    const allowSim = process.env['STAYLOCAL_ALLOW_SIMULATION'] !== 'false' && env !== 'production';

    let distanceMeters: number;
    let effectiveLat = input.capturedLatitude;
    let effectiveLon = input.capturedLongitude;

    if (input.verificationMode === 'SIMULATED_AT_PROPERTY') {
      if (!allowSim) {
        throw new ForbiddenError('Simulation mode is disabled in production.');
      }
      distanceMeters = 15; // simulated 15m away (within 50m threshold)
      effectiveLat = Number(prop.latitude);
      effectiveLon = Number(prop.longitude);
    } else if (input.verificationMode === 'SIMULATED_AWAY') {
      if (!allowSim) {
        throw new ForbiddenError('Simulation mode is disabled in production.');
      }
      distanceMeters = 2000; // simulated 2000m away (exceeds 50m threshold)
    } else {
      // LIVE verification using authorative Haversine formula
      if (input.capturedLatitude === undefined || input.capturedLongitude === undefined) {
        throw new ValidationError('GPS coordinates (capturedLatitude, capturedLongitude) are required for live verification.');
      }
      distanceMeters = calculateHaversineDistanceMeters(
        Number(prop.latitude),
        Number(prop.longitude),
        input.capturedLatitude,
        input.capturedLongitude
      );
    }

    const isVerified = distanceMeters <= VERIFICATION_THRESHOLD_METERS;
    const now = new Date().toISOString();

    const result: VerificationResult = {
      status: isVerified ? 'VERIFIED' : 'REJECTED',
      distanceMeters,
      thresholdMeters: VERIFICATION_THRESHOLD_METERS,
      verifiedAt: now,
      photoAssetId: input.photoAssetId,
      capturedLatitude: effectiveLat,
      capturedLongitude: effectiveLon,
      accuracyMeters: input.accuracyMeters,
      verificationMode: input.verificationMode,
      disclaimer: VERIFICATION_DISCLAIMER,
    };

    // Update property location_verified state and verification JSON
    await db.run(
      `UPDATE properties
       SET location_verified = ?, verification_json = ?, updated_at = ?
       WHERE id = ?`,
      [isVerified ? 1 : 0, JSON.stringify(result), now, propertyId]
    );

    // Save as verification photo record
    const photoId = generateShortId('photo');
    await db.run(
      `INSERT INTO property_photos (id, property_id, asset_id, asset_url, caption, is_verification_photo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [photoId, propertyId, input.photoAssetId, `/api/v1/media/${input.photoAssetId}.jpg`, 'Camera Verification Photo', 1, now]
    );

    return result;
  }
}
