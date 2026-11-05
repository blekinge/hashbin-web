import { API_BASE } from "./config.js";
import { authHeader } from "./auth.js";

// Response shapes mirror the backend's snake_case JSON.
export interface TimestampView {
  id: string;
  hash_sha256: string;
  hash_md5: string | null;
  hash_sha1: string | null;
  hash_sha512: string | null;
  file_size: number;
  file_name: string | null;
  created_at: string;
  server_signature: string;
  user_id: string | null;
}

export interface TimestampPublic {
  id: string;
  hash_sha256: string;
  hash_md5: string | null;
  hash_sha1: string | null;
  hash_sha512: string | null;
  file_size: number;
  created_at: string;
  server_signature: string;
}

export interface StampRequest {
  hash_sha256: string;
  hash_md5?: string;
  hash_sha1?: string;
  hash_sha512?: string;
  file_size: number;
  file_name?: string;
}

async function request<T>(path: string, init: RequestInit, withAuth: boolean): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.body) headers["content-type"] = "application/json";
  if (withAuth) Object.assign(headers, authHeader());

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = data as { error?: unknown } | null;
    const message = err && typeof err.error === "string" ? err.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export function stamp(body: StampRequest): Promise<TimestampView> {
  return request<TimestampView>("/stamp", { method: "POST", body: JSON.stringify(body) }, true);
}

export function verify(hash: string): Promise<TimestampPublic[]> {
  return request<TimestampPublic[]>(`/verify?hash=${encodeURIComponent(hash.toLowerCase())}`, {}, false);
}

export function explore(limit: number, offset: number): Promise<TimestampPublic[]> {
  return request<TimestampPublic[]>(`/explore?limit=${limit}&offset=${offset}`, {}, false);
}

export function myTimestamps(): Promise<TimestampView[]> {
  return request<TimestampView[]>("/my-timestamps", {}, true);
}
