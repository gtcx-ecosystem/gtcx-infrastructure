#!/usr/bin/env bash
# =============================================================================
# GTCX Disaster Recovery Test Script
# =============================================================================
# Validates backup integrity and restore capability for the protocol server.
# Run against the testnet environment — NEVER against production.
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

# Validate required environment variables
: "${POSTGRES_HOST:?POSTGRES_HOST is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${AUDIT_HOST:?AUDIT_HOST is required}"
: "${AUDIT_USER:?AUDIT_USER is required}"
: "${AUDIT_DB:?AUDIT_DB is required}"

POSTGRES_PORT="${POSTGRES_PORT:-5432}"
AUDIT_PORT="${AUDIT_PORT:-5433}"
PROTOCOL_URL="${PROTOCOL_URL:-http://localhost:8300}"

echo "=== GTCX DR Test — $ENV ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

PASS=0
FAIL=0

check() {
  local name="$1"
  local result="$2"
  if [ "$result" = "true" ]; then
    echo "  [PASS] $name"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $name"
    FAIL=$((FAIL + 1))
  fi
}

# --- Step 1: Verify services are running ---
echo "Step 1: Service health"
HEALTH=$(curl -sf "$PROTOCOL_URL/health" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
check "Protocol server health" "$([ "$HEALTH" = "ok" ] && echo true || echo false)"

PG_OK=$(PGPASSWORD="${POSTGRES_PASSWORD:-gtcx_dev_password}" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1" -t -A 2>/dev/null || echo "")
check "PostgreSQL operational" "$([ "$PG_OK" = "1" ] && echo true || echo false)"

AUDIT_OK=$(PGPASSWORD="${POSTGRES_AUDIT_PASSWORD:-gtcx_audit_dev_password}" psql -h "$AUDIT_HOST" -p "$AUDIT_PORT" -U "$AUDIT_USER" -d "$AUDIT_DB" -c "SELECT 1" -t -A 2>/dev/null || echo "")
check "PostgreSQL audit" "$([ "$AUDIT_OK" = "1" ] && echo true || echo false)"

# --- Step 2: Insert test data ---
echo ""
echo "Step 2: Insert test data"
DR_MARKER="dr_test_$(date +%s)"
PGPASSWORD="${POSTGRES_PASSWORD:-gtcx_dev_password}" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
  CREATE TABLE IF NOT EXISTS dr_test_markers (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW());
  INSERT INTO dr_test_markers (id) VALUES ('$DR_MARKER') ON CONFLICT DO NOTHING;
" 2>/dev/null
INSERTED=$(PGPASSWORD="${POSTGRES_PASSWORD:-gtcx_dev_password}" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id FROM dr_test_markers WHERE id = '$DR_MARKER'" -t -A 2>/dev/null || echo "")
check "Test marker inserted" "$([ "$INSERTED" = "$DR_MARKER" ] && echo true || echo false)"

# --- Step 3: Create backup ---
echo ""
echo "Step 3: Backup"
BACKUP_FILE="/tmp/gtcx_dr_test_${ENV}_$(date +%Y%m%d%H%M%S).sql"
PGPASSWORD="${POSTGRES_PASSWORD:-gtcx_dev_password}" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl > "$BACKUP_FILE" 2>/dev/null
BACKUP_SIZE=$(wc -c < "$BACKUP_FILE" 2>/dev/null || echo "0")
check "Backup created ($BACKUP_SIZE bytes)" "$([ "$BACKUP_SIZE" -gt 100 ] && echo true || echo false)"

# --- Step 4: Verify backup contains test marker ---
echo ""
echo "Step 4: Backup verification"
MARKER_IN_BACKUP=$(grep -c "$DR_MARKER" "$BACKUP_FILE" 2>/dev/null || echo "0")
check "Test marker in backup" "$([ "$MARKER_IN_BACKUP" -gt 0 ] && echo true || echo false)"

# --- Step 5: Simulate restore (to a temp database) ---
echo ""
echo "Step 5: Restore test"
RESTORE_DB="gtcx_dr_test_restore"
PGPASSWORD="${POSTGRES_PASSWORD:-gtcx_dev_password}" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "postgres" -c "DROP DATABASE IF EXISTS $RESTORE_DB; CREATE DATABASE $RESTORE_DB;" 2>/dev/null
PGPASSWORD="${POSTGRES_PASSWORD:-gtcx_dev_password}" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$RESTORE_DB" < "$BACKUP_FILE" > /dev/null 2>&1
RESTORED=$(PGPASSWORD="${POSTGRES_PASSWORD:-gtcx_dev_password}" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$RESTORE_DB" -c "SELECT id FROM dr_test_markers WHERE id = '$DR_MARKER'" -t -A 2>/dev/null || echo "")
check "Test marker restored" "$([ "$RESTORED" = "$DR_MARKER" ] && echo true || echo false)"

# --- Step 6: Cleanup ---
echo ""
echo "Step 6: Cleanup"
PGPASSWORD="${POSTGRES_PASSWORD:-gtcx_dev_password}" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "postgres" -c "DROP DATABASE IF EXISTS $RESTORE_DB;" 2>/dev/null
PGPASSWORD="${POSTGRES_PASSWORD:-gtcx_dev_password}" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DELETE FROM dr_test_markers WHERE id = '$DR_MARKER';" 2>/dev/null
rm -f "$BACKUP_FILE"
echo "  Cleanup complete"

# --- Summary ---
echo ""
echo "=== DR Test Summary ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo "  Status: $([ "$FAIL" -eq 0 ] && echo 'PASS' || echo 'FAIL')"
echo "  Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

exit "$FAIL"
