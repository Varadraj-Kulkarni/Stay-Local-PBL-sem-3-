export class ApiError extends Error {
  public code: string;
  public statusCode: number;
  public requestId?: string | undefined;
  public details?: Record<string, unknown> | undefined;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    requestId?: string | undefined,
    details?: Record<string, unknown> | undefined
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

const TOKEN_KEY = 'staylocal_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export const API_BASE_URL =
  ((import.meta.env['VITE_API_BASE_URL'] as string) || 'http://localhost:8787').replace(/\/$/, '') + '/api/v1';

export async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const code = data?.code || (response.status === 404 ? 'NOT_FOUND' : 'API_ERROR');
    const message = data?.message || response.statusText || 'An error occurred';
    const requestId = data?.requestId;
    const details = data?.details;
    throw new ApiError(response.status, code, message, requestId, details);
  }

  return data as T;
}
