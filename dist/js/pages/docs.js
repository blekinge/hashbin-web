import { API_BASE } from "../lib/config.js";
import { h, mount } from "../lib/dom.js";
import { mountLayout } from "../lib/layout.js";
// Derive the API host from API_BASE so we can link to the backend's Swagger UI
// (served under /q, alongside the /api application root).
function apiOrigin() {
    try {
        return new URL(API_BASE, location.href).origin;
    }
    catch {
        return location.origin;
    }
}
const infoHost = h("div", { class: "card" }, h("p", { class: "muted" }, "Loading API info…"));
function linkList() {
    const swaggerUrl = `${apiOrigin()}/q/swagger-ui`;
    const jsonUrl = `${API_BASE}/openapi.json`;
    return h("ul", { class: "links" }, h("li", {}, h("a", { href: swaggerUrl, target: "_blank", rel: "noopener noreferrer" }, "Interactive API docs (Swagger UI)")), h("li", {}, h("a", { href: jsonUrl, target: "_blank", rel: "noopener noreferrer" }, "OpenAPI JSON (", h("code", {}, jsonUrl), ")")));
}
async function load() {
    try {
        const res = await fetch(`${API_BASE}/openapi.json`);
        if (!res.ok)
            throw new Error(`Request failed (${res.status})`);
        const doc = (await res.json());
        const info = doc.info ?? {};
        infoHost.replaceChildren(h("p", {}, h("strong", {}, info.title ?? "Hashbin API"), info.version ? h("span", { class: "muted" }, ` v${info.version}`) : ""), info.description ? h("p", { class: "muted" }, info.description) : "");
    }
    catch (e) {
        infoHost.replaceChildren(h("p", { class: "err" }, `Could not reach the API spec: ${e.message}`));
    }
}
mountLayout("docs");
mount(h("div", { class: "page" }, h("h1", {}, "API Docs"), h("p", { class: "lede" }, "The backend publishes an OpenAPI 3 document. Explore it interactively or read the raw spec."), infoHost, linkList()));
void load();
