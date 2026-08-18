# syntax=docker/dockerfile:1
FROM oven/bun:1.3.14 AS deps
WORKDIR /app

# Keep dependency installation cached until a workspace manifest changes.
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN bun install --frozen-lockfile

FROM deps AS source
COPY . .

FROM source AS web-build
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN bun run --cwd apps/web build

FROM caddy:2-alpine AS caddy
COPY Caddyfile /etc/caddy/Caddyfile

FROM oven/bun:1.3.14 AS api
WORKDIR /app
ENV NODE_ENV=production PORT=8787
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=source --chown=bun:bun /app/package.json /app/bun.lock /app/tsconfig.json ./
COPY --from=source --chown=bun:bun /app/apps/api ./apps/api
COPY --from=source --chown=bun:bun /app/packages ./packages
USER bun
EXPOSE 8787
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD ["bun", "-e", "const r=await fetch('http://127.0.0.1:8787/api/health');if(!r.ok)process.exit(1)"]
CMD ["bun", "run", "--cwd", "apps/api", "start"]

FROM oven/bun:1.3.14 AS web
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=source --chown=bun:bun /app/package.json /app/bun.lock /app/tsconfig.json ./
COPY --from=web-build --chown=bun:bun /app/apps/web ./apps/web
COPY --from=source --chown=bun:bun /app/packages ./packages
USER bun
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD ["bun", "-e", "const r=await fetch('http://127.0.0.1:3000/');if(!r.ok)process.exit(1)"]
CMD ["bun", "run", "--cwd", "apps/web", "start"]

# All-in-one image for hosts that give you one web service and one domain
# (Render, Railway, Fly, a bare VPS). Caddy owns $PORT and proxies to the API
# and the web app on loopback. This is the default target: `docker build .`
FROM oven/bun:1.3.14 AS standalone
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY --from=source /app/Caddyfile /etc/caddy/Caddyfile
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=source --chown=bun:bun /app/package.json /app/bun.lock /app/tsconfig.json ./
COPY --from=source --chown=bun:bun /app/apps/api ./apps/api
COPY --from=web-build --chown=bun:bun /app/apps/web ./apps/web
COPY --from=source --chown=bun:bun /app/packages ./packages
COPY --from=source --chmod=755 /app/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
USER bun
EXPOSE 80
CMD ["docker-entrypoint.sh"]
