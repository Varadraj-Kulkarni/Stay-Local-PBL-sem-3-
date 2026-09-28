import { apiRequest } from './client.ts';
import type { Destination } from '../../../server/src/shared/types.ts';

export async function getDestinations(): Promise<Destination[]> {
  return await apiRequest<Destination[]>('/destinations');
}

export async function getDestinationById(destinationId: string): Promise<Destination> {
  return await apiRequest<Destination>(`/destinations/${destinationId}`);
}
