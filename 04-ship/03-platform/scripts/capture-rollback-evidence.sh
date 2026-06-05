#!/usr/bin/env bash
# =============================================================================
# GTCX Rollback Evidence Capture
# =============================================================================
# Captures post-rollback cluster state and rollout history into a local bundle.
# Generated artifacts land under 04-ship/security/reports/rollback-evidence/ by
# default and should not be committed.
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

ENVIRONMENT="${1:-}"
OUTPUT_DIR=""
REASON="manual"
SMOKE_BASE_URL="${SMOKE_BASE_URL:-}"
SCENARIO="${SCENARIO:-rollback evidence capture}"
PREVIOUS_REVISION="${PREVIOUS_REVISION:-unknown}"
FAILED_REVISION="${FAILED_REVISION:-unknown}"

usage() {
    cat <<'EOF'
Usage:
  capture-rollback-evidence.sh <environment> [options]

Options:
  --output-dir=<path>     Where to write the evidence bundle
  --reason=<text>         Reason label for the bundle
  --scenario=<text>       Scenario label for machine-readable evidence
  --previous-revision=<v> Previous known-good revision or image tag
  --failed-revision=<v>   Failed revision or image tag that triggered rollback
  --smoke-base-url=<url>  Optional external URL to probe after rollback
  --help, -h              Show this help
EOF
}

if [[ -z "${ENVIRONMENT}" ]] || [[ "${ENVIRONMENT}" == "--help" ]] || [[ "${ENVIRONMENT}" == "-h" ]]; then
    usage
    exit 0
fi

shift || true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --output-dir=*) OUTPUT_DIR="${1#*=}" ;;
        --reason=*) REASON="${1#*=}" ;;
        --scenario=*) SCENARIO="${1#*=}" ;;
        --previous-revision=*) PREVIOUS_REVISION="${1#*=}" ;;
        --failed-revision=*) FAILED_REVISION="${1#*=}" ;;
        --smoke-base-url=*) SMOKE_BASE_URL="${1#*=}" ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown argument: $1"
            usage
            exit 1
            ;;
    esac
    shift
done

case "${ENVIRONMENT}" in
    development|dev)
        ENVIRONMENT="development"
        NAMESPACE="gtcx-dev"
        ;;
    staging|stg)
        ENVIRONMENT="staging"
        NAMESPACE="gtcx-staging"
        ;;
    testnet|testnet-pilot)
        ENVIRONMENT="testnet-pilot"
        NAMESPACE="gtcx-testnet"
        ;;
    production|prod)
        ENVIRONMENT="production"
        NAMESPACE="gtcx-production"
        ;;
    *)
        log_error "Unsupported environment: ${ENVIRONMENT}"
        exit 1
        ;;
esac

command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required"; exit 1; }
command -v jq >/dev/null 2>&1 || { log_error "jq is required"; exit 1; }
kubectl cluster-info >/dev/null

if [[ -z "${OUTPUT_DIR}" ]]; then
    OUTPUT_DIR="04-ship/security/reports/rollback-evidence/${ENVIRONMENT}/$(date -u +%Y%m%dT%H%M%SZ)"
fi

mkdir -p "${OUTPUT_DIR}"

log_info "Writing rollback evidence to ${OUTPUT_DIR}"

rollback_started_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

kubectl get deployments -n "${NAMESPACE}" -o wide > "${OUTPUT_DIR}/deployments.txt"
kubectl get pods -n "${NAMESPACE}" -o wide > "${OUTPUT_DIR}/pods.txt"
kubectl get svc -n "${NAMESPACE}" > "${OUTPUT_DIR}/services.txt"
kubectl get ingress -n "${NAMESPACE}" > "${OUTPUT_DIR}/ingress.txt" 2>/dev/null || true
kubectl get events -n "${NAMESPACE}" --sort-by=.lastTimestamp > "${OUTPUT_DIR}/events.txt" 2>/dev/null || true

