import { toast } from 'sonner';

let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(handler: (() => void) | null) {
  onSessionExpired = handler;
}

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/signup', '/api/auth/refresh', '/api/auth/logout'];

export function triggerSessionExpired() {
  toast.error('Session expired. Please log in again.', { duration: 5000 });
  onSessionExpired?.();
}

export async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => url.includes(ep));
  const res = await fetch(url, init);
  if (res.status === 401 && !isAuthEndpoint) {
    triggerSessionExpired();
  }
  return res;
}
