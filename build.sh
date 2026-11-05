#!/usr/bin/env bash
#
# One-command frontend build that needs NO pre-installed toolchain.
#
# It runs the pinned Node version from .nvmrc: uses a compatible `node` already on
# PATH, otherwise downloads that exact version into .tools/ (git-ignored). Then it
# installs the pinned dev dependency (typescript) and builds dist/.
#
# You build, you don't deploy a committed artifact: `dist/` is git-ignored build output (like
# Java's `target/`). Run this (or `npm run build`) to (re)generate `dist/` locally — e.g. to serve
# the UI from the backend's same-origin `web` profile, to preview with `npm run serve`, or to
# inspect the compiled bundle. CI rebuilds `dist/` from source inside the image, so it doesn't
# use this script.
set -euo pipefail
cd "$(dirname "$0")"

NODE_VERSION="$(tr -d '[:space:]' < .nvmrc)"
TOOLS="$PWD/.tools"

have_good_node() {
  command -v node >/dev/null 2>&1 &&
    node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 20 ? 0 : 1)' 2>/dev/null
}

ensure_node() {
  if have_good_node; then return; fi
  local os arch plat dir url
  case "$(uname -s)" in Linux) plat=linux ;; Darwin) plat=darwin ;; *) echo "Unsupported OS: $(uname -s)" >&2; exit 1 ;; esac
  case "$(uname -m)" in x86_64|amd64) arch=x64 ;; arm64|aarch64) arch=arm64 ;; *) echo "Unsupported arch: $(uname -m)" >&2; exit 1 ;; esac
  dir="node-v${NODE_VERSION}-${plat}-${arch}"
  url="https://nodejs.org/dist/v${NODE_VERSION}/${dir}.tar.xz"
  if [ ! -x "$TOOLS/$dir/bin/node" ]; then
    mkdir -p "$TOOLS"
    echo ">> No compatible Node found; downloading pinned v${NODE_VERSION} into .tools/ ..."
    curl -fsSL "$url" -o "$TOOLS/$dir.tar.xz"
    tar -xf "$TOOLS/$dir.tar.xz" -C "$TOOLS"
    rm -f "$TOOLS/$dir.tar.xz"
  fi
  PATH="$TOOLS/$dir/bin:$PATH"
  export PATH
}

ensure_node
echo ">> Using Node $(node --version), npm $(npm --version)"

if [ ! -x node_modules/.bin/tsc ]; then
  echo ">> Installing pinned dev dependencies (typescript) ..."
  npm install --no-fund --no-audit
fi

npm run build
echo ">> Done. dist/ is ready — it is build output (git-ignored), not committed. Serve it, or run quarkus:dev for same-origin."
