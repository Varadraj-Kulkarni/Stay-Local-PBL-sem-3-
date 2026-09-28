import { apiRequest } from './client.ts';
import type { RewardCoupon } from '../../../server/src/shared/types.ts';

export async function validateCoupon(
  couponCode: string,
  subtotal: number
): Promise<{
  valid: boolean;
  discount: number;
  couponCode: string;
  message?: string;
}> {
  return await apiRequest('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ couponCode, subtotal }),
  });
}

export async function getRewards(): Promise<RewardCoupon[]> {
  return await apiRequest<RewardCoupon[]>('/rewards');
}
