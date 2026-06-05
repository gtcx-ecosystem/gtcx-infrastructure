# =============================================================================
# Audit-Flush — Sidecar that ships signed audit records from NATS to WORM S3.
# =============================================================================
# Listens on PORT 8080 for /health and /ready. Consumes the JetStream
# subject configured by AUDIT_NATS_SUBJECT (default gtcx.audit.>) and
# writes verified NDJSON batches to AUDIT_S3_BUCKET with Object Lock
# retention.
#
# Target size: < 100MB (Alpine + Node 20).
# =============================================================================

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
# Production deps. @gtcx/audit-signer lives on npm at v0.1.0+;
# nats + aws-sdk are soft-loaded by the sidecar's source but pinned
# here so the image is self-contained and production-ready.
RUN apk add --no-cache tini && \
    npm install --omit=dev --no-package-lock --no-fund --no-audit \
      '@gtcx/audit-signer@^0.1.0' \
      '@nats-io/transport-node@^3' \
      '@aws-sdk/client-s3@^3'

# -----------------------------------------------------------------------------
# Runtime image
# -----------------------------------------------------------------------------

FROM node:20-alpine AS production
WORKDIR /app

# Non-root user — restricted PodSecurity standard requires runAsNonRoot.
RUN addgroup -g 65532 -S auditflush && \
    adduser -u 65532 -S auditflush -G auditflush

COPY --from=deps /sbin/tini /sbin/tini
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY 03-platform/src/ ./03-platform/src/

USER auditflush

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# tini reaps zombies + forwards signals so SIGTERM reaches the graceful
# shutdown path in 03-platform/src/index.mjs.
ENTRYPOINT ["/sbin/tini", "--"]

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "03-platform/src/index.mjs"]
