# Deploy on Dokploy

The repository provides one multi-stage `Dockerfile` and two root Compose modes:

| Mode      | Compose file         | Services              | Public internal port |
| --------- | -------------------- | --------------------- | -------------------- |
| Dashboard | `compose.yaml`       | `caddy`, `api`, `web` | Caddy `80`           |
| API only  | `compose-nogui.yaml` | `caddy`, `api`        | Caddy `80`           |

Both root modes use external PostgreSQL and Redis. The API applies Drizzle migrations before it starts, so migrations must remain backward compatible while an update has more than one replica.

For a self-contained stack with PostgreSQL and Redis volumes, use [`templates/dokploy`](../templates/dokploy/README.md). The root Compose files are the recommended choice when Dokploy already manages your database and Redis.

## 1. Prepare infrastructure and DNS

1. Create a dedicated PostgreSQL database and user. If Dokploy manages it, copy its **Internal Connection URL** from the database Connection page.
2. Choose a Redis database, copy its internal URL, and use a unique prefix such as `acme-shorts:`. Do not share a prefix with another application.
3. Point one DNS record, for example `links.example.com`, at Dokploy. The dashboard, API, and short URLs share one domain.
4. Generate two different secrets:

   ```bash
   openssl rand -base64 32
   openssl rand -base64 32
   ```

## 2. Create the Compose service

1. In Dokploy, create a project and then a **Compose** service of type **Docker Compose**. Do not use Stack: Stack does not run `build`.
2. Connect the repository and branch to deploy.
3. Set **Compose Path** to `./compose.yaml` for the dashboard or `./compose-nogui.yaml` for API only.
4. Save. The Compose files already name the Dockerfile targets and Caddy is copied into the proxy image during the build.

Dokploy writes UI variables to `.env`; the Compose files reference them with `${VAR}` so they are injected into containers too.

## 3. Configure environment variables

Copy `.env.example` into Dokploy's Environment editor and replace every value. Use HTTPS URLs without a trailing slash in production.

| Variable              | Production example               | Notes                                                          |
| --------------------- | -------------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`        | Internal URL copied from Dokploy | Never use `localhost` or an invented hostname.                 |
| `REDIS_URL`           | Internal URL copied from Dokploy | Use `rediss://` only when the internal connection enables TLS. |
| `REDIS_PREFIX`        | `acme-shorts:`                   | Must be unique in shared Redis.                                |
| `BETTER_AUTH_SECRET`  | `openssl rand -base64 32` output | At least 32 characters; preserve it across deployments.        |
| `BETTER_AUTH_URL`     | `https://links.example.com`      | Canonical public origin used by Better Auth.                   |
| `ADMIN_EMAIL`         | `admin@example.com`              | The account allowed to manage global settings.                 |
| `NEXT_PUBLIC_APP_URL` | `https://links.example.com`      | Canonical URL and SEO metadata; compiled into the web bundle.  |
| `SHORT_URL_BASE`      | `https://links.example.com`      | Public base for short links.                                   |
| `IP_HASH_SECRET`      | A second random secret           | Pseudonymous IP hash; rotating it breaks analytics continuity. |
| `CORS_ORIGINS`        | `https://links.example.com`      | Exact comma-separated origins, without paths.                  |
| `TRUST_PROXY`         | `true`                           | Only behind Dokploy, Traefik, or another trusted proxy.        |
| `PASSKEY_RP_ID`       | `links.example.com`              | Optional. Leave empty to safely disable passkeys.              |
| `PASSKEY_RP_NAME`     | `Shorts`                         | Name shown by the passkey manager.                             |
| `PASSKEY_ORIGIN`      | `https://links.example.com`      | Optional; defaults to `BETTER_AUTH_URL`.                       |
| `DOCKER_NETWORK`      | `dokploy-network`                | External network shared with Dokploy services.                 |

`NEXT_PUBLIC_APP_URL` is a public build argument. Changing it requires a new build, not only a restart. In API-only mode, `CORS_ORIGINS` must still list authorized browser clients explicitly; never use `*`.

## 4. Deploy, map the domain, and verify

1. Click **Deploy** and wait for build, migration, and health checks.
2. In **Domains**, add one mapping: `links.example.com` → `caddy`, port `80`, then deploy again.
3. Enable HTTPS/Let's Encrypt in Dokploy. Caddy routes internal HTTP only; Dokploy's proxy owns TLS.
4. Verify:

   ```bash
   curl -fsS https://links.example.com/api/health
   curl -I https://links.example.com/<existing-slug>
   ```

The first command returns HTTP 200. The second returns a redirect without creating a test link in production.

## Routing, CORS, and cookies

- Dokploy forwards the domain to Caddy. Caddy routes `/api/*` to `api:8787`, known GUI routes to `web:3000`, and `/<slug>` to `api:8787`.
- Caddy, API, and web use the external `DOCKER_NETWORK`; Caddy reaches the unique aliases `shorts-api` and `shorts-web`, avoiding collisions with other services called `api` or `web`.
- In API-only mode, `/` returns `404`; the API stays at `/api/*` and short-link redirects at `/<slug>`.
- Your proxy must forward `X-Forwarded-For`, `X-Forwarded-Host`, and `X-Forwarded-Proto`. Enable `TRUST_PROXY=true` only behind a trusted proxy.
- `CORS_ORIGINS` contains exact origins such as `https://links.example.com`, without `/api`.
- Do not change `BETTER_AUTH_SECRET` during a normal deployment: it invalidates active sessions and OAuth flows.

## Upgrade and rollback

1. Before deployment, create a consistent PostgreSQL backup and record the current commit or image tags.
2. Deploy the new commit. Check API logs for migrations, then `/api/health`, login, link creation, and an existing redirect.
3. To roll back, select the previous deployment in Dokploy or redeploy the previous commit or immutable image tag.
4. An image rollback does not undo destructive migrations. Follow the migration rollback procedure or restore PostgreSQL from a verified backup.

```bash
pg_dump --format=custom --no-owner "$DATABASE_URL" > "shorts-$(date +%F-%H%M).dump"
pg_restore --clean --if-exists --no-owner --dbname "$DATABASE_URL" shorts-YYYY-MM-DD-HHMM.dump
```

Restores are destructive; test them on a separate database first. Redis is cache-only in the root deployment and can be repopulated from PostgreSQL.

## Docker without Dokploy

The root files are normal Compose v2 files:

```bash
docker compose -f compose.yaml config
docker compose -f compose.yaml build
docker compose -f compose.yaml up -d

docker compose -f compose-nogui.yaml up -d --build
```

Connect your own proxy only to `caddy:80`; keep `web:3000` and `api:8787` private.
