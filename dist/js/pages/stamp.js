import { stamp } from "../lib/api.js";
import { formatFileSize, hashFileAll } from "../lib/hash.js";
import { h, mount } from "../lib/dom.js";
import { mountLayout } from "../lib/layout.js";
const entries = [];
let includeFileName = false;
const listHost = h("div", { class: "stack" });
function hashRow(label, value) {
    return value ? h("p", { class: "hash" }, h("span", { class: "alg" }, label), h("code", {}, value)) : null;
}
function card(entry) {
    let action;
    if (entry.result) {
        action = h("p", { class: "ok" }, `✓ Timestamped ${new Date(entry.result.created_at).toLocaleString()} `, h("code", { class: "sig" }, entry.result.server_signature));
    }
    else if (entry.error) {
        action = h("p", { class: "err" }, entry.error);
    }
    else if (entry.hashing) {
        action = h("p", { class: "muted" }, "Hashing…");
    }
    else if (entry.hashes) {
        action = h("button", { class: "btn", type: "button", disabled: entry.submitting, onclick: () => stampEntry(entry) }, entry.submitting ? "Creating…" : "Create timestamp");
    }
    else {
        action = h("span");
    }
    return h("div", { class: "card" }, h("div", { class: "card-top" }, h("span", { class: "fname" }, entry.file.name), h("span", { class: "muted small" }, formatFileSize(entry.file.size))), h("div", { class: "hashes" }, hashRow("SHA-256", entry.hashes?.sha256 ?? null), hashRow("SHA-512", entry.hashes?.sha512 ?? null), hashRow("SHA-1", entry.hashes?.sha1 ?? null), hashRow("MD5", entry.hashes?.md5 ?? null)), action);
}
function renderList() {
    const pending = entries.filter((e) => e.hashes && !e.result && !e.error);
    const includeRow = h("label", { class: "checkbox" }, h("input", { type: "checkbox", checked: includeFileName, onchange: (e) => (includeFileName = e.target.checked) }), h("span", {}, "Include file names"));
    listHost.replaceChildren(...(entries.length ? [includeRow] : []), ...entries.map(card), ...(pending.length > 1 ? [h("button", { class: "btn", type: "button", onclick: stampAll }, `Stamp all (${pending.length})`)] : []));
}
function stampAll() {
    entries.filter((e) => e.hashes && !e.result && !e.error).forEach(stampEntry);
}
function stampEntry(entry) {
    if (!entry.hashes)
        return;
    entry.submitting = true;
    renderList();
    const body = {
        hash_sha256: entry.hashes.sha256,
        hash_md5: entry.hashes.md5,
        hash_sha1: entry.hashes.sha1,
        hash_sha512: entry.hashes.sha512,
        file_size: entry.file.size,
    };
    if (includeFileName)
        body.file_name = entry.file.name;
    stamp(body)
        .then((res) => (entry.result = res))
        .catch((e) => (entry.error = e.message))
        .finally(() => {
        entry.submitting = false;
        renderList();
    });
}
async function addFiles(files) {
    const fresh = files.map((file) => ({ file, hashes: null, hashing: true, submitting: false, result: null, error: null }));
    entries.push(...fresh);
    renderList();
    for (const entry of fresh) {
        try {
            entry.hashes = await hashFileAll(entry.file);
        }
        catch {
            entry.error = "Failed to hash";
        }
        entry.hashing = false;
        renderList();
    }
}
function dropZone() {
    const input = h("input", {
        type: "file",
        multiple: true,
        class: "hidden",
        onchange: (e) => {
            const el = e.target;
            const files = Array.from(el.files ?? []);
            if (files.length)
                void addFiles(files);
            el.value = "";
        },
    });
    const zone = h("label", { class: "drop" }, h("span", { class: "muted" }, "Drag & drop files here, or click to select"), input);
    zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("over"));
    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("over");
        const files = e instanceof DragEvent && e.dataTransfer ? Array.from(e.dataTransfer.files) : [];
        if (files.length)
            void addFiles(files);
    });
    return zone;
}
mountLayout("stamp");
mount(h("div", { class: "page" }, h("h1", {}, "Timestamp files"), h("p", { class: "lede" }, "Hash files locally (MD5, SHA-1, SHA-256, SHA-512), then store signed timestamps. Files never leave your browser."), dropZone(), listHost));
renderList();
