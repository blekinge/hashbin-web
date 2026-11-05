import { h } from "./dom.js";
import { currentUserEmail, isAuthenticated, logout, onAuthChange } from "./auth.js";

const NAV = [
  { href: "index.html", key: "stamp", label: "Stamp" },
  { href: "verify.html", key: "verify", label: "Verify" },
  { href: "explore.html", key: "explore", label: "Explore" },
  { href: "docs.html", key: "docs", label: "API Docs" },
];

function navClass(key: string, active: string): string {
  return `nav-link${key === active ? " active" : ""}`;
}

function buildHeader(active: string): HTMLElement {
  const links = NAV.map((n) => h("a", { href: n.href, class: navClass(n.key, active) }, n.label));

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
