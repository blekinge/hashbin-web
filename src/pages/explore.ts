import { explore } from "../lib/api.js";
import type { TimestampPublic } from "../lib/api.js";
import { formatFileSize } from "../lib/hash.js";
import { h, mount } from "../lib/dom.js";
import { mountLayout } from "../lib/layout.js";

const PAGE_SIZE = 20;
let page = 0;
let hasMore = false;
let filter = "";

const listHost = h("div", { class: "stack" });
const pageLabel = h("span", { class: "muted small" }, "");
const prevBtn = h("button", { class: "btn btn-ghost", type: "button" }, "← Previous");
const nextBtn = h("button", { class: "btn btn-ghost", type: "button" }, "Next →");
const filterInput = h("input", {
  type: "search",
  class: "mono",
  placeholder: "Filter by hash prefix…",
  oninput: (e: Event) => {
    filter = (e.target as HTMLInputElement).value;
    void load();
  },
});

function renderList(rows: TimestampPublic[]): void {
  const s = filter.trim().toLowerCase();
  const shown = s
    ? rows.filter((r) => [r.hash_sha256, r.hash_md5, r.hash_sha1, r.hash_sha512].some((v) => v != null && v.toLowerCase().startsWith(s)))
    : rows;

  pageLabel.textContent = `Page ${page + 1}`;
  prevBtn.disabled = page === 0;
  nextBtn.disabled = !hasMore;

  if (shown.length === 0) {
    listHost.replaceChildren(h("p", { class: "muted" }, "No timestamps found."));
    return;
  }
  listHost.replaceChildren(
    ...shown.map((r) =>
      h(
        "a",
        { class: "card row-card", href: `verify.html?hash=${r.hash_sha256}` },
        h("div", { class: "card-top" }, h("code", { class: "grow break" }, r.hash_sha256), h("span", { class: "muted small" }, formatFileSize(r.file_size))),
        h("p", { class: "muted small" }, new Date(r.created_at).toLocaleString()),
      ),
    ),
  );
}

async function load(): Promise<void> {
  listHost.replaceChildren(h("p", { class: "muted" }, "Loading…"));
  try {
    const data = await explore(PAGE_SIZE + 1, page * PAGE_SIZE);
    hasMore = data.length > PAGE_SIZE;
    renderList(data.slice(0, PAGE_SIZE));
  } catch (e) {
    listHost.replaceChildren(h("p", { class: "err" }, (e as Error).message));
  }
}

prevBtn.addEventListener("click", () => {
  if (page > 0) {
    page -= 1;
    void load();
  }
});
nextBtn.addEventListener("click", () => {
  if (hasMore) {
    page += 1;
    void load();
  }
});

mountLayout("explore");
mount(
  h(
    "div",
    { class: "page" },
    h("h1", {}, "Explore timestamps"),
    h("p", { class: "lede" }, "Browse recent public timestamps. All records are anonymized."),
    filterInput,
    listHost,
    h("div", { class: "pager" }, prevBtn, pageLabel, nextBtn),
  ),
);
void load();
