import { API_BASE } from "./config.js";
import { authHeader } from "./auth.js";
async function request(path, init, withAuth) {
    const headers = {};
    if (init.body)
        headers["content-type"] = "application/json";
    if (withAuth)
        Object.assign(headers, authHeader());
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        const err = data;
        const message = err && typeof err.error === "string" ? err.error : `Request failed (${res.status})`;
        throw new Error(message);
    }
    return data;
}
export function stamp(body) {
    return request("/stamp", { method: "POST", body: JSON.stringify(body) }, true);
}
export function verify(hash) {
    return request(`/verify?hash=${encodeURIComponent(hash.toLowerCase())}`, {}, false);
}
export function explore(limit, offset) {
    return request(`/explore?limit=${limit}&offset=${offset}`, {}, false);
}
export function myTimestamps() {
    return request("/my-timestamps", {}, true);
}
