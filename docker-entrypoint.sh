#!/bin/bash
# Entrypoint for the all-in-one `standalone` image: Caddy, the API, and the web
# app in one container, so a PaaS that gives you a single web service and a
# single domain can still serve /, /api/* and /<slug>.
set -eu

# One-click hosts only know the public URL once the service exists, so every
# origin variable is derived at boot instead of being baked into the build.
if [ -z "${APP_URL:-}" ]; then
  if [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
    APP_URL="$RENDER_EXTERNAL_URL"
  elif [ -n "${RAILWAY_PUBLIC_DOMAIN:-}" ]; then
    APP_URL="https://$RAILWAY_PUBLIC_DOMAIN"
  else
    echo "Set APP_URL to the public origin of this deployment, for example https://links.example.com" >&2
    exit 1
  fi
fi
APP_URL="${APP_URL%/}"

export BETTER_AUTH_URL="${BETTER_AUTH_URL:-$APP_URL}"
export SHORT_URL_BASE="${SHORT_URL_BASE:-$APP_URL}"
export CORS_ORIGINS="${CORS_ORIGINS:-$APP_URL}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-$APP_URL}"
# The platform proxy terminates TLS and forwards X-Forwarded-For.
export TRUST_PROXY="${TRUST_PROXY:-true}"

# Caddy is the only listener on the platform port; the apps stay on loopback.
export CADDY_PORT="${PORT:-80}"
export API_UPSTREAM="127.0.0.1:8787"
export WEB_UPSTREAM="127.0.0.1:3000"
# Keep in sync with WEB_ROUTES in compose.yaml.
export WEB_ROUTES="${WEB_ROUTES:-/ /login /login/* /register /register/* /two-factor /two-factor/* /account /account/* /users /users/* /dashboard /dashboard/* /links /links/* /api-keys /api-keys/* /settings /settings/* /docs /docs/* /_next/* /robots.txt /sitemap.xml /opengraph-image /favicon.ico}"

# The API applies migrations before it listens, so start it first.
PORT=8787 bun run --cwd /app/apps/api start &
api=$!
PORT=3000 bun run --cwd /app/apps/web start &
web=$!

# If either app dies the container must die too: a half-serving deployment is
# worse than a restart.
terminate() {
  kill "$api" "$web" 2>/dev/null || true
  exit 0
}
trap terminate TERM INT

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
caddy=$!

wait -n "$api" "$web" "$caddy"
kill "$api" "$web" "$caddy" 2>/dev/null || true
exit 1
