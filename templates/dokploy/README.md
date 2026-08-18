# Dokploy template

This follows Dokploy's blueprint shape: `docker-compose.yml`, `template.toml`, `meta.json`, and an SVG logo. It is designed for a Git-backed Docker Compose project using this repository as the source.

1. Create a Docker Compose application in Dokploy and connect this repository.
2. Set the Compose Path to `templates/dokploy/docker-compose.yml`.
3. Import or reproduce the values in `template.toml`; replace the default `ADMIN_EMAIL` before deploying.
4. Map your domain to the `caddy` service on port `80`.

The stack owns its PostgreSQL and Redis volumes. For managed external services, use the root [`compose.yaml`](../../compose.yaml) and the full [Dokploy guide](../../docs/DEPLOY.md).
