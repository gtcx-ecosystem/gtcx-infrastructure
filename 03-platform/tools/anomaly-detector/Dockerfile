FROM node:20-alpine

WORKDIR /app

# Copy only the detector and test fixtures (for validation)
COPY detector.mjs ./
COPY test-fixtures/ ./test-fixtures/

# Run as non-root
USER node

# Default: poll live Prometheus every 60s
# Override CMD for dry-run or synthetic-data modes
CMD ["node", "detector.mjs", "--threshold=10", "--window=300000"]
