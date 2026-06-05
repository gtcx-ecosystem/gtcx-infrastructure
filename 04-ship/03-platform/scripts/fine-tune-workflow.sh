#!/usr/bin/env bash
# =============================================================================
# GTCX Fine-Tune Workflow Operator Helper
# =============================================================================
# Safe operator path for manual Argo workflow runs and fast cron suspension.
#
# Usage:
#   ./04-ship/03-platform/scripts/fine-tune-workflow.sh status
#   ./04-ship/03-platform/scripts/fine-tune-workflow.sh trigger --environment=testnet-pilot --dataset-version=2026-05-06
#   ./04-ship/03-platform/scripts/fine-tune-workflow.sh suspend
#   ./04-ship/03-platform/scripts/fine-tune-workflow.sh resume
#
# Assumptions:
#   - kubectl is already configured for the target cluster
#   - Argo resources exist in the target namespace
#   - enable_fine_tune_workflow remains false until policy evidence is satisfied
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

COMMAND="${1:-}"

NAMESPACE="${NAMESPACE:-argo-workflows}"
WORKFLOW_TEMPLATE_NAME="${WORKFLOW_TEMPLATE_NAME:-intelligence-fine-tune-cycle}"
CRON_WORKFLOW_NAME="${CRON_WORKFLOW_NAME:-intelligence-fine-tune-biweekly}"
ENVIRONMENT="${ENVIRONMENT:-unknown}"
MODEL_ID="${MODEL_ID:-cortex-anomaly-detector}"
DATASET_VERSION="${DATASET_VERSION:-}"
EVAL_THRESHOLD="${EVAL_THRESHOLD:-0.05}"
DRY_RUN=false
REASON="${REASON:-manual-operator-run}"

usage() {
    cat <<'EOF'
Usage:
  fine-tune-workflow.sh <status|trigger|suspend|resume> [options]

Commands:
  status    Show WorkflowTemplate/CronWorkflow status and recent workflow runs
  trigger   Submit one manual workflow from the WorkflowTemplate
  suspend   Suspend the CronWorkflow so no new scheduled runs start
  resume    Resume the CronWorkflow after approval

Options:
  --environment=<name>       Environment label for the manual run
  --namespace=<name>         Kubernetes namespace (default: argo-workflows)
  --template-name=<name>     WorkflowTemplate name
  --cron-name=<name>         CronWorkflow name
  --model-id=<id>            Model ID passed to the workflow
  --dataset-version=<value>  Dataset version for manual trigger (required for trigger)
  --eval-threshold=<value>   Evaluation threshold for manual trigger
  --reason=<text>            Reason annotation for manual trigger
  --dry-run                  Print intended action without mutating the cluster
  --help, -h                 Show this help
EOF
}

if [[ -z "${COMMAND}" ]] || [[ "${COMMAND}" == "--help" ]] || [[ "${COMMAND}" == "-h" ]]; then
    usage
    exit 0
fi

shift || true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --environment=*) ENVIRONMENT="${1#*=}" ;;
        --namespace=*) NAMESPACE="${1#*=}" ;;
        --template-name=*) WORKFLOW_TEMPLATE_NAME="${1#*=}" ;;
        --cron-name=*) CRON_WORKFLOW_NAME="${1#*=}" ;;
        --model-id=*) MODEL_ID="${1#*=}" ;;
        --dataset-version=*) DATASET_VERSION="${1#*=}" ;;
        --eval-threshold=*) EVAL_THRESHOLD="${1#*=}" ;;
        --reason=*) REASON="${1#*=}" ;;
        --dry-run) DRY_RUN=true ;;
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

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        log_error "Required command not found: $1"
        exit 1
    fi
}

preflight() {
    require_command kubectl
    kubectl cluster-info >/dev/null
}

resource_exists() {
    local kind="$1"
    local name="$2"
    kubectl get "$kind" "$name" -n "${NAMESPACE}" >/dev/null 2>&1
}

require_template() {
    if ! resource_exists workflowtemplate "${WORKFLOW_TEMPLATE_NAME}"; then
        log_error "WorkflowTemplate ${WORKFLOW_TEMPLATE_NAME} not found in namespace ${NAMESPACE}"
        log_error "The fine-tune workflow is likely still disabled in Terraform for this environment."
        exit 1
    fi
}

require_cron() {
    if ! resource_exists cronworkflow "${CRON_WORKFLOW_NAME}"; then
        log_error "CronWorkflow ${CRON_WORKFLOW_NAME} not found in namespace ${NAMESPACE}"
        log_error "The fine-tune workflow is likely still disabled in Terraform for this environment."
        exit 1
    fi
}

