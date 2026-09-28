import { apiRequest } from './client.ts';
import type { Review } from '../../../server/src/shared/types.ts';

export async function getPropertyReviews(propertyId: string): Promise<Review[]> {
  return await apiRequest<Review[]>(`/properties/${propertyId}/reviews`);
}

export async function createReview(
  propertyId: string,
  data: {
    bookingId: string;
    rating: number;
    comment: string;
  }
): Promise<Review> {
  return await apiRequest<Review>(`/properties/${propertyId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
