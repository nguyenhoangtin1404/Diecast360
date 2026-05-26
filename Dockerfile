# syntax=docker/dockerfile:1

# Match engines in root package.json (see AGENTS.md).
ARG NODE_VERSION=22.21.1
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

ARG PNPM_VERSION=10.33.4
RUN npm install -g pnpm@${PNPM_VERSION}

# -----------------------------------------------------------------------------
# Build: install full workspace (devDeps needed for nest build), compile backend
# -----------------------------------------------------------------------------
FROM base AS build

# Install and compile need devDependencies (@nestjs/cli, typescript, prisma CLI).
ENV NODE_ENV=development

RUN apt-get update -qq && apt-get install --no-install-recommends -y \
    build-essential node-gyp pkg-config python-is-python3 openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

COPY backend ./backend

ENV NODE_ENV=production
RUN pnpm --filter ./backend run build

# -----------------------------------------------------------------------------
# Runtime: API only (frontend is deployed separately, e.g. Vercel — see docs/DEPLOYMENT.md)
# -----------------------------------------------------------------------------
FROM base AS production

ENV NODE_ENV=production

# Prisma engines need OpenSSL; Sharp ships prebuilt libs for glibc on this image.
RUN apt-get update -qq && apt-get install --no-install-recommends -y \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/package.json ./frontend/package.json

# Fly sets PORT to match http_service.internal_port (default 8080).
EXPOSE 8080

CMD ["pnpm", "--filter", "./backend", "run", "start:prod"]