render_manual_workflow() {
    local workflow_name="$1"
    local requested_by
    requested_by="$(whoami 2>/dev/null || echo unknown)"

    cat <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: ${workflow_name}
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/part-of: gtcx-intelligence
    gtcx.trade/environment: ${ENVIRONMENT}
    gtcx.trade/trigger: manual
  annotations:
    gtcx.trade/reason: ${REASON}
    gtcx.trade/requested-by: ${requested_by}
spec:
  workflowTemplateRef:
    name: ${WORKFLOW_TEMPLATE_NAME}
  arguments:
    parameters:
      - name: model-id
        value: ${MODEL_ID}
      - name: dataset-version
        value: ${DATASET_VERSION}
      - name: eval-threshold
        value: ${EVAL_THRESHOLD}
EOF
}

show_recent_workflows() {
    log_info "Recent workflow runs in ${NAMESPACE}:"
    kubectl get workflows -n "${NAMESPACE}" \
        --sort-by=.metadata.creationTimestamp \
        -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,AGE:.metadata.creationTimestamp \
        2>/dev/null | tail -n 6 || true
}

show_status() {
    preflight

    log_info "Namespace: ${NAMESPACE}"
    if resource_exists workflowtemplate "${WORKFLOW_TEMPLATE_NAME}"; then
        log_success "WorkflowTemplate present: ${WORKFLOW_TEMPLATE_NAME}"
    else
        log_warning "WorkflowTemplate missing: ${WORKFLOW_TEMPLATE_NAME}"
    fi

    if resource_exists cronworkflow "${CRON_WORKFLOW_NAME}"; then
        local suspended
        suspended="$(kubectl get cronworkflow "${CRON_WORKFLOW_NAME}" -n "${NAMESPACE}" -o jsonpath='{.spec.suspend}' 2>/dev/null || true)"
        if [[ "${suspended}" == "true" ]]; then
            log_warning "CronWorkflow suspended: ${CRON_WORKFLOW_NAME}"
        else
            log_success "CronWorkflow active: ${CRON_WORKFLOW_NAME}"
        fi
    else
        log_warning "CronWorkflow missing: ${CRON_WORKFLOW_NAME}"
    fi

    show_recent_workflows
}

trigger_workflow() {
    preflight
    require_template

    if [[ -z "${DATASET_VERSION}" ]]; then
        log_error "--dataset-version is required for manual trigger"
        exit 1
    fi

    local workflow_name
    workflow_name="intelligence-fine-tune-manual-$(date -u +%Y%m%d%H%M%S)"

    log_info "Submitting manual workflow ${workflow_name}"
    log_info "  Environment: ${ENVIRONMENT}"
    log_info "  Model ID: ${MODEL_ID}"
    log_info "  Dataset version: ${DATASET_VERSION}"
    log_info "  Eval threshold: ${EVAL_THRESHOLD}"

    if [[ "${DRY_RUN}" == "true" ]]; then
        render_manual_workflow "${workflow_name}"
        return 0
    fi

    render_manual_workflow "${workflow_name}" | kubectl create -f -

    log_success "Manual workflow submitted: ${workflow_name}"
    echo "Watch:"
    echo "  kubectl get workflow ${workflow_name} -n ${NAMESPACE}"
    echo "  kubectl describe workflow ${workflow_name} -n ${NAMESPACE}"
    echo "  kubectl logs -n ${NAMESPACE} -l workflows.argoproj.io/workflow=${workflow_name} --all-containers=true"
}

patch_cron_suspend() {
    local suspend_value="$1"

    preflight
    require_cron

    if [[ "${DRY_RUN}" == "true" ]]; then
        echo "kubectl patch cronworkflow ${CRON_WORKFLOW_NAME} -n ${NAMESPACE} --type merge -p '{\"spec\":{\"suspend\":${suspend_value}}}'"
        return 0
    fi

    kubectl patch cronworkflow "${CRON_WORKFLOW_NAME}" \
        -n "${NAMESPACE}" \
        --type merge \
        -p "{\"spec\":{\"suspend\":${suspend_value}}}" >/dev/null

    local actual
    actual="$(kubectl get cronworkflow "${CRON_WORKFLOW_NAME}" -n "${NAMESPACE}" -o jsonpath='{.spec.suspend}')"

    if [[ "${actual}" != "${suspend_value}" ]]; then
        log_error "CronWorkflow ${CRON_WORKFLOW_NAME} did not reach suspend=${suspend_value}"
        exit 1
    fi
}

case "${COMMAND}" in
    status)
        show_status
        ;;
    trigger)
        trigger_workflow
        ;;
    suspend)
        patch_cron_suspend true
        log_success "CronWorkflow suspended: ${CRON_WORKFLOW_NAME}"
        show_recent_workflows
        ;;
    resume)
        patch_cron_suspend false
        log_success "CronWorkflow resumed: ${CRON_WORKFLOW_NAME}"
        ;;
    *)
        log_error "Unknown command: ${COMMAND}"
        usage
        exit 1
        ;;
esac
