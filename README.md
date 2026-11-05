# hashbin-web

A small, **dependency-free static frontend** for the [hashbin-quarkus](../hashbin-quarkus)
trusted file-timestamping backend. It is a clean-room replacement for the original
Lovable/Supabase React app: plain HTML + TypeScript, no framework, no Supabase, no
Lovable. Files are hashed entirely in the browser; only the digests are sent.

## Stack

- Vanilla **TypeScript** compiled with `tsc` to native browser ES modules — no bundler,
  no React/Vite, no runtime dependencies. `typescript` is the only dev dependency.
- Multi-page static site (one `.html` per view) with a tiny shared DOM/layout module.
- Web Crypto (`crypto.subtle`) for SHA-1/256/512; a pure-JS MD5 (SubtleCrypto has none).

The build output in `dist/` is **pure static files** — host it on any static host, or
copy it behind a reverse proxy that also serves the API. It is committed, so you can
deploy without running a build.

## Pages

| File | Route | Notes |
|---|---|---|
| `index.html`  | Stamp         | Hash dropped files (4 algos) client-side, `POST /api/stamp`, show signature |
| `verify.html` | Verify        | `GET /api/verify`; paste a hash or pick a file; reads `?hash=` deep links |
| `explore.html`| Explore       | `GET /api/explore` newest-first, client-side prefix filter, prev/next paging |
| `my.html`     | My Timestamps | `GET /api/my-timestamps` (bearer); redirects to `auth.html` if signed out |
| `auth.html`   | Sign in/up    | `POST /api/auth/login` / `/api/auth/register`; stores the HS256 JWT in localStorage |
| `docs.html`   | API Docs      | Reads `GET /api/openapi.json`; links to Swagger UI at `<api-origin>/q/swagger-ui` |

## Configuring the API base

The app learns where the backend lives from `public/config.js` (copied to `dist/config.js`):

```js
window.HASHBIN_CONFIG = { apiBase: "/api" }; // same-origin (behind one host/proxy)
```

For local development against the Quarkus dev server, set it to
`"http://localhost:8080/api"`.

## Local development

Requires the backend running and Node only for the TypeScript compiler.

```bash
# terminal 1 — backend (see ../hashbin-quarkus); on :8080, CORS allows the dev origin
mvn quarkus:dev

# terminal 2 — build JS (set config.js apiBase to http://localhost:8080/api first)
npm install
npm run watch          # tsc --watch → dist/js
# then serve dist/ statically and open http://localhost:5173/
npm run serve
```

## Build & deploy

```bash
npm install
npm run build          # tsc → dist/js, then copy public/* → dist/
```

Deploy the contents of `dist/` to any static host. Set `apiBase` in `dist/config.js` to
match wherever the API is reachable from that host.

## Layout

```
src/lib/config.ts   # resolve API base from window.HASHBIN_CONFIG (default /api)
src/lib/api.ts      # typed fetch helpers: stamp / verify / explore / myTimestamps
src/lib/auth.ts     # localStorage HS256-JWT session: login/register/logout + bearer
src/lib/hash.ts     # MD5 (pure JS) + SHA via SubtleCrypto, formatFileSize
src/lib/dom.ts      # h() element builder + mount()
src/lib/layout.ts   # shared header/nav (auth-aware) mounted into #site-header
src/pages/*.ts      # one entry module per HTML page
public/*.html       # the six static pages
public/config.js    # runtime API base
public/styles.css   # single hand-written stylesheet (dark-mode aware)
scripts/copy-static.mjs   # build: copy public/ → dist/
scripts/serve.mjs         # zero-dep static server for local preview
```
