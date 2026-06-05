# Build from gtcx-infrastructure repo root:
#   docker build -f 03-platform/tools/compliance-gateway/Dockerfile -t compliance-gateway:local .
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY 03-platform/tools/audit-signer/package.json 03-platform/tools/audit-signer/
COPY 03-platform/tools/compliance-data/package.json 03-platform/tools/compliance-data/
COPY 03-platform/tools/compliance-gateway/package.json 03-platform/tools/compliance-gateway/
COPY 03-platform/tools/audit-signer 03-platform/tools/audit-signer
COPY 03-platform/tools/compliance-data 03-platform/tools/compliance-data
COPY 03-platform/tools/compliance-gateway 03-platform/tools/compliance-gateway

RUN pnpm install --filter @gtcx/compliance-gateway...
RUN pnpm deploy --filter @gtcx/compliance-gateway --prod /deploy

FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 gtcx && adduser -u 1001 -G gtcx -s /bin/sh -D gtcx
COPY --from=build --chown=gtcx:gtcx /deploy /app
USER gtcx
EXPOSE 8500
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:8500/health || exit 1
CMD ["node", "03-platform/src/server.mjs"]
