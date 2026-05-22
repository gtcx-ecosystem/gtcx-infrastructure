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
# nats + aws-sdk are runtime deps but soft-loaded so the test image
# can omit them. Production builds install them via:
#   npm install --omit=dev --no-package-lock nats @aws-sdk/client-s3
RUN apk add --no-cache tini && \
    npm install --omit=dev --no-package-lock --no-fund --no-audit \
      nats@^2 \
      @aws-sdk/client-s3@^3

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
COPY src/ ./src/

# Workspace package — vendored by copying tools/audit-signer's published
# tarball at build time. In CI this happens via a turbo prune step.
# For now, the package is resolved by the parent workspace when running
# locally; the published image must include it explicitly:
#   npm pack ../audit-signer && tar -xzf gtcx-audit-signer-*.tgz -C node_modules/@gtcx/
# A future iteration moves this into a turbo prune Dockerfile.

USER auditflush

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# tini reaps zombies + forwards signals so SIGTERM reaches the graceful
# shutdown path in src/index.mjs.
ENTRYPOINT ["/sbin/tini", "--"]

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/index.mjs"]
