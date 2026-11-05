// Tiny DOM builder to keep the page modules dependency-free and readable.
export function h(tag, ...rest) {
    const el = document.createElement(tag);
    let children = rest;
    if (rest.length && isAttrs(rest[0])) {
        const attrs = rest[0];
        children = rest.slice(1);
        for (const [key, value] of Object.entries(attrs)) {
            if (value == null || value === false)
                continue;
            if (key.startsWith("on") && typeof value === "function") {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            }
            else if (key === "class") {
                el.className = String(value);
            }
            else if (typeof value === "boolean") {
                if (value)
                    el.setAttribute(key, "");
            }
            else {
                el.setAttribute(key, String(value));
            }
        }
    }
    for (const child of children) {
        if (child != null)
            el.append(child);
    }
    return el;
}
function isAttrs(value) {
    return typeof value === "object" && value !== null && !(value instanceof Node);
}
/** Replace the contents of the page's #app container. */
export function mount(...children) {
    const app = document.getElementById("app");
    if (!app)
        throw new Error("missing #app container");
    app.replaceChildren(...children.filter((c) => c != null));
    return app;
}
