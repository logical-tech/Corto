# Run Shorts locally

Shorts is a Bun monorepo with a Hono API, a Next.js dashboard, PostgreSQL, and Redis. PostgreSQL and Redis are external services; the repository does not start them for you.

## Requirements

- [Bun 1.3.14](https://bun.sh/)
- PostgreSQL
- Redis

## Start the application

```bash
git clone https://github.com/logical-tech/url-shortner.git
cd url-shortner
cp .env.example .env
bun install --frozen-lockfile
bun run --cwd apps/api migrate
bun run dev
```

Update `.env` with reachable PostgreSQL and Redis URLs before starting the application. The defaults expect services on your machine:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shorts
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
SHORT_URL_BASE=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
TRUST_PROXY=false
```

Open [http://localhost:3000](http://localhost:3000). Next.js forwards `/api/*` to the API in development, so the health check is available at [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Secrets and local admin

Generate two different secrets before using a shared environment:

```bash
openssl rand -base64 32
openssl rand -base64 32
```

Set the first value as `BETTER_AUTH_SECRET` and the second as `IP_HASH_SECRET`. Set `ADMIN_EMAIL` to the account that can manage global settings.

`PASSKEY_RP_ID` is optional. Leave it empty to keep passkeys disabled locally.

## Useful commands

```bash
bun run dev                         # API and web in watch mode
bun run --cwd apps/api migrate      # apply Drizzle migrations
bun run --cwd apps/api test         # API tests
bun run typecheck                   # TypeScript checks
bun run build                       # production build
```

## Docker locally

The root Compose file expects the same environment variables and connects to PostgreSQL and Redis that you provide. Validate the resolved configuration, then build and start it:

```bash
docker compose -f compose.yaml config
docker compose -f compose.yaml up -d --build
```

Only Caddy should be exposed by your proxy. Keep `api:8787` and `web:3000` private.
