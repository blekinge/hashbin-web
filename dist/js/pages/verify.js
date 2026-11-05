import { verify } from "../lib/api.js";
import { formatFileSize, hashFileAll } from "../lib/hash.js";
import { h, mount } from "../lib/dom.js";
import { mountLayout } from "../lib/layout.js";
function detect(hash) {
    if (/^[a-f0-9]{32}$/.test(hash))
        return "MD5";
    if (/^[a-f0-9]{40}$/.test(hash))
        return "SHA-1";
    if (/^[a-f0-9]{64}$/.test(hash))
        return "SHA-256";
    if (/^[a-f0-9]{128}$/.test(hash))
        return "SHA-512";
    return null;
}
const initialHash = (new URLSearchParams(location.search).get("hash") ?? "").toLowerCase();
const input = h("input", { type: "text", class: "mono grow", placeholder: "Paste any hash (MD5, SHA-1, SHA-256, SHA-512)…", value: initialHash });
const hint = h("p", { class: "muted small" }, "");
const resultsHost = h("div", { class: "stack" });
function hashRow(label, value) {
    return value ? h("p", { class: "hash" }, h("span", { class: "alg" }, label), h("code", {}, value)) : null;
}
function resultCard(r) {
    return h("div", { class: "card" }, h("p", {}, h("span", { class: "muted" }, "Recorded: "), new Date(r.created_at).toLocaleString()), h("p", {}, h("span", { class: "muted" }, "File size: "), formatFileSize(r.file_size)), h("div", { class: "hashes" }, hashRow("SHA-256", r.hash_sha256), hashRow("SHA-512", r.hash_sha512), hashRow("SHA-1", r.hash_sha1), hashRow("MD5", r.hash_md5)), h("p", { class: "small" }, h("span", { class: "muted" }, "Signature: "), h("code", { class: "sig" }, r.server_signature)));
}
async function runSearch(rawHash) {
    const hash = rawHash.trim().toLowerCase();
    if (!hash)
        return;
    hint.textContent = "";
    resultsHost.replaceChildren(h("p", { class: "muted" }, "Searching…"));
    try {
        const rows = await verify(hash);
        if (rows.length === 0) {
            resultsHost.replaceChildren(h("p", { class: "muted" }, "No timestamps found."));
        }
        else {
            const copyBtn = h("button", {
                class: "btn btn-ghost",
                type: "button",
                onclick: () => {
                    void navigator.clipboard?.writeText(`${location.origin}${location.pathname}?hash=${hash}`);
                    copyBtn.textContent = "Copied!";
                },
            }, "Copy shareable link");
            resultsHost.replaceChildren(copyBtn, ...rows.map(resultCard));
        }
    }
    catch (e) {
        resultsHost.replaceChildren(h("p", { class: "err" }, e.message));
    }
    finally {
        hint.textContent = detect(hash) ? `Detected: ${detect(hash)}` : "";
    }
}
function inputArea() {
    const button = h("button", { class: "btn", type: "button", onclick: () => void runSearch(input.value) }, "Search");
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
            void runSearch(input.value);
    });
    input.addEventListener("input", () => {
        const d = detect(input.value.trim().toLowerCase());
        hint.textContent = d ? `Detected: ${d}` : "";
    });
    const file = h("input", {
        type: "file",
        class: "hidden",
        onchange: async (e) => {
            const f = e.target.files?.[0];
            if (!f)
                return;
            hint.textContent = "Hashing…";
            try {
                const { sha256 } = await hashFileAll(f);
                input.value = sha256;
                await runSearch(sha256);
            }
            catch {
                hint.textContent = "Failed to hash file";
            }
        },
    });
    const fileLabel = h("label", { class: "btn btn-ghost" }, "Or verify a file", file);
    return h("div", { class: "space" }, h("div", { class: "row" }, input, button), hint, fileLabel);
}
mountLayout("verify");
mount(h("div", { class: "page" }, h("h1", {}, "Verify a timestamp"), h("p", { class: "lede" }, "Look up when a file was first timestamped. Supports MD5, SHA-1, SHA-256, and SHA-512."), inputArea(), resultsHost));
if (initialHash && detect(initialHash))
    void runSearch(initialHash);