deployments=$(kubectl get deployments -n "${NAMESPACE}" -l app.kubernetes.io/part-of=gtcx -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
for dep in ${deployments}; do
    kubectl rollout history "deployment/${dep}" -n "${NAMESPACE}" > "${OUTPUT_DIR}/rollout-history-${dep}.txt" 2>/dev/null || true
    kubectl describe "deployment/${dep}" -n "${NAMESPACE}" > "${OUTPUT_DIR}/describe-${dep}.txt"
done

health_result="not-run"
if [[ -n "${SMOKE_BASE_URL}" ]] && command -v curl >/dev/null 2>&1; then
    if curl -fsS "${SMOKE_BASE_URL%/}/health" > "${OUTPUT_DIR}/smoke-health.txt" 2>&1; then
        health_result="external-ok"
    else
        health_result="external-failed"
    fi
else
    api_pod=$(kubectl get pods -n "${NAMESPACE}" -l app=gtcx-agx -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [[ -n "${api_pod}" ]]; then
        if kubectl exec "${api_pod}" -n "${NAMESPACE}" -- wget -q -O - http://localhost:3000/api/health > "${OUTPUT_DIR}/pod-health.txt" 2>&1; then
            health_result="pod-ok"
        else
            health_result="pod-failed"
        fi
    fi
fi

metrics_result="not-run"
if [[ -n "${SMOKE_BASE_URL}" ]] && command -v curl >/dev/null 2>&1; then
    if curl -fsS "${SMOKE_BASE_URL%/}/metrics" > "${OUTPUT_DIR}/smoke-metrics.txt" 2>&1; then
        metrics_result="external-ok"
    else
        metrics_result="external-failed"
    fi
fi

status_from_result() {
    case "$1" in
        external-ok|pod-ok) printf 'passed\n' ;;
        *) printf 'failed\n' ;;
    esac
}

rollback_completed_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
health_status="$(status_from_result "${health_result}")"
metrics_status="$(status_from_result "${metrics_result}")"

jq -n \
    --arg scenario "${SCENARIO}" \
    --arg previousRevision "${PREVIOUS_REVISION}" \
    --arg failedRevision "${FAILED_REVISION}" \
    --arg rollbackStartedAt "${rollback_started_at}" \
    --arg rollbackCompletedAt "${rollback_completed_at}" \
    --arg environment "${ENVIRONMENT}" \
    --arg namespace "${NAMESPACE}" \
    --arg reason "${REASON}" \
    --arg healthStatus "${health_status}" \
    --arg healthResult "${health_result}" \
    --arg metricsStatus "${metrics_status}" \
    --arg metricsResult "${metrics_result}" \
    --arg evidenceDirectory "${OUTPUT_DIR}" \
    '{
      schemaVersion: 1,
      scenario: $scenario,
      previousRevision: $previousRevision,
      failedRevision: $failedRevision,
      rollbackStartedAt: $rollbackStartedAt,
      rollbackCompletedAt: $rollbackCompletedAt,
      environment: $environment,
      namespace: $namespace,
      reason: $reason,
      healthAfterRollback: {
        status: $healthStatus,
        result: $healthResult
      },
      metricsAfterRollback: {
        status: $metricsStatus,
        result: $metricsResult
      },
      evidenceDirectory: $evidenceDirectory
    }' > "${OUTPUT_DIR}/rollback-evidence.json"

cat > "${OUTPUT_DIR}/summary.md" <<EOF
# Rollback Evidence

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Environment: ${ENVIRONMENT}
- Namespace: ${NAMESPACE}
- Reason: ${REASON}
- Smoke check result: ${health_result}
- Metrics check result: ${metrics_result}

## Files

- rollback-evidence.json
- deployments.txt
- pods.txt
- services.txt
- ingress.txt
- events.txt
- rollout-history-*.txt
- describe-*.txt
EOF

log_success "Rollback evidence captured"
