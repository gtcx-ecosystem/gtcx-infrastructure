#!/usr/bin/env bash
# =============================================================================
# GTCX Build & Push — Container images to ECR
# =============================================================================
# Builds Docker images from ecosystem repos and pushes to ECR.
#
# Usage:
#   ./infra/scripts/build-push.sh                    # Build all, push all
#   ./infra/scripts/build-push.sh protocols           # Build + push one service
#   ./infra/scripts/build-push.sh --list              # List available services
#   ./infra/scripts/build-push.sh --version=sha-abc   # Custom immutable tag
#
# Prerequisites:
#   - Docker running
#   - AWS CLI configured for af-south-1
#   - Ecosystem repos cloned at the same level as gtcx-infrastructure
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
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${INFRA_ROOT}/.." && pwd)"
ECOSYSTEM_ROOT="${GTCX_ECOSYSTEM_ROOT:-$(cd "${REPO_ROOT}/.." && pwd)}"

require_ecosystem_repos() {
    if [[ ! -d "${ECOSYSTEM_ROOT}/gtcx-intelligence" ]] || [[ ! -d "${ECOSYSTEM_ROOT}/gtcx-protocols" ]]; then
        log_error "Cannot find required ecosystem repos in ${ECOSYSTEM_ROOT}"
        log_error "Set GTCX_ECOSYSTEM_ROOT or ensure repos are cloned alongside gtcx-infrastructure:"
        log_error "  ../gtcx-intelligence"
        log_error "  ../gtcx-protocols"
        exit 1
    fi
}

AWS_REGION="${AWS_REGION:-af-south-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
VERSION=""
TARGET_SERVICE=""

# =============================================================================
# Service definitions: name → dockerfile, context dir, build args
# Bash 3 compatibility: use case statements instead of associative arrays.
# =============================================================================

service_exists() {
    case "$1" in
        protocols|agx|intelligence-sdk|trainer|redteam|compliance-gateway) return 0 ;;
        *) return 1 ;;
    esac
}

service_dockerfile() {
    case "$1" in
        protocols) echo "Dockerfile" ;;
        agx) echo "${ECOSYSTEM_ROOT}/gtcx-platforms/Dockerfile" ;;
        intelligence-sdk) echo "${ECOSYSTEM_ROOT}/gtcx-intelligence/intelligence/sdk/Dockerfile" ;;
        trainer) echo "${ECOSYSTEM_ROOT}/gtcx-intelligence/intelligence/trainer/Dockerfile" ;;
        redteam) echo "${ECOSYSTEM_ROOT}/gtcx-intelligence/intelligence/red-team/Dockerfile" ;;
        compliance-gateway) echo "tools/compliance-gateway/Dockerfile" ;;
        *) return 1 ;;
    esac
}

service_context() {
    case "$1" in
        protocols) echo "${ECOSYSTEM_ROOT}/gtcx-protocols" ;;
        agx) echo "${ECOSYSTEM_ROOT}/gtcx-platforms" ;;
        intelligence-sdk|trainer|redteam) echo "${ECOSYSTEM_ROOT}/gtcx-intelligence" ;;
        compliance-gateway) echo "${REPO_ROOT}" ;;
        *) return 1 ;;
    esac
}

service_args() {
    case "$1" in
        protocols) echo "" ;;
        agx) echo "--build-arg PLATFORM=agx --build-arg APP_PORT=3000" ;;
        intelligence-sdk|trainer|redteam|compliance-gateway) echo "" ;;
        *) return 1 ;;
    esac
}

service_ecr_repo() {
    case "$1" in
        protocols) echo "gtcx-protocols" ;;
        agx) echo "gtcx-agx" ;;
        intelligence-sdk) echo "gtcx-intelligence-sdk" ;;
        trainer) echo "gtcx-intelligence-trainer" ;;
        redteam) echo "gtcx-intelligence-redteam" ;;
        compliance-gateway) echo "compliance-gateway" ;;
        *) return 1 ;;
    esac
}

ALL_SERVICES=(protocols agx intelligence-sdk trainer redteam compliance-gateway)

