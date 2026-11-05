import { h } from "./dom.js";
import { currentUserEmail, isAuthenticated, logout, onAuthChange } from "./auth.js";

const NAV = [
  { href: "index.html", key: "stamp", label: "Stamp" },
  { href: "verify.html", key: "verify", label: "Verify" },
  { href: "explore.html", key: "explore", label: "Explore" },
  { href: "docs.html", key: "docs", label: "API Docs" },
];

const REPO_URL = "https://github.com/blekinge/hashbin-web";

// GitHub "mark" octicon, inlined so the project stays dependency-free (no icon font / asset).
const GITHUB_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">' +
  '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>' +
  "</svg>";

function navClass(key: string, active: string): string {
  return `nav-link${key === active ? " active" : ""}`;
}

function buildHeader(active: string): HTMLElement {
  const links = NAV.map((n) => h("a", { href: n.href, class: navClass(n.key, active) }, n.label));
  const repo = h("a", {
    href: REPO_URL,
    class: "nav-link nav-icon",
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": "Source code on GitHub",
    title: "Source code on GitHub",
  });
  repo.innerHTML = GITHUB_ICON;
  links.push(repo);

  const right = isAuthenticated()
    ? [
        h("a", { href: "my.html", class: navClass("my", active) }, "My Timestamps"),
        h("span", { class: "nav-email" }, currentUserEmail() ?? ""),
        h("button", { class: "btn btn-ghost", type: "button", onclick: () => logout() }, "Sign out"),
      ]
    : [h("a", { href: "auth.html", class: "btn btn-ghost" }, "Sign in")];

  return h(
    "div",
    { class: "wrap header-inner" },
    h("a", { class: "brand", href: "index.html" }, h("strong", {}, "hashbin"), h("span", { class: "muted" }, ".net")),
    h("nav", { class: "nav" }, ...links, ...right),
  );
}

/** Mount the shared header into #site-header and keep it in sync with auth state. */
export function mountLayout(active: string): void {
  const header = document.getElementById("site-header");
  if (!header) return;
  const render = (): void => header.replaceChildren(buildHeader(active));
  render();
  onAuthChange(render);
}
