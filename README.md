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

The build output in `dist/` is **pure static files** — host it on any static host, or copy it
behind a reverse proxy that also serves the API. Like a Java `target/`, `dist/` is **build output
and is not tracked in git** — you generate it with a build (see "Toolchain").

## Toolchain

Building needs only `tsc`, fully pinned and self-contained. `dist/` is a build artifact
(like Java's `target/`) and is **not committed** — generate it whenever you need it:

- **Build the site:** `npm install && npm run build` → `dist/` (tsc → `dist/js`, then
  `copy-static.mjs` copies `public/` → `dist/`). Serve `dist/` on any static host, setting
  `apiBase` in `dist/config.js` to match wherever the API is reachable from there.
- **No toolchain? Use `./build.sh`.** It downloads the exact Node pinned in `.nvmrc` into
  git-ignored `.tools/` (unless a compatible one is already on `PATH`), installs the pinned
  `typescript`, and emits `dist/`.
- **CI builds the image from source.** Jenkins runs `Dockerfile.ci` (a Node stage compiles
  `src/` + `public/` into `dist/`, nginx serves it) and pushes to the org Harbor — so the
  published image is built fresh and never depends on a local `dist/`. See "CI (Jenkins)" below.

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

**Same-origin (recommended).** If the backend repo `../hashbin-quarkus` is present, its
build auto-detects this app's `dist/` (once you've built it) and serves it from the same
origin — so there is no CORS and `config.js` can stay at its default `apiBase: "/api"`.

```bash
# terminal 1 — build this app (src -> dist/js, then copy public -> dist)
npm install && npm run build      # use `npm run watch` to recompile on edits

# terminal 2 — backend; also serves the UI at http://localhost:8080/
cd ../hashbin-quarkus && mvn quarkus:dev
```

After editing frontend sources, re-run `npm run build`, then restart `quarkus:dev` to
re-copy `dist/` onto the classpath. (Same-origin serving is a file-activated Maven
profile; disable it there with `-P '!web'`.)

**Separate origins (alternative).** To serve this app on its own port against the API on
:8080, set `apiBase: "http://localhost:8080/api"` in `public/config.js`, rebuild, then:

```bash
npm run watch      # tsc --watch -> dist/js
npm run serve      # zero-dep static server -> http://localhost:5173/
```

The backend's CORS already allows this, so it also works without the same-origin setup.

## Build & deploy

```bash
npm install
npm run build          # tsc → dist/js, then copy public/* → dist/
```

Deploy the contents of `dist/` to any static host. Set `apiBase` in `dist/config.js` to
match wherever the API is reachable from that host.

## CI (Jenkins)

CI is a self-contained pipeline at [`ci/Jenkinsfile`](ci/Jenkinsfile) — **no GitHub Actions**.
It runs in a Kubernetes pod with a `docker:dind-rootless` container that builds the image and
pushes it to the org **Harbor** (`harbor.tools.nyx.kb.dk/<BITBUCKET_PROJECT_KEY>/hashbin-web:
<version>-<branch>-sha.<sha>-build.<n>`), using the `jenkins-harbor` credential. Same shape as
the `hashbin-quarkus` pipeline, minus the JDK/test stage.

The image is built **from source** by [`Dockerfile.ci`](Dockerfile.ci): a pinned
`node:22.23.4-alpine` stage runs `npm ci` + `npm run build` (tsc → `dist/js`, then
`copy-static.mjs` copies `public/` → `dist/`), and a `nginxinc/nginx-unprivileged` stage serves
`dist/` on port 8080. Because CI compiles from `src/`, nothing in the pipeline depends on a
committed `dist/` (there is none — `dist/` is git-ignored build output).

`Dockerfile.ci` is the single image recipe: Jenkins builds it, and manual/offline builds use the
same file — `DOCKER_BUILDKIT=1 docker build --target final -f Dockerfile.ci .`.

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
Dockerfile.ci             # single image recipe (CI + manual): builds dist/ from source (node → nginx)
ci/Jenkinsfile            # Jenkins: docker build Dockerfile.ci → push to Harbor
```

## License

Released under the **Apache License, Version 2.0** — see [LICENSE](LICENSE).
Copyright 2025 Hashbin Contributors. This matches the licensing already used in the
sibling [`hashbin-time-vault`](../hashbin-time-vault) repo.
