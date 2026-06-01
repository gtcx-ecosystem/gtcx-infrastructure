#!/usr/bin/env bash
# =============================================================================
# GTCX Disaster Recovery Test Script
# =============================================================================
# Validates backup integrity and restore capability for the protocol server.
# Produces structured evidence with RTO/RPO measurements.
#
# Usage:
#   ./infra/scripts/dr-test.sh [testnet|staging]
#
# Prerequisites:
#   - docker compose running (docker-compose.dev.yml)
#   - psql client installed
#   - curl available
# =============================================================================

set -euo pipefail

ENV="${1:-testnet}"
OUTPUT_DIR="${2:-}"

# Validate required environment variables — fail-fast on missing creds
# rather than silently falling back to a published dev default that
# could authenticate against a misconfigured staging shell.
: "${POSTGRES_HOST:?POSTGRES_HOST is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required — source from secret manager, never use shell-history values}"
: "${AUDIT_HOST:?AUDIT_HOST is required}"
: "${AUDIT_USER:?AUDIT_USER is required}"
: "${AUDIT_DB:?AUDIT_DB is required}"
: "${POSTGRES_AUDIT_PASSWORD:?POSTGRES_AUDIT_PASSWORD is required — source from secret manager, never use shell-history values}"

POSTGRES_PORT="${POSTGRES_PORT:-5432}"
AUDIT_PORT="${AUDIT_PORT:-5433}"
PROTOCOL_URL="${PROTOCOL_URL:-http://localhost:8300}"

echo "=== GTCX DR Test — $ENV ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

PASS=0
FAIL=0
START_TIME=$(date +%s)

# Evidence structure
EVIDENCE_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EVIDENCE_ENV="$ENV"
EVIDENCE_STEPS="[]"
EVIDENCE_RTO_MS="null"
EVIDENCE_RPO_MS="null"

record_step() {
  local name="$1"
  local status="$2"
  local duration_ms="$3"
  local detail="${4:-}"
  local step_json
  step_json=$(printf '{"name":"%s","status":"%s","durationMs":%s,"detail":"%s"}' "$name" "$status" "$duration_ms" "$detail")
  if [ "$EVIDENCE_STEPS" = "[]" ]; then
    EVIDENCE_STEPS="[$step_json]"
  else
    EVIDENCE_STEPS="${EVIDENCE_STEPS%]}, $step_json]"
  fi
}

check() {
  local name="$1"
  local result="$2"
  local step_start="$3"
  local step_end
  step_end=$(date +%s%N)
  local duration_ms=$(( (step_end - step_start) / 1000000 ))
  if [ "$result" = "true" ]; then
    echo "  [PASS] $name (${duration_ms}ms)"
    PASS=$((PASS + 1))
    record_step "$name" "PASS" "$duration_ms" ""
  else
    echo "  [FAIL] $name (${duration_ms}ms)"
    FAIL=$((FAIL + 1))
    record_step "$name" "FAIL" "$duration_ms" ""
  fi
}

# --- Step 1: Verify services are running ---
echo "Step 1: Service health"
STEP1_START=$(date +%s%N)
if [ "${DR_SKIP_PROTOCOL_HEALTH:-}" = "1" ]; then
  echo "  [SKIP] Protocol server health (DR_SKIP_PROTOCOL_HEALTH=1)"
