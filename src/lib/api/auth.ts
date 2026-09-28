import { apiRequest, setStoredToken } from './client.ts';
import type { User, AppRole } from '../../../server/src/shared/types.ts';

export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: User;
}

export async function register(data: {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  role: 'TOURIST' | 'HOST';
}): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setStoredToken(res.accessToken);
  return res;
}

export async function login(data: { email: string; password: string }): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setStoredToken(res.accessToken);
  return res;
}

export async function getMe(): Promise<User> {
  return await apiRequest<User>('/auth/me');
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  } finally {
    setStoredToken(null);
  }
}