# =============================================================================
# Parse arguments
# =============================================================================

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version=*) VERSION="${1#*=}"; shift ;;
        --list)
            echo "Available services:"
            for svc in "${ALL_SERVICES[@]}"; do
                echo "  ${svc}"
            done
            exit 0
            ;;
        --help|-h)
            echo "Usage: $(basename "$0") [service] [--version=TAG]"
            echo ""
            echo "Services: ${ALL_SERVICES[*]}"
            echo "Omit service name to build all."
            exit 0
            ;;
        -*)
            log_error "Unknown flag: $1"
            exit 1
            ;;
        *)
            TARGET_SERVICE="$1"
            shift
            ;;
    esac
done

require_ecosystem_repos

# =============================================================================
# Resolve version
# =============================================================================

if [[ -z "${VERSION}" ]]; then
    VERSION="sha-$(git -C "${INFRA_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "unknown")"
fi

log_info "Version: ${VERSION}"

# =============================================================================
# ECR login
# =============================================================================

ecr_login() {
    if [[ -z "${AWS_ACCOUNT_ID}" ]]; then
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
        if [[ -z "${AWS_ACCOUNT_ID}" ]]; then
            log_error "Cannot determine AWS account ID. Set AWS_ACCOUNT_ID or configure AWS CLI."
            exit 1
        fi
    fi

    local registry="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    log_info "Logging into ECR: ${registry}" >&2
    aws ecr get-login-password --region "${AWS_REGION}" \
        | docker login --username AWS --password-stdin "${registry}" 2>/dev/null

    echo "${registry}"
}

# =============================================================================
# Build and push one service
# =============================================================================

build_and_push() {
    local svc="$1"
    local registry="$2"

    local dockerfile_ref
    dockerfile_ref="$(service_dockerfile "$svc")"
    local dockerfile="$dockerfile_ref"
    if [[ "${dockerfile_ref}" != /* ]]; then
        if [[ "$svc" == "compliance-gateway" ]]; then
            dockerfile="${REPO_ROOT}/${dockerfile_ref}"
        else
            dockerfile="${INFRA_ROOT}/${dockerfile_ref}"
        fi
    fi
    local context
    context="$(service_context "$svc")"
    local args
    args="$(service_args "$svc")"
    local ecr_repo
    ecr_repo="${registry}/$(service_ecr_repo "$svc")"

    # Validate
    if [[ ! -f "${dockerfile}" ]]; then
        log_error "Dockerfile not found: ${dockerfile}"
        return 1
    fi
    if [[ ! -d "${context}" ]]; then
        log_error "Context directory not found: ${context}"
        log_warning "Clone the repo: git clone <url> ${context}"
        return 1
    fi

    log_info "Building ${svc}..."
    log_info "  Dockerfile: ${dockerfile}"
    log_info "  Context:    ${context}"
    log_info "  Tag:        ${ecr_repo}:${VERSION}"

    # shellcheck disable=SC2086
    docker build \
        -f "${dockerfile}" \
        ${args} \
        -t "${ecr_repo}:${VERSION}" \
        "${context}"

    log_info "Pushing ${svc}..."
    docker push "${ecr_repo}:${VERSION}"

    log_success "${svc} → ${ecr_repo}:${VERSION}"
}

# =============================================================================
# Main
# =============================================================================

main() {
    local registry
    registry=$(ecr_login)

    local services=()
    if [[ -n "${TARGET_SERVICE}" ]]; then
        if ! service_exists "${TARGET_SERVICE}"; then
            log_error "Unknown service: ${TARGET_SERVICE}"
            log_info "Available: ${ALL_SERVICES[*]}"
            exit 1
        fi
        services=("${TARGET_SERVICE}")
    else
        services=("${ALL_SERVICES[@]}")
    fi

    local failed=()
    for svc in "${services[@]}"; do
        if ! build_and_push "${svc}" "${registry}"; then
            failed+=("${svc}")
            log_warning "Skipping ${svc} (build failed)"
        fi
    done

    echo ""
    log_success "============================================"
    log_success "  Build & Push Complete"
    log_success "  Version: ${VERSION}"
    log_success "  Registry: ${registry}"
    log_success "  Built: $(( ${#services[@]} - ${#failed[@]} ))/${#services[@]} services"
    if [[ ${#failed[@]} -gt 0 ]]; then
        log_warning "  Failed: ${failed[*]}"
    fi
    log_success "============================================"
    echo ""
    log_info "Next: update kustomization image tags and apply"
    log_info "  cd infra/kubernetes/overlays/<env>"
    log_info "  kustomize edit set image gtcx/protocols=${registry}/gtcx-protocols:${VERSION}"
    log_info "  kubectl apply -k ."
}

main
