import { getDb } from '../db/index.ts';
import { generateShortId } from '../shared/id.ts';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../http/errors.ts';
import type { Review, User } from '../shared/types.ts';

export interface CreateReviewInput {
  bookingId: string;
  rating: number;
  comment: string;
}

export class ReviewsService {
  async getReviewsForProperty(propertyId: string): Promise<Review[]> {
    const db = await getDb();
    const rows = await db.query<any>(
      `SELECT r.*, u.full_name as tourist_name
       FROM reviews r
       JOIN users u ON u.id = r.tourist_id
       WHERE r.property_id = ?
       ORDER BY r.created_at DESC`,
      [propertyId]
    );

    return rows.map((r) => ({
      id: r.id,
      propertyId: r.property_id,
      touristId: r.tourist_id,
      touristName: r.tourist_name || 'Verified Guest',
      bookingId: r.booking_id,
      rating: Number(r.rating),
      comment: r.comment,
      createdAt: r.created_at,
    }));
  }

  async createReview(propertyId: string, input: CreateReviewInput, currentUser: User): Promise<Review> {
    if (currentUser.role !== 'TOURIST' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Only guests who stayed can submit reviews.');
    }

    if (!input.rating || input.rating < 1 || input.rating > 5) {
      throw new ValidationError('Rating must be an integer between 1 and 5.');
    }

    if (!input.comment || input.comment.trim().length < 5) {
      throw new ValidationError('Comment must be at least 5 characters.');
    }

    const db = await getDb();

    // Verify booking
    const booking = await db.get<any>(
      `SELECT * FROM bookings WHERE id = ? AND property_id = ?`,
      [input.bookingId, propertyId]
    );

    if (!booking) {
      throw new NotFoundError('Booking record not found for this property.');
    }

    if (currentUser.role !== 'ADMIN' && booking.tourist_id !== currentUser.id) {
      throw new ForbiddenError('You can only review bookings made by your account.');
    }

    // Check duplicate review
    const existing = await db.get<any>(`SELECT id FROM reviews WHERE booking_id = ?`, [input.bookingId]);
    if (existing) {
      throw new ConflictError('DUPLICATE_REVIEW', 'A review has already been submitted for this booking.');
    }

    const reviewId = generateShortId('rev');
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO reviews (id, property_id, tourist_id, booking_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, propertyId, currentUser.id, input.bookingId, Math.round(input.rating), input.comment.trim(), now]
    );

    // Recalculate property average rating and review_count
    const stats = await db.get<any>(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE property_id = ?`,
      [propertyId]
    );

    const avg = stats?.avg_rating ? Number(Number(stats.avg_rating).toFixed(1)) : input.rating;
    const count = Number(stats?.count || 1);

    await db.run(
      `UPDATE properties SET rating = ?, review_count = ? WHERE id = ?`,
      [avg, count, propertyId]
    );

    return {
      id: reviewId,
      propertyId,
      touristId: currentUser.id,
      touristName: currentUser.fullName,
      bookingId: input.bookingId,
      rating: Math.round(input.rating),
      comment: input.comment.trim(),
      createdAt: now,
    };
  }
}
