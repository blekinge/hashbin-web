function resolveApiBase() {
    const configured = typeof window !== "undefined" ? window.HASHBIN_CONFIG?.apiBase : undefined;
    const base = configured && configured.length > 0 ? configured : "/api";
    return base.replace(/\/+$/, ""); // strip trailing slash
}
export const API_BASE = resolveApiBase();
