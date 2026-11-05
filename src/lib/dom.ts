// Tiny DOM builder to keep the page modules dependency-free and readable.

type AttrValue = string | number | boolean | ((event: Event) => void) | null | undefined;
type Attrs = Record<string, AttrValue>;
type Child = Node | string | null | undefined;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs,
  ...children: Child[]
): HTMLElementTagNameMap[K];
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  ...children: Child[]
): HTMLElementTagNameMap[K];
export function h(tag: keyof HTMLElementTagNameMap, ...rest: unknown[]): HTMLElement {
  const el = document.createElement(tag);
  let children = rest as Child[];

  if (rest.length && isAttrs(rest[0])) {
    const attrs = rest[0];
    children = rest.slice(1) as Child[];
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key.startsWith("on") && typeof value === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
      } else if (key === "class") {
        el.className = String(value);
      } else if (typeof value === "boolean") {
        if (value) el.setAttribute(key, "");
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }

  for (const child of children) {
    if (child != null) el.append(child);
  }
  return el;
}

function isAttrs(value: unknown): value is Attrs {
  return typeof value === "object" && value !== null && !(value instanceof Node);
}

/** Replace the contents of the page's #app container. */
export function mount(...children: Child[]): HTMLElement {
  const app = document.getElementById("app");
  if (!app) throw new Error("missing #app container");
  app.replaceChildren(...children.filter((c): c is Node | string => c != null));
  return app;
}
