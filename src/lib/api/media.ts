import { apiRequest, API_BASE_URL, getStoredToken } from './client.ts';

export interface UploadInitResponse {
  assetId: string;
  uploadUrl: string;
  expiresAt: string;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

export async function initUpload(data: {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<UploadInitResponse> {
  return await apiRequest<UploadInitResponse>('/uploads/init', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadFileBytes(uploadUrl: string, file: File | Blob): Promise<{ url: string; assetId: string }> {
  // If uploadUrl is relative, prepend API_BASE_URL host
  let fullUrl = uploadUrl;
  if (!uploadUrl.startsWith('http')) {
    const origin = API_BASE_URL.replace(/\/api\/v1$/, '');
    fullUrl = `${origin}${uploadUrl}`;
  }

  const headers: HeadersInit = {
    'Content-Type': file.type || 'image/jpeg',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(fullUrl, {
    method: 'PUT',
    headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  return await response.json();
}
