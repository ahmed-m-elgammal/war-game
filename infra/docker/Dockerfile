# Pinned Toolchain: Node 24.22.1 LTS + pnpm 12.15.0
FROM node:24.22.1-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.15.0 --activate

WORKDIR /app

# Copy root workspace manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json tsconfig.json ./

# Copy all packages and apps manifests
COPY packages/shared/package.json ./packages/shared/
COPY packages/game-rules/package.json ./packages/game-rules/
COPY packages/map-data/package.json ./packages/map-data/
COPY packages/ui/package.json ./packages/ui/
COPY packages/db/package.json ./packages/db/
COPY packages/test-bot/package.json ./packages/test-bot/
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/

# Fetch dependencies
RUN pnpm fetch --prod

# Build stage
FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run typecheck

# Server runtime target
FROM node:24.22.1-bookworm-slim AS server
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 8080
CMD ["node", "apps/server/dist/index.js"]
