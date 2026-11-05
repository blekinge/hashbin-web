// Runtime configuration for the static frontend.
//
// apiBase is where the app reaches the hashbin API. It is read by js/lib/config.js.
//   - Same-origin (default): serve the frontend and proxy "/api" to the Quarkus
//     backend, so this can stay "/api".
//   - Local development: point it at the dev server, e.g.
//       apiBase: "http://localhost:8080/api"
window.HASHBIN_CONFIG = {
  apiBase: "/api",
};
