# =============================================================================
# Replay Guard — Node.js sidecar for replay-protection verification
# =============================================================================
# Serves:
#   POST /v1/replay/verify  — verify QueueIntegrity payload
#   GET  /health            — liveness/readiness probe
#   GET  /metrics           — Prometheus exposition
#
# Target size: < 100MB (Alpine base)
# =============================================================================

FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S replayguard && adduser -u 1001 -S replayguard -G replayguard

# Copy source (no build step — pure ESM)
COPY package.json ./
COPY src/ ./03-platform/src/
COPY README.md ./

USER replayguard

ENV NODE_ENV=production
ENV PORT=8400

EXPOSE 8400

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8400/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/server.mjs"]
