#!/usr/bin/env bash
# =============================================================================
# Audit Immutability Fixture
# =============================================================================
# Exercises migrate.sh against an ephemeral PostgreSQL fixture to prove that:
#   1. append-only audit grants pass verification
#   2. update/delete privileges on the audit writer fail verification
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONTAINER_NAME="gtcx-audit-immutability-${RANDOM}-${RANDOM}"
TMP_DIR="$(mktemp -d)"

cleanup() {
    docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
    rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        log_error "Required command not found: $1"
        exit 1
    fi
}

require_command docker
require_command psql

log_info "Starting ephemeral PostgreSQL fixture..."
docker run -d --rm \
    --name "${CONTAINER_NAME}" \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=gtcx_operational \
    -p 127.0.0.1::5432 \
    postgres:16.4-alpine >/dev/null

HOST_PORT="$(docker port "${CONTAINER_NAME}" 5432/tcp | awk -F: 'NR==1 {print $2}')"
if [[ -z "${HOST_PORT}" ]]; then
    log_error "Could not determine mapped PostgreSQL port"
    exit 1
fi

ROOT_DSN="postgresql://postgres:postgres@127.0.0.1:${HOST_PORT}"
OP_DSN="${ROOT_DSN}/gtcx_operational"
AUDIT_ADMIN_DSN="${ROOT_DSN}/gtcx_audit"
AUDIT_WRITER_DSN="postgresql://gtcx_audit_writer:audit_writer_password@127.0.0.1:${HOST_PORT}/gtcx_audit"

log_info "Waiting for PostgreSQL readiness..."
for _ in $(seq 1 30); do
    if psql "${ROOT_DSN}/postgres" -c "SELECT 1" >/dev/null 2>&1; then
        break
    fi
    sleep 1
done

if ! psql "${ROOT_DSN}/postgres" -c "SELECT 1" >/dev/null 2>&1; then
    log_error "PostgreSQL fixture did not become ready in time"
    exit 1
fi

log_info "Configuring operational and audit databases..."
psql "${ROOT_DSN}/postgres" -X -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
SELECT 'CREATE DATABASE gtcx_audit'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'gtcx_audit') \gexec

SELECT 'CREATE ROLE gtcx_audit_writer LOGIN PASSWORD ''audit_writer_password'''
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gtcx_audit_writer') \gexec
SQL

psql "${AUDIT_ADMIN_DSN}" -X -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
CREATE TABLE IF NOT EXISTS public.replay_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nonce TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

REVOKE ALL ON public.replay_events FROM PUBLIC;
REVOKE ALL ON public.replay_events FROM gtcx_audit_writer;
GRANT INSERT, SELECT ON public.replay_events TO gtcx_audit_writer;
GRANT USAGE, SELECT ON SEQUENCE public.replay_events_id_seq TO gtcx_audit_writer;
SQL

SUCCESS_LOG="${TMP_DIR}/migrate-success.log"
FAILURE_LOG="${TMP_DIR}/migrate-failure.log"

log_info "Running positive append-only verification..."
if ! (
    cd "${PROJECT_ROOT}" && \
    DATABASE_URL="${OP_DSN}" \
    AUDIT_DATABASE_URL="${AUDIT_ADMIN_DSN}" \
    AUDIT_WRITER_DATABASE_URL="${AUDIT_WRITER_DSN}" \
    bash 04-ship/03-platform/scripts/migrate.sh staging --dry-run
) >"${SUCCESS_LOG}" 2>&1; then
    cat "${SUCCESS_LOG}" >&2
    log_error "migrate.sh should pass when the audit writer is append-only"
    exit 1
fi

log_info "Introducing forbidden UPDATE privilege to validate the negative probe..."
psql "${AUDIT_ADMIN_DSN}" -X -v ON_ERROR_STOP=1 \
    -c 'GRANT UPDATE ON TABLE public.replay_events TO gtcx_audit_writer;' >/dev/null

set +e
(
    cd "${PROJECT_ROOT}" && \
    DATABASE_URL="${OP_DSN}" \
    AUDIT_DATABASE_URL="${AUDIT_ADMIN_DSN}" \
    AUDIT_WRITER_DATABASE_URL="${AUDIT_WRITER_DSN}" \
    bash 04-ship/03-platform/scripts/migrate.sh staging --dry-run
) >"${FAILURE_LOG}" 2>&1
STATUS=$?
set -e

if [[ "${STATUS}" -eq 0 ]]; then
    cat "${FAILURE_LOG}" >&2
    log_error "migrate.sh unexpectedly passed after UPDATE privilege was granted"
    exit 1
fi

if ! grep -Eq 'unexpectedly has UPDATE|Live UPDATE probe unexpectedly succeeded' "${FAILURE_LOG}"; then
    cat "${FAILURE_LOG}" >&2
    log_error "Negative probe failed, but not for the expected audit immutability reason"
    exit 1
fi

log_success "Audit immutability fixture passed"
