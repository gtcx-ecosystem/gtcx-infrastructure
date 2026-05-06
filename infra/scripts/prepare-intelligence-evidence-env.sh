#!/usr/bin/env bash
# =============================================================================
# GTCX Intelligence Evidence Environment Helper
# =============================================================================
# Reads Terraform output JSON plus Secrets Manager values and emits the env vars
# needed for intelligence evidence runners.
#
# Example:
#   terraform -chdir=infra/terraform/environments/testnet-pilot output -json > /tmp/testnet-outputs.json
#   ./infra/scripts/prepare-intelligence-evidence-env.sh \
#     --terraform-output-file=/tmp/testnet-outputs.json \
#     --mode=sandbox
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[INFO]${NC} $1" >&2; }
log_success() { echo -e "${GREEN}[OK]${NC} $1" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

TERRAFORM_OUTPUT_FILE=""
MODE_OVERRIDE=""
FAILURE_TARGET_OVERRIDE=""
OUTPUT_FORMAT="export"
WRITE_ENV_FILE=""
AWS_REGION="${AWS_REGION:-af-south-1}"

usage() {
    cat <<'EOF'
Usage:
  prepare-intelligence-evidence-env.sh --terraform-output-file=<path> [options]

Options:
  --terraform-output-file=<path>  terraform output -json file for the target environment
  --mode=<value>                  Override provider mode: normal, sandbox, forced-failure
  --failure-target=<value>        Override provider failure target
  --format=<export|dotenv>        Output shell exports or dotenv entries (default: export)
  --write-env-file=<path>         Write output to a file instead of stdout
  --aws-region=<region>           AWS region for Secrets Manager (default: af-south-1)
  --help, -h                      Show this help
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --terraform-output-file=*) TERRAFORM_OUTPUT_FILE="${1#*=}" ;;
        --mode=*) MODE_OVERRIDE="${1#*=}" ;;
        --failure-target=*) FAILURE_TARGET_OVERRIDE="${1#*=}" ;;
        --format=*) OUTPUT_FORMAT="${1#*=}" ;;
        --write-env-file=*) WRITE_ENV_FILE="${1#*=}" ;;
        --aws-region=*) AWS_REGION="${1#*=}" ;;
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

if [[ -z "${TERRAFORM_OUTPUT_FILE}" ]]; then
    log_error "--terraform-output-file is required"
    usage
    exit 1
fi

if [[ ! -f "${TERRAFORM_OUTPUT_FILE}" ]]; then
    log_error "Terraform output file not found: ${TERRAFORM_OUTPUT_FILE}"
    exit 1
fi

command -v jq >/dev/null 2>&1 || { log_error "jq is required"; exit 1; }
command -v aws >/dev/null 2>&1 || { log_error "aws CLI is required"; exit 1; }

read_output() {
    local expr="$1"
    jq -er "${expr}" "${TERRAFORM_OUTPUT_FILE}"
}

extract_secret_value() {
    local arn="$1"
    local field="${2:-}"
    local secret_string

    secret_string="$(aws secretsmanager get-secret-value \
        --secret-id "${arn}" \
        --region "${AWS_REGION}" \
        --query SecretString \
        --output text)"

    if [[ -n "${field}" ]]; then
        jq -er --arg field "${field}" '.[$field]' <<<"${secret_string}"
    else
        if jq -e . >/dev/null 2>&1 <<<"${secret_string}"; then
            jq -r '.' <<<"${secret_string}"
        else
            printf '%s\n' "${secret_string}"
        fi
    fi
}

emit_line() {
    local key="$1"
    local value="$2"

    if [[ "${OUTPUT_FORMAT}" == "dotenv" ]]; then
        printf '%s=%s\n' "${key}" "${value}"
    else
        printf 'export %s=%q\n' "${key}" "${value}"
    fi
}

