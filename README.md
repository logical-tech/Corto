# Corto

**A modern URL shortener that stays yours.** Free, open source, and easy to
self-host in several ways. Password-protect a link, give it an expiry date or a
click limit, run your own ads on it, and read the analytics from the dashboard —
or skip the dashboard entirely and drive everything through the API. Secure by
design, and contributions are welcome.

Deploy it with the databases wired up for you:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/logical-tech/url-shortner)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/REPLACE_WITH_TEMPLATE_ID)

Render reads [`render.yaml`](render.yaml) and provisions PostgreSQL and a Key
Value store alongside the app; Railway's template does the same with PostgreSQL
and Redis. Both build the all-in-one `standalone` image, so one service answers
`/`, `/api/*`, and `/<slug>`. Details and self-hosting: [One-click deploy](docs/ONE-CLICK.md).

Cloudflare Workers and Vercel are not supported — the API needs TCP sockets to
PostgreSQL and Redis plus Bun's password hashing. [Why](docs/ONE-CLICK.md#why-not-cloudflare-or-vercel).

## Documentation

| Guide                                       | What it covers                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| [One-click deploy](docs/ONE-CLICK.md)       | Render, Railway, and the all-in-one image for a bare VPS.                  |
| [Run locally](docs/LOCAL.md)                | Requirements, environment variables, migrations, and development commands. |
| [Deploy on Dokploy](docs/DEPLOY.md)         | Production deployment with managed PostgreSQL and Redis.                   |
| [Deploy on Coolify](docs/COOLIFY.md)        | Git-backed Docker Compose deployment on Coolify.                           |
| [Deployment templates](templates/README.md) | Dokploy and Coolify Compose templates bundled with the repository.         |
| [Contributing](CONTRIBUTING.md)             | Fork-based workflow and pull request requirements.                         |

## Architecture

- `apps/api`: Hono on Bun, Drizzle, Better Auth, and a router → controller → handler flow. Port `8787`.
- `apps/web`: landing page, dashboard, analytics, and API documentation in Next.js. Port `3000`.
- `Caddyfile`: the only HTTP entrypoint on port `80`; proxies `/api/*` to the API, GUI routes to Next.js, and `/<slug>` to the API.
- `packages/ui`: shared shadcn/ui components.
- PostgreSQL stores users, links, API keys, and events. Redis uses `REDIS_PREFIX` (default `corto:`) for cache and redirects.

PostgreSQL and Redis are not part of the root Compose stack. Connect shared instances with `DATABASE_URL` and `REDIS_URL`. In Dokploy, all root services use `DOCKER_NETWORK` (default `dokploy-network`) and unique aliases to avoid DNS collisions with other projects.

## Quick start

Requires [Bun 1.3.14](https://bun.sh/) plus reachable PostgreSQL and Redis instances.

```bash
git clone https://github.com/logical-tech/url-shortner.git
cd url-shortner
cp .env.example .env
bun install --frozen-lockfile
bun run --cwd apps/api migrate
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). During development, Next.js proxies `/api/*` to Hono; the health check is [http://localhost:3000/api/health](http://localhost:3000/api/health).

Localhost values in `.env.example` apply when Bun runs on your machine. When you run containers, use PostgreSQL and Redis hostnames reachable **from the containers**.

## API

The web app exposes a guide at `/docs`; the public machine-readable schema is `/api/openapi.json`.

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/v1/links" \
  -H "x-api-key: $CORTO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/guide","slug":"guide"}'
```

Advertising is configured per link owner through `GET` and `PATCH /api/v1/advertising`. AdsTerra accepts a supported banner preset plus either the `invoke.js` URL or the entire copied snippet. By default, the interstitial runs its countdown and then reveals **Continue to site**; `automaticRedirect: true` redirects when it ends. `adFree: true` excludes one link.

Verify the service without authentication:

```bash
curl -f "$NEXT_PUBLIC_APP_URL/api/health"
```

## Commands

```bash
bun run dev                         # all workspaces in watch mode
bun run build                       # Turbo production build
bun run lint                        # lint every workspace
bun run typecheck                   # TypeScript checks
bun run --cwd apps/api test         # API tests
bun run --cwd apps/api migrate      # PostgreSQL migrations
bun run --cwd apps/api db:generate  # create Drizzle migrations from the schema
```

## Docker

The same multi-stage `Dockerfile` creates `caddy`, `api`, `web`, and `standalone` targets and installs the monorepo once. Application images run as a non-root user. `standalone` is the last stage, so a plain `docker build .` produces the all-in-one image the one-click hosts deploy.

```bash
cp .env.example .env
# Set public URLs, secrets, and external services first.
docker compose -f compose.yaml up -d --build

# API, redirects, and tracking only; no GUI:
docker compose -f compose-nogui.yaml up -d --build
```

Only Caddy is exposed on the Docker network, at port `80`; `web:3000` and `api:8787` remain private. In Dokploy, attach the only domain to the `caddy` service on port `80`.
