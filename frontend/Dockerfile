# syntax=docker/dockerfile:1.7
#
# AegisBank frontend image. One file, two final targets:
#   dev    -> `next dev` with hot reload        (docker compose up --watch)
#   runner -> standalone production server      (docker compose --profile prod up, ECS, Render)
#
# Runtime configuration comes from environment variables at container start (see .env.example);
# nothing environment-specific is baked into the image, so the same image runs everywhere.

ARG NODE_VERSION=26
ARG PNPM_VERSION=12.21.0

# ---------- base: Node + pnpm ----------
FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
# Corepack is no longer bundled with Node 25+, so pnpm is installed with npm, pinned to package.json.
RUN apk add --no-cache libc6-compat \
 && npm install --global "pnpm@${PNPM_VERSION}" \
 && npm cache clean --force \
 && mkdir -p /app && chown node:node /app
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---------- deps: install once, cached until the lockfile changes ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=aegisbank-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

# ---------- dev: hot-reload development server ----------
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["pnpm", "dev"]

# ---------- builder: production build ----------
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------- runner: small production image ----------
FROM node:${NODE_VERSION}-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
# `output: "standalone"` traces only the files the server needs - no pnpm, no dev dependencies.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]
