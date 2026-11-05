import { API_BASE } from "./config.js";

// Email + password session for the Quarkus backend, independent of Supabase/Lovable.
// The backend issues its own HS256 JWT (POST /api/auth/login | /register). We persist
// it in localStorage and attach it as a bearer on /stamp (attribution) and
// /my-timestamps, /auth/me (required).

const TOKEN_KEY = "hashbin.token";
const EMAIL_KEY = "hashbin.email";
const EXP_KEY = "hashbin.exp"; // epoch millis

interface AuthResponse {
  token: string;
  token_type: string;
  expires_in: number; // seconds
  user_id: string;
  email: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of Array.from(listeners)) l();
}

/** Subscribe to login/logout. Returns an unsubscribe function. */
export function onAuthChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — session simply won't persist */
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(EXP_KEY);
  } catch {
    /* ignore */
  }
}

/** The bearer token, or null when signed out or expired. */
export function getToken(): string | null {
  const token = read(TOKEN_KEY);
  if (!token) return null;
  const exp = Number(read(EXP_KEY) || "0");
  if (exp && Date.now() >= exp) {
    clearSession();
    return null;
  }
  return token;
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function currentUserEmail(): string | null {
  return getToken() ? read(EMAIL_KEY) : null;
}

/** Authorization header for backend calls, or empty when anonymous. */
export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

async function postAuth(path: "login" | "register", email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = data as { error?: unknown } | null;
    const message = err && typeof err.error === "string" ? err.error : "Request failed";
    throw new Error(message);
  }
  const d = data as AuthResponse;
  write(TOKEN_KEY, d.token);
  write(EMAIL_KEY, d.email);
  write(EXP_KEY, String(Date.now() + (d.expires_in || 0) * 1000));
  emit();
}

export function login(email: string, password: string): Promise<void> {
  return postAuth("login", email, password);
}

export function register(email: string, password: string): Promise<void> {
  return postAuth("register", email, password);
}

export function logout(): void {
  clearSession();
  emit();
}
