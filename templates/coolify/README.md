# Coolify template

This Compose file follows Coolify's template metadata format and uses its managed network. It is for a Git-backed **Docker Compose** build pack, not a manually pasted one-click service: Shorts must build its Dockerfile from this repository.

1. Create a new resource from the repository.
2. Choose the Docker Compose build pack.
3. Set Base Directory to `/` and Compose Location to `templates/coolify/docker-compose.yaml`.
4. Set the required environment variables in Coolify and assign the public domain to `caddy:80`.

Do not add `networks:` to this Compose file. Coolify creates the deployment network and connects its proxy automatically. See the complete [Coolify guide](../../docs/COOLIFY.md).
