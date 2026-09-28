import { getDb } from '../db/index.ts';
import { ValidationError, ConflictError } from '../http/errors.ts';
import type { RewardCoupon, User } from '../shared/types.ts';

export class RewardsService {
  async validateCoupon(couponCode: string, subtotal: number, currentUser: User): Promise<{
    valid: boolean;
    discount: number;
    couponCode: string;
    message?: string;
  }> {
    if (!couponCode) {
      throw new ValidationError('Coupon code is required.');
    }

    const db = await getDb();
    const coupon = await db.get<any>(
      `SELECT * FROM rewards WHERE code = ? AND user_id = ?`,
      [couponCode.trim(), currentUser.id]
    );

    if (!coupon) {
      throw new ValidationError(`Coupon '${couponCode}' not found or does not belong to you.`);
    }

    if (coupon.status !== 'AVAILABLE') {
      throw new ConflictError('COUPON_ALREADY_USED', `Coupon '${couponCode}' has already been redeemed.`);
    }

    const discount = Math.min(Number(coupon.amount || 100), Number(subtotal || 0));

    return {
      valid: true,
      discount,
      couponCode: coupon.code,
      message: `₹${discount} StayLocal discount applied successfully.`,
    };
  }

  async getUserRewards(currentUser: User): Promise<RewardCoupon[]> {
    const db = await getDb();
    const rows = await db.query<any>(
      `SELECT * FROM rewards WHERE user_id = ? ORDER BY created_at DESC`,
      [currentUser.id]
    );

    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      amount: Number(r.amount),
      currency: r.currency || 'INR',
      status: r.status as 'AVAILABLE' | 'REDEEMED' | 'EXPIRED',
      issuedForBookingId: r.issued_for_booking_id,
      expiresAt: r.expires_at || null,
      createdAt: r.created_at,
    }));
  }
}