else
  HEALTH=$(curl -sf "$PROTOCOL_URL/health" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
  check "Protocol server health" "$([ "$HEALTH" = "ok" ] && echo true || echo false)" "$STEP1_START"
fi

PG_OK=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1" -t -A 2>/dev/null || echo "")
check "PostgreSQL operational" "$([ "$PG_OK" = "1" ] && echo true || echo false)" "$STEP1_START"

AUDIT_OK=$(PGPASSWORD="$POSTGRES_AUDIT_PASSWORD" psql -h "$AUDIT_HOST" -p "$AUDIT_PORT" -U "$AUDIT_USER" -d "$AUDIT_DB" -c "SELECT 1" -t -A 2>/dev/null || echo "")
check "PostgreSQL audit" "$([ "$AUDIT_OK" = "1" ] && echo true || echo false)" "$STEP1_START"

# --- Step 2: Insert test data ---
echo ""
echo "Step 2: Insert test data"
STEP2_START=$(date +%s%N)
DR_MARKER="dr_test_$(date +%s)"
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
  CREATE TABLE IF NOT EXISTS dr_test_markers (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW());
  INSERT INTO dr_test_markers (id) VALUES ('$DR_MARKER') ON CONFLICT DO NOTHING;
" 2>/dev/null
INSERTED=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id FROM dr_test_markers WHERE id = '$DR_MARKER'" -t -A 2>/dev/null || echo "")
check "Test marker inserted" "$([ "$INSERTED" = "$DR_MARKER" ] && echo true || echo false)" "$STEP2_START"

# --- Step 3: Create backup ---
echo ""
echo "Step 3: Backup"
STEP3_START=$(date +%s%N)
BACKUP_FILE="/tmp/gtcx_dr_test_${ENV}_$(date +%Y%m%d%H%M%S).sql"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl > "$BACKUP_FILE" 2>/dev/null
BACKUP_SIZE=$(wc -c < "$BACKUP_FILE" 2>/dev/null || echo "0")
check "Backup created ($BACKUP_SIZE bytes)" "$([ "$BACKUP_SIZE" -gt 100 ] && echo true || echo false)" "$STEP3_START"

# --- Step 4: Verify backup contains test marker ---
echo ""
echo "Step 4: Backup verification"
STEP4_START=$(date +%s%N)
MARKER_IN_BACKUP=$(grep -c "$DR_MARKER" "$BACKUP_FILE" 2>/dev/null || echo "0")
check "Test marker in backup" "$([ "$MARKER_IN_BACKUP" -gt 0 ] && echo true || echo false)" "$STEP4_START"

# --- Step 5: Simulate restore (to a temp database) ---
echo ""
echo "Step 5: Restore test"
STEP5_START=$(date +%s%N)
RESTORE_START_NS=$(date +%s%N)
RESTORE_DB="gtcx_dr_test_restore"
# dropdb/createdb avoid CREATE DATABASE inside a psql transaction (fails under set -e on CI).
PGPASSWORD="$POSTGRES_PASSWORD" dropdb -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" --if-exists "$RESTORE_DB" 2>/dev/null || true
PGPASSWORD="$POSTGRES_PASSWORD" createdb -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$RESTORE_DB" 2>/dev/null || true
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$RESTORE_DB" -v ON_ERROR_STOP=1 -f "$BACKUP_FILE" > /dev/null 2>&1 || true
RESTORE_END_NS=$(date +%s%N)
RESTORED=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$RESTORE_DB" -c "SELECT id FROM dr_test_markers WHERE id = '$DR_MARKER'" -t -A 2>/dev/null || echo "")
check "Test marker restored" "$([ "$RESTORED" = "$DR_MARKER" ] && echo true || echo false)" "$STEP5_START"

# Compute RTO (restore time) and RPO (data loss window approximated as backup age)
RTO_MS=$(( (RESTORE_END_NS - RESTORE_START_NS) / 1000000 ))
RPO_MS="0" # Synthetic test: no real data loss window since we inserted and backed up immediately
EVIDENCE_RTO_MS="$RTO_MS"
EVIDENCE_RPO_MS="$RPO_MS"

# --- Step 6: Cleanup ---
echo ""
echo "Step 6: Cleanup"
STEP6_START=$(date +%s%N)
PGPASSWORD="$POSTGRES_PASSWORD" dropdb -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" --if-exists "$RESTORE_DB" 2>/dev/null || true
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DELETE FROM dr_test_markers WHERE id = '$DR_MARKER';" 2>/dev/null
rm -f "$BACKUP_FILE"
echo "  Cleanup complete"
record_step "Cleanup" "PASS" "$(( ($(date +%s%N) - STEP6_START) / 1000000 ))" ""

# --- Summary ---
echo ""
echo "=== DR Test Summary ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo "  Status: $([ "$FAIL" -eq 0 ] && echo 'PASS' || echo 'FAIL')"
echo "  RTO: ${RTO_MS}ms"
echo "  RPO: ${RPO_MS}ms"
echo "  Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

TOTAL_END=$(date +%s)
TOTAL_DURATION=$((TOTAL_END - START_TIME))

# --- Write evidence artifact ---
if [ -n "$OUTPUT_DIR" ]; then
  mkdir -p "$OUTPUT_DIR"
  EVIDENCE_FILE="$OUTPUT_DIR/dr-evidence.json"
  cat > "$EVIDENCE_FILE" <<EOF
{
  "schemaVersion": 1,
  "testType": "disaster-recovery",
  "environment": "$EVIDENCE_ENV",
  "date": "$EVIDENCE_DATE",
  "result": "$([ "$FAIL" -eq 0 ] && echo 'PASS' || echo 'FAIL')",
  "passed": $PASS,
  "failed": $FAIL,
  "totalDurationSeconds": $TOTAL_DURATION,
  "rtoMs": $EVIDENCE_RTO_MS,
  "rpoMs": $EVIDENCE_RPO_MS,
  "steps": $EVIDENCE_STEPS
}
EOF
  echo "Evidence written to: $EVIDENCE_FILE"
fi

if [ "$FAIL" -eq 0 ]; then
  exit 0
fi
exit 1