SMOKE_BASE_URL="$(read_output '.smoke_evidence_base_url.value')"
PROVIDER_MODE="$(read_output '.provider_failure_mode.value')"
PROVIDER_FAILURE_TARGET="$(read_output '.provider_failure_target.value')"

if [[ -n "${MODE_OVERRIDE}" ]]; then
    PROVIDER_MODE="${MODE_OVERRIDE}"
fi

if [[ -n "${FAILURE_TARGET_OVERRIDE}" ]]; then
    PROVIDER_FAILURE_TARGET="${FAILURE_TARGET_OVERRIDE}"
fi

ANTHROPIC_SANDBOX_ARN="$(read_output '.sandbox_secret_arns.value.anthropic_sandbox')"
OPENAI_SANDBOX_ARN="$(read_output '.sandbox_secret_arns.value.openai_sandbox')"
COMPLY_ADVANTAGE_SANDBOX_ARN="$(read_output '.sandbox_secret_arns.value.comply_advantage_sandbox')"
PROVIDER_MODE_SECRET_ARN="$(read_output '.sandbox_secret_arns.value.provider_mode')"
PROVIDER_FAILURE_TARGET_SECRET_ARN="$(read_output '.sandbox_secret_arns.value.provider_failure_target')"

ANTHROPIC_KEY="$(extract_secret_value "${ANTHROPIC_SANDBOX_ARN}" api_key)"
OPENAI_KEY="$(extract_secret_value "${OPENAI_SANDBOX_ARN}" api_key)"
COMPLY_ADVANTAGE_KEY="$(extract_secret_value "${COMPLY_ADVANTAGE_SANDBOX_ARN}" api_key)"

EFFECTIVE_PROVIDER_MODE="${PROVIDER_MODE}"
if [[ -n "${PROVIDER_MODE_SECRET_ARN}" ]] && [[ -z "${MODE_OVERRIDE}" ]]; then
    EFFECTIVE_PROVIDER_MODE="$(extract_secret_value "${PROVIDER_MODE_SECRET_ARN}")"
fi

EFFECTIVE_PROVIDER_FAILURE_TARGET="${PROVIDER_FAILURE_TARGET}"
if [[ -n "${PROVIDER_FAILURE_TARGET_SECRET_ARN}" ]] && [[ -z "${FAILURE_TARGET_OVERRIDE}" ]]; then
    EFFECTIVE_PROVIDER_FAILURE_TARGET="$(extract_secret_value "${PROVIDER_FAILURE_TARGET_SECRET_ARN}")"
fi

tmp_output="$(mktemp)"
trap 'rm -f "${tmp_output}"' EXIT

emit_line "SMOKE_EVIDENCE_BASE_URL" "${SMOKE_BASE_URL}" >> "${tmp_output}"
emit_line "ANTHROPIC_API_KEY" "${ANTHROPIC_KEY}" >> "${tmp_output}"
emit_line "OPENAI_API_KEY" "${OPENAI_KEY}" >> "${tmp_output}"
emit_line "COMPLY_ADVANTAGE_API_KEY" "${COMPLY_ADVANTAGE_KEY}" >> "${tmp_output}"
emit_line "INTELLIGENCE_PROVIDER_MODE" "${EFFECTIVE_PROVIDER_MODE}" >> "${tmp_output}"
emit_line "INTELLIGENCE_PROVIDER_FAILURE_TARGET" "${EFFECTIVE_PROVIDER_FAILURE_TARGET}" >> "${tmp_output}"

if [[ -n "${WRITE_ENV_FILE}" ]]; then
    cp "${tmp_output}" "${WRITE_ENV_FILE}"
    log_success "Wrote evidence environment to ${WRITE_ENV_FILE}"
else
    cat "${tmp_output}"
fi

log_info "Smoke base URL: ${SMOKE_BASE_URL}"
log_info "Provider mode: ${EFFECTIVE_PROVIDER_MODE}"
log_info "Provider failure target: ${EFFECTIVE_PROVIDER_FAILURE_TARGET}"
