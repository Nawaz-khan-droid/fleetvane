import { toast } from 'sonner';

let onSessionExpired: (() => void) | null = null;
let authToken: string | null = null;

export function setOnSessionExpired(handler: (() => void) | null) {
  onSessionExpired = handler;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/signup', '/api/auth/refresh', '/api/auth/logout'];

export function triggerSessionExpired() {
  toast.error('Session expired. Please log in again.', { duration: 5000 });
  onSessionExpired?.();
}

export async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => url.includes(ep));
  
  const headers = new Headers(init?.headers);
  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  
  if (!headers.has('Content-Type') && init?.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && !isAuthEndpoint) {
    triggerSessionExpired();
  }
  return res;
}
