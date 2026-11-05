import { myTimestamps } from "../lib/api.js";
import { formatFileSize } from "../lib/hash.js";
import { isAuthenticated } from "../lib/auth.js";
import { h, mount } from "../lib/dom.js";
import { mountLayout } from "../lib/layout.js";
const listHost = h("div", { class: "stack" });
function card(r) {
    return h("div", { class: "card" }, h("p", { class: "break" }, h("code", {}, r.hash_sha256)), h("p", {}, h("span", { class: "muted" }, "Recorded: "), new Date(r.created_at).toLocaleString()), h("p", {}, h("span", { class: "muted" }, "File size: "), formatFileSize(r.file_size)), ...(r.file_name ? [h("p", {}, h("span", { class: "muted" }, "File name: "), r.file_name)] : []));
}
function render(rows) {
    if (rows.length === 0) {
        listHost.replaceChildren(h("p", { class: "muted" }, "No timestamps yet."));
        return;
    }
    listHost.replaceChildren(...rows.map(card));
}
async function load() {
    listHost.replaceChildren(h("p", { class: "muted" }, "Loading…"));
    try {
        render(await myTimestamps());
    }
    catch (e) {
        listHost.replaceChildren(h("p", { class: "err" }, e.message));
    }
}
mountLayout("my");
if (!isAuthenticated()) {
    location.replace("auth.html");
}
else {
    mount(h("div", { class: "page" }, h("h1", {}, "My Timestamps"), h("p", { class: "lede" }, "Files you have timestamped while signed in."), listHost));
    void load();
}
