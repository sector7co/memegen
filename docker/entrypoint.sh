#!/bin/sh
set -eu

SITE_ORIGIN="${SITE_ORIGIN:-http://localhost:3000}"
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-internal}"

wrangler d1 migrations apply DB \
  --config /app/dist/server/wrangler.container.jsonc \
  --local \
  --persist-to /data

exec wrangler dev \
  --config /app/dist/server/wrangler.container.jsonc \
  --local \
  --persist-to /data \
  --ip 0.0.0.0 \
  --port 3000 \
  --inspector-ip 127.0.0.1 \
  --inspector-port 9230 \
  --show-interactive-dev-session=false \
  --var "DEPLOYMENT_MODE:${DEPLOYMENT_MODE}" \
  --var "SITE_ORIGIN:${SITE_ORIGIN}"
