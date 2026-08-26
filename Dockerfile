# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-bookworm-slim AS runtime
ENV CI=1
ENV NODE_ENV=production
ENV WRANGLER_SEND_METRICS=false
WORKDIR /app

RUN npm install --global wrangler@4.92.0 \
  && mkdir -p /data /app/.wrangler \
  && chown node:node /data /app/.wrangler

COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node drizzle ./drizzle
COPY --chown=node:node wrangler.container.jsonc ./dist/server/wrangler.container.jsonc
COPY --chown=node:node docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod 0555 /app/docker/entrypoint.sh

USER node
EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker/entrypoint.sh"]
