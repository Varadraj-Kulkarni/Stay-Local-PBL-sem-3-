import { apiRequest } from './client.ts';
import type { Property, PropertyPhoto } from '../../../server/src/shared/types.ts';

export interface PropertyFilterParams {
  destinationId?: string | undefined;
  search?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  locationVerified?: boolean | string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export async function getProperties(params: PropertyFilterParams = {}): Promise<{
  items: Property[];
  total: number;
  page: number;
  limit: number;
}> {
  const q = new URLSearchParams();
  if (params.destinationId) q.set('destinationId', params.destinationId);
  if (params.search) q.set('search', params.search);
  if (params.minPrice !== undefined) q.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) q.set('maxPrice', String(params.maxPrice));
  if (params.locationVerified !== undefined) q.set('locationVerified', String(params.locationVerified));
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));

  const queryStr = q.toString() ? `?${q.toString()}` : '';
  return await apiRequest(`/properties${queryStr}`);
}

export async function getPropertyById(propertyId: string): Promise<Property> {
  return await apiRequest<Property>(`/properties/${propertyId}`);
}

export async function createProperty(data: {
  destinationId: string;
  title: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  amenities: string[];
  photos?: string[];
  latitude: number;
  longitude: number;
}): Promise<Property> {
  return await apiRequest<Property>('/properties', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProperty(
  propertyId: string,
  data: Partial<Property>
): Promise<Property> {
  return await apiRequest<Property>(`/properties/${propertyId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function attachPropertyPhoto(
  propertyId: string,
  photo: {
    assetId: string;
    assetUrl: string;
    caption?: string;
    isVerificationPhoto?: boolean;
  }
): Promise<PropertyPhoto> {
  return await apiRequest<PropertyPhoto>(`/properties/${propertyId}/photos`, {
    method: 'POST',
    body: JSON.stringify(photo),
  });
}
