// Self-hosted API client for https://gbps.reddevils.co.in
// Replaces Supabase + Google OAuth with Email OTP sessions.

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || '';

const TOKEN_KEY = 'gbps_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

function url(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_BASE}${path}`;
}

async function request(path: string, method: string, body?: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string })?.error || 'Request failed');
  return data;
}

export const apiGet = (path: string) => request(path, 'GET');
export const apiSend = (path: string, method: string, body?: unknown) =>
  request(path, method, body);

// --- Email OTP auth ---

export interface OtpUser {
  id: number;
  email: string;
  name: string;
}

export async function requestOtp(email: string, name?: string) {
  return request('/api/auth/request-otp', 'POST', { email, name }) as Promise<{
    ok: boolean;
    dev_otp?: string;
  }>;
}

export async function verifyOtp(email: string, otp: string) {
  const data = (await request('/api/auth/verify-otp', 'POST', { email, otp })) as {
    token: string;
    user: OtpUser;
  };
  setToken(data.token);
  return data;
}

export async function fetchMe() {
  return request('/api/auth/me', 'GET') as Promise<{
    user: OtpUser;
    profile: Record<string, unknown> | null;
  }>;
}

export function signOutLocal() {
  setToken(null);
}
