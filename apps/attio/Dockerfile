FROM oven/bun:1.3.13 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/attio/package.json ./apps/attio/package.json
COPY packages/core/package.json ./packages/core/package.json
RUN bun install --frozen-lockfile

FROM deps AS app-build
WORKDIR /app
COPY apps/attio/tsconfig.json ./apps/attio/tsconfig.json
COPY apps/attio/frontend ./apps/attio/frontend
COPY apps/attio/server ./apps/attio/server
COPY apps/attio/shared ./apps/attio/shared
COPY packages/core/package.json ./packages/core/package.json
COPY packages/core/src ./packages/core/src
WORKDIR /app/apps/attio
RUN bun run build:frontend && bun run build:server

FROM deps AS baileys-build
WORKDIR /app
COPY apps/attio/tsconfig.json ./apps/attio/tsconfig.json
COPY apps/attio/server ./apps/attio/server
COPY apps/attio/shared ./apps/attio/shared
COPY packages/core/package.json ./packages/core/package.json
COPY packages/core/src ./packages/core/src
WORKDIR /app/apps/attio
RUN bun run build:baileys

FROM deps AS worker-build
WORKDIR /app
COPY apps/attio/tsconfig.json ./apps/attio/tsconfig.json
COPY apps/attio/server ./apps/attio/server
COPY apps/attio/shared ./apps/attio/shared
COPY packages/core/package.json ./packages/core/package.json
COPY packages/core/src ./packages/core/src
WORKDIR /app/apps/attio
RUN bun run build:worker

FROM oven/bun:1.3.13 AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/attio/package.json ./apps/attio/package.json
COPY packages/core/package.json ./packages/core/package.json
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.13 AS runtime-base
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/attio/node_modules ./apps/attio/node_modules
COPY package.json bun.lock ./
COPY apps/attio/package.json ./apps/attio/package.json
COPY packages/core/package.json ./packages/core/package.json

FROM runtime-base AS worker-runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && groupadd --system --gid 10001 attioworker \
  && useradd --system --uid 10001 --gid 10001 --home-dir /nonexistent --no-create-home --shell /usr/sbin/nologin attioworker \
  && rm -rf /var/lib/apt/lists/*

FROM runtime-base AS app
WORKDIR /app/apps/attio
COPY --from=app-build /app/apps/attio/dist/server ./dist/server
COPY --from=app-build /app/apps/attio/dist/frontend ./dist/frontend
EXPOSE 3000
CMD ["bun", "dist/server/index.js"]

FROM runtime-base AS baileys
WORKDIR /app/apps/attio
COPY --from=baileys-build /app/apps/attio/dist/baileys ./dist/baileys
EXPOSE 3001
CMD ["bun", "dist/baileys/baileys-index.js"]

FROM worker-runtime AS worker
WORKDIR /app/apps/attio
COPY --from=worker-build /app/apps/attio/dist/worker ./dist/worker
USER 10001:10001
CMD ["bun", "dist/worker/worker.js"]
