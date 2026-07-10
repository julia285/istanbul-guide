FROM node:22-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/workers/package.json apps/workers/package.json
RUN pnpm install --frozen-lockfile
COPY packages/db packages/db
COPY packages/shared packages/shared
COPY apps/workers apps/workers
RUN pnpm --filter @istanbul-guide/db generate
RUN pnpm --filter @istanbul-guide/shared build
RUN pnpm --filter @istanbul-guide/workers build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/packages /repo/packages
COPY --from=build /repo/apps/workers /repo/apps/workers
WORKDIR /repo/apps/workers
CMD ["node", "dist/scheduler/run.js"]
