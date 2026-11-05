# Static frontend served by nginx (non-root, port 8080). The build output in dist/ is
# committed, so this Dockerfile needs no Node — it only copies files. Build context is
# this repo root:  docker build -t ghcr.io/blekinge/hashbin-web:<tag> .
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 dist/ /usr/share/nginx/html/
EXPOSE 8080
