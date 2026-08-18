# Deploy on Coolify

Use the Docker Compose build pack. It builds the repository's multi-stage Dockerfile and deploys Caddy, the API, and the Next.js dashboard as one stack.

## 1. Create a Docker Compose application

1. In Coolify, create a project and select **New Resource**.
2. Connect the repository and select the branch to deploy.
3. Choose **Docker Compose** as the build pack.
4. Set **Base Directory** to `/` and **Docker Compose Location** to `templates/coolify/docker-compose.yaml`.

Coolify creates the stack network automatically. Do not add a custom `networks:` section or manually attach services to another network.

## 2. Set environment variables

Coolify detects the variables declared in the Compose file. Set these production values in its Environment Variables view:

| Variable              | Production value                             |
| --------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | `https://links.example.com`                  |
| `BETTER_AUTH_URL`     | `https://links.example.com`                  |
| `SHORT_URL_BASE`      | `https://links.example.com`                  |
| `CORS_ORIGINS`        | `https://links.example.com`                  |
| `ADMIN_EMAIL`         | Your administrator email address             |
| `BETTER_AUTH_SECRET`  | `openssl rand -base64 32` output             |
| `IP_HASH_SECRET`      | A different `openssl rand -base64 32` output |
| `POSTGRES_PASSWORD`   | A strong generated password                  |
| `REDIS_PASSWORD`      | A different strong generated password        |

The template creates PostgreSQL and Redis volumes within the same Coolify stack. Keep the two application secrets stable across deployments; changing `BETTER_AUTH_SECRET` invalidates active sessions.

## 3. Attach the domain

Assign `links.example.com` to the `caddy` service on port `80` in Coolify. Coolify terminates TLS and Caddy only performs internal routing:

- `/api/*` goes to the API;
- application routes go to Next.js;
- `/<slug>` goes to the redirect API.

Deploy, then verify:

```bash
curl -fsS https://links.example.com/api/health
curl -I https://links.example.com/<existing-slug>
```

## Updates and rollback

Before an upgrade, create a PostgreSQL backup and record the deployed commit. Deploy the new commit, check the API health endpoint, login, link creation, and an existing redirect. If you need to roll back, redeploy the last known-good commit. Database migrations are not automatically reversed by an image rollback.

For a raw Compose deployment or a manually pasted stack, use [templates/coolify/docker-compose.yaml](../templates/coolify/docker-compose.yaml) as the source of truth.
