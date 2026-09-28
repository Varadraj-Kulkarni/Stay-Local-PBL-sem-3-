import { apiRequest } from './client.ts';
import type { VerificationResult } from '../../../server/src/shared/types.ts';

export async function verifyPropertyLocation(
  propertyId: string,
  data: {
    photoAssetId: string;
    capturedLatitude: number;
    capturedLongitude: number;
    accuracyMeters?: number | undefined;
    capturedAt?: string | undefined;
    verificationMode: 'LIVE' | 'SIMULATED_AT_PROPERTY' | 'SIMULATED_AWAY';
  }
): Promise<VerificationResult> {
  return await apiRequest<VerificationResult>(`/properties/${propertyId}/verification`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
