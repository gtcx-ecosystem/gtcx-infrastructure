#!/usr/bin/env bash
# =============================================================================
# GTCX Load Test Runner
# =============================================================================
# Runs k6 load tests against local services and produces structured evidence.
#
# Usage:
#   ./03-platform/tools/load-tests/run-load-tests.sh [--output-dir=<path>]
#
# Prerequisites:
#   - k6 installed (https://k6.io/01-docs/get-started/installation/)
#   - Node.js services built and available
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUTPUT_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir=*) OUTPUT_DIR="${1#*=}"; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if ! command -v k6 &>/dev/null; then
  echo "[SKIP] k6 not installed — load tests unavailable"
  exit 0
fi

REPLAY_PORT=34567
GATEWAY_PORT=34568
REPLAY_PID=""
GATEWAY_PID=""

cleanup() {
  if [[ -n "$REPLAY_PID" ]]; then kill "$REPLAY_PID" 2>/dev/null || true; fi
  if [[ -n "$GATEWAY_PID" ]]; then kill "$GATEWAY_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

# Start replay-protection server in background
# REPLAY_GUARD_ALLOW_STUB_SIGNATURE=true is required for the /v1/replay/verify load test
echo "[INFO] Starting replay-protection server on port $REPLAY_PORT..."
(
  cd "$PROJECT_ROOT/03-platform/tools/replay-protection"
  PORT=$REPLAY_PORT REDIS_URL="" NODE_ENV=development REPLAY_GUARD_ALLOW_STUB_SIGNATURE=true node src/server.mjs &>/dev/null
) &
REPLAY_PID=$!

# Start compliance-gateway server in background
# The ai package import is slow (~8s); allow extra startup time
echo "[INFO] Starting compliance-gateway server on port $GATEWAY_PORT..."
(
  cd "$PROJECT_ROOT/03-platform/tools/compliance-gateway"
  PORT=$GATEWAY_PORT NODE_ENV=development AUDIT_QUERY_ENABLED=1 \
    COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON='[{"token":"load-test-token","subject":"load-test","permissions":["audit:read"],"label":"load-test","tenantId":"zw"}]' \
    node src/server.mjs &>/dev/null
) &
GATEWAY_PID=$!

# Wait for services to be ready
# The compliance-gateway ai package import is slow (~8s); allow extra startup time
echo "[INFO] Waiting for services to be ready..."
for i in {1..120}; do
  if curl -sf "http://localhost:$REPLAY_PORT/health" &>/dev/null && \
     curl -sf "http://localhost:$GATEWAY_PORT/health" &>/dev/null; then
    break
  fi
  sleep 0.5
done

if ! curl -sf "http://localhost:$REPLAY_PORT/health" &>/dev/null; then
  echo "[ERROR] Replay-protection server failed to start"
  exit 1
fi
if ! curl -sf "http://localhost:$GATEWAY_PORT/health" &>/dev/null; then
  echo "[ERROR] Compliance-gateway server failed to start"
  exit 1
fi

echo "[INFO] Services ready. Running k6 load tests..."

# Run tests
REPLAY_HEALTH_RESULT=0
REPLAY_VERIFY_RESULT=0
GATEWAY_HEALTH_RESULT=0
GATEWAY_TOOLS_RESULT=0
GATEWAY_RATE_LIMIT_RESULT=0

k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" \
  -e BASE_URL="http://localhost:$REPLAY_PORT" \
  "$SCRIPT_DIR/replay-protection-health.js" || REPLAY_HEALTH_RESULT=$?

k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" \
  -e BASE_URL="http://localhost:$REPLAY_PORT" \
  "$SCRIPT_DIR/replay-protection-verify.js" || REPLAY_VERIFY_RESULT=$?

k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" \
  -e BASE_URL="http://localhost:$GATEWAY_PORT" \
  "$SCRIPT_DIR/compliance-gateway-health.js" || GATEWAY_HEALTH_RESULT=$?

k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" \
  -e BASE_URL="http://localhost:$GATEWAY_PORT" \
  "$SCRIPT_DIR/compliance-gateway-tools.js" || GATEWAY_TOOLS_RESULT=$?

k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" \
  -e BASE_URL="http://localhost:$GATEWAY_PORT" \
  -e AUDIT_TOKEN="load-test-token" \
  "$SCRIPT_DIR/compliance-gateway-rate-limit.js" || GATEWAY_RATE_LIMIT_RESULT=$?

OVERALL_RESULT=0
if [[ $REPLAY_HEALTH_RESULT -ne 0 ]] || [[ $REPLAY_VERIFY_RESULT -ne 0 ]] || \
   [[ $GATEWAY_HEALTH_RESULT -ne 0 ]] || [[ $GATEWAY_TOOLS_RESULT -ne 0 ]] || \
   [[ $GATEWAY_RATE_LIMIT_RESULT -ne 0 ]]; then
  OVERALL_RESULT=1
fi

if [[ -n "$OUTPUT_DIR" ]]; then
  mkdir -p "$OUTPUT_DIR"
  cat > "$OUTPUT_DIR/load-test-evidence.json" <<EOF
{
  "schemaVersion": 1,
  "testType": "load-test",
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "result": "$([[ $OVERALL_RESULT -eq 0 ]] && echo 'PASS' || echo 'FAIL')",
  "services": [
    { "name": "replay-protection-health", "port": $REPLAY_PORT, "status": "$([[ $REPLAY_HEALTH_RESULT -eq 0 ]] && echo 'PASS' || echo 'FAIL')" },
    { "name": "replay-protection-verify", "port": $REPLAY_PORT, "status": "$([[ $REPLAY_VERIFY_RESULT -eq 0 ]] && echo 'PASS' || echo 'FAIL')" },
    { "name": "compliance-gateway-health", "port": $GATEWAY_PORT, "status": "$([[ $GATEWAY_HEALTH_RESULT -eq 0 ]] && echo 'PASS' || echo 'FAIL')" },
    { "name": "compliance-gateway-tools", "port": $GATEWAY_PORT, "status": "$([[ $GATEWAY_TOOLS_RESULT -eq 0 ]] && echo 'PASS' || echo 'FAIL')" },
    { "name": "compliance-gateway-rate-limit", "port": $GATEWAY_PORT, "status": "$([[ $GATEWAY_RATE_LIMIT_RESULT -eq 0 ]] && echo 'PASS' || echo 'FAIL')" }
  ]
}
EOF
  echo "[INFO] Evidence written to: $OUTPUT_DIR/load-test-evidence.json"
fi

if [[ $OVERALL_RESULT -eq 0 ]]; then
  echo "[PASS] All load tests passed"
else
  echo "[FAIL] One or more load tests failed"
fi

exit $OVERALL_RESULT
