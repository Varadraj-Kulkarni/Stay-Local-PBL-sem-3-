import { apiRequest } from './client.ts';
import type { HostProfile, Property, PropertyStatus } from '../../../server/src/shared/types.ts';

export async function listAdminHosts(): Promise<HostProfile[]> {
  return await apiRequest<HostProfile[]>('/admin/hosts');
}

export async function updateAdminHostStatus(
  hostId: string,
  approvalStatus: 'APPROVED' | 'REJECTED',
  rejectionNote?: string
): Promise<HostProfile> {
  return await apiRequest<HostProfile>(`/admin/hosts/${hostId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ approvalStatus, rejectionNote }),
  });
}

export async function listAdminProperties(status?: string): Promise<Property[]> {
  const query = status ? `?status=${status}` : '';
  return await apiRequest<Property[]>(`/admin/properties${query}`);
}

export async function updateAdminPropertyStatus(
  propertyId: string,
  status: PropertyStatus
): Promise<Property> {
  return await apiRequest<Property>(`/admin/properties/${propertyId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
