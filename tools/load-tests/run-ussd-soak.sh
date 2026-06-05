#!/usr/bin/env bash
# =============================================================================
# USSD Handler soak runner (IR-4.1)
# =============================================================================
# Starts @gtcx/ussd-handler in memory-store mode, runs k6 soak, compares baseline.
#
# Usage:
#   ./tools/load-tests/run-ussd-soak.sh [--output-dir=<path>]
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUTPUT_DIR=""
USSD_PORT=34569

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir=*) OUTPUT_DIR="${1#*=}"; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if ! command -v k6 &>/dev/null; then
  echo "[SKIP] k6 not installed — USSD soak unavailable"
  exit 0
fi

USSD_PID=""
cleanup() {
  if [[ -n "$USSD_PID" ]]; then kill "$USSD_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

echo "[INFO] Starting USSD handler on port $USSD_PORT..."
(
  cd "$PROJECT_ROOT/tools/ussd-handler"
  USSD_PORT=$USSD_PORT NODE_ENV=test node src/server.mjs &>/dev/null
) &
USSD_PID=$!

echo "[INFO] Waiting for USSD handler..."
for _ in {1..60}; do
  if curl -sf "http://localhost:$USSD_PORT/health" &>/dev/null; then
    break
  fi
  sleep 0.25
done

if ! curl -sf "http://localhost:$USSD_PORT/health" &>/dev/null; then
  echo "[ERROR] USSD handler failed to start"
  exit 1
fi

METRICS_FILE="$(mktemp -t ussd-soak-metrics.XXXXXX.json)"
SOAK_RESULT=0

k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" \
  -e BASE_URL="http://localhost:$USSD_PORT" \
  -e USSD_SOAK_DURATION="${USSD_SOAK_DURATION:-60s}" \
  -e USSD_SOAK_VUS="${USSD_SOAK_VUS:-10}" \
  "$SCRIPT_DIR/ussd-handler-soak.js" || SOAK_RESULT=$?

if [[ -f "$PROJECT_ROOT/ussd-soak-metrics.json" ]]; then
  mv "$PROJECT_ROOT/ussd-soak-metrics.json" "$METRICS_FILE"
fi

if [[ ! -f "$METRICS_FILE" ]]; then
  echo "[ERROR] USSD soak did not emit ussd-soak-metrics.json"
  exit 1
fi

node "$PROJECT_ROOT/tools/scripts/ussd-soak-baseline-check.mjs" \
  --metrics="$METRICS_FILE" || SOAK_RESULT=$?

if [[ -n "$OUTPUT_DIR" ]]; then
  mkdir -p "$OUTPUT_DIR"
  cp "$METRICS_FILE" "$OUTPUT_DIR/ussd-soak-metrics.json"
  cat > "$OUTPUT_DIR/ussd-soak-evidence.json" <<EOF
{
  "schemaVersion": 1,
  "testType": "ussd-soak",
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "result": "$([[ $SOAK_RESULT -eq 0 ]] && echo 'PASS' || echo 'FAIL')",
  "port": $USSD_PORT,
  "profile": "${USSD_SOAK_DURATION:-60s}/${USSD_SOAK_VUS:-10}vu"
}
EOF
  echo "[INFO] Evidence written to: $OUTPUT_DIR/"
fi

rm -f "$METRICS_FILE"

if [[ $SOAK_RESULT -eq 0 ]]; then
  echo "[PASS] USSD soak within baseline"
else
  echo "[FAIL] USSD soak failed or regressed"
fi

exit $SOAK_RESULT
