// Resolves the API base URL at runtime.
//
// The frontend is fully static, so it needs to learn where the backend lives at
// deploy time. That comes from a tiny classic script `public/config.js` that sets
// `window.HASHBIN_CONFIG.apiBase`. Default is same-origin "/api" (frontend and
// backend behind one host). For local dev against Quarkus on :8080, set apiBase to
// "http://localhost:8080/api" in config.js.
declare global {
  interface Window {
    HASHBIN_CONFIG?: { apiBase?: string };
  }
}

function resolveApiBase(): string {
  const configured = typeof window !== "undefined" ? window.HASHBIN_CONFIG?.apiBase : undefined;
  const base = configured && configured.length > 0 ? configured : "/api";
  return base.replace(/\/+$/, ""); // strip trailing slash
}

export const API_BASE: string = resolveApiBase();
