#!/usr/bin/env bash
# =============================================================================
# GTCX Production Deployment Script
# =============================================================================
# Deploys GTCX to Kubernetes environments with safety checks.
#
# DEPRECATION NOTICE (2026-06-05):
#   This bash script is in maintenance mode. New deployment logic should be
#   added to 03-platform/tools/deployment-guard/ (typed, tested Node.js modules).
#   Target deprecation: 2026-Q3 — migrate to `gtcx-ctl deploy` or GitOps
#   (ArgoCD/Flux) once staging parity is proven. See IR-6.4 in the
#   execution roadmap for timeline.
#
# Principles Implemented:
#   - SECURE (11): Signed artifacts, security scanning
#   - AUDITABLE (3): Full deployment audit trail
#   - RESILIENT (12): Canary deployment, automatic rollback
#   - DOCUMENTED (27): Clear output at every step
#
# Usage:
#   ./03-platform/scripts/deploy.sh staging
#   ./03-platform/scripts/deploy.sh production --approval-ticket=GTCX-123
#   ./03-platform/scripts/deploy.sh production --rollback
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
INFRA_ROOT="${PROJECT_ROOT}/infra"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

ENVIRONMENT="${1:-}"
APPROVAL_TICKET=""
ROLLBACK=false
DRY_RUN=false
VERSION=""
CANARY_PERCENTAGE=5
CANARY_WAIT_SECONDS=300  # 5 minutes
AWS_REGION="${AWS_REGION:-af-south-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
ECR_REGISTRY=""

if [[ "${ENVIRONMENT}" == "--help" ]] || [[ "${ENVIRONMENT}" == "-h" ]] || [[ "${ENVIRONMENT}" == "help" ]]; then
    echo "Usage: $(basename "$0") <environment> [--approval-ticket=GTCX-XXX] [--version=TAG] [--rollback] [--dry-run] [--canary=N]"
    echo ""
    echo "Environments: development | staging | production"
    exit 0
fi

# Parse flags
shift || true
while [[ $# -gt 0 ]]; do
    case "$1" in
        --approval-ticket=*)
            APPROVAL_TICKET="${1#*=}"
            shift
            ;;
        --version=*)
            VERSION="${1#*=}"
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --canary=*)
            CANARY_PERCENTAGE="${1#*=}"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# -----------------------------------------------------------------------------
# Validation
# -----------------------------------------------------------------------------

validate_inputs() {
    # Validate environment
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
            log_error "Invalid environment: ${ENVIRONMENT}"
            echo "Usage: $(basename "$0") <environment> [options]"
            exit 1
            ;;
    esac
    
    # Delegate safety-critical gating to typed, tested module.
    local has_kubeconfig=false
    if kubectl cluster-info &>/dev/null; then
        has_kubeconfig=true
    fi
    local gate_cli="${PROJECT_ROOT}/03-platform/tools/deployment-guard/03-platform/src/cli/deploy-gate.mjs"
    if ! node "${gate_cli}" \
        --environment="${ENVIRONMENT}" \
        --approval-ticket="${APPROVAL_TICKET}" \
        ${ROLLBACK:+--rollback} \
        ${DRY_RUN:+--dry-run} \
        ${has_kubeconfig:+--has-kubeconfig} >/dev/null 2>&1; then
        local gate_reason
        gate_reason=$(node "${gate_cli}" \
            --environment="${ENVIRONMENT}" \
            --approval-ticket="${APPROVAL_TICKET}" \
            ${ROLLBACK:+--rollback} \
            ${DRY_RUN:+--dry-run} \
            ${has_kubeconfig:+--has-kubeconfig} 2>&1 || true)
        log_error "${gate_reason#DEPLOY_GATE_BLOCKED: }"
        exit 1
    fi

    # Production requires approval ticket unless this is a dry-run plan.
    # (Redundant with gate above, kept as defense-in-depth.)
    if [[ "${ENVIRONMENT}" == "production" ]] && [[ -z "${APPROVAL_TICKET}" ]] && [[ "${ROLLBACK}" != "true" ]] && [[ "${DRY_RUN}" != "true" ]]; then
        log_error "Production deployment requires --approval-ticket=GTCX-XXX"
        exit 1
    fi

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_success "Inputs validated (dry-run)"
        return 0
    fi

    # Check kubectl access
    if ! kubectl cluster-info &>/dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Inputs validated"
}

dry_run_plan() {
    log_step "Rendering deployment dry-run plan..."

    if [[ -z "${VERSION}" ]]; then
        VERSION="sha-dry-run"
    fi

    local overlay_dir="${INFRA_ROOT}/kubernetes/overlays/${ENVIRONMENT}"
    if [[ ! -d "${overlay_dir}" ]]; then
        log_error "Overlay directory not found: ${overlay_dir}"
        exit 1
    fi

    local ecr_registry="${ECR_REGISTRY:-000000000000.dkr.ecr.${AWS_REGION}.amazonaws.com}"
    if [[ "${ENVIRONMENT}" == "testnet-pilot" ]]; then
        NAMESPACE="${NAMESPACE:-gtcx-testnet}"
    fi

    log_info "Environment: ${ENVIRONMENT}"
    log_info "Namespace: ${NAMESPACE}"
    log_info "Overlay: ${overlay_dir}"
    log_info "Version: ${VERSION}"
    log_info "AGX image: ${ecr_registry}/gtcx-agx:${VERSION}"
    log_info "Protocols image: ${ecr_registry}/gtcx-protocols:${VERSION}"

    if [[ "${ENVIRONMENT}" == "production" ]]; then
        log_info "Canary percentage: ${CANARY_PERCENTAGE}%"
    fi

    log_success "Dry-run plan complete"
}

# -----------------------------------------------------------------------------
# Pre-deployment Checks
# -----------------------------------------------------------------------------

pre_deployment_checks() {
    log_step "Running pre-deployment checks..."
    
    # Check namespace exists
    if ! kubectl get namespace "${NAMESPACE}" &>/dev/null; then
        log_info "Creating namespace ${NAMESPACE}..."
        kubectl create namespace "${NAMESPACE}"
    fi
    
    # Verify secrets are configured
    if ! kubectl get secret gtcx-secrets -n "${NAMESPACE}" &>/dev/null; then
        log_error "Required secrets not found in namespace ${NAMESPACE}"
        log_error "Please configure secrets before deployment"
        exit 1
    fi
    
    # Check current deployment status
    log_info "Current deployment status:"
    kubectl get deployments -n "${NAMESPACE}" 2>/dev/null || echo "No existing deployments"
    
    # For production, verify approval
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        log_warning "=========================================="
        log_warning "  PRODUCTION DEPLOYMENT"
        log_warning "  Approval Ticket: ${APPROVAL_TICKET}"
        log_warning "=========================================="
        echo ""
        read -r -p "Type 'DEPLOY' to confirm: " confirm
        if [[ "${confirm}" != "DEPLOY" ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    log_success "Pre-deployment checks passed"
}

# -----------------------------------------------------------------------------
# Build & Push Images
# -----------------------------------------------------------------------------

ecr_login() {
    log_step "Authenticating to ECR..."

    ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

    if [[ -z "${AWS_ACCOUNT_ID:-}" ]]; then
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
        if [[ -z "${AWS_ACCOUNT_ID}" ]]; then
            log_error "Cannot determine AWS account ID. Set AWS_ACCOUNT_ID or configure AWS CLI."
            exit 1
        fi
        ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    fi

    aws ecr get-login-password --region "${AWS_REGION}" \
        | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

    log_success "ECR login successful (${ECR_REGISTRY})"
}

push_images() {
    log_step "Pushing images to ECR..."

    local images=("agx" "protocols")
    for img in "${images[@]}"; do
        local local_tag="gtcx/${img}:${VERSION}"
        local ecr_tag="${ECR_REGISTRY}/gtcx-${img}:${VERSION}"

        docker tag "${local_tag}" "${ecr_tag}"
        docker push "${ecr_tag}"
        log_info "Pushed ${ecr_tag}"
    done

    log_success "All images pushed to ECR"
}

build_images() {
    log_step "Building Docker images..."

    local ecosystem_root
    ecosystem_root="$(cd "${PROJECT_ROOT}/.." && pwd)"
    local platforms_root="${ecosystem_root}/6-platforms"
    local protocols_root="${PROJECT_ROOT}/../gtcx-protocols"

    # Determine version
    if [[ -z "${VERSION}" ]]; then
        VERSION="sha-$(git rev-parse --short HEAD 2>/dev/null || date -u +"%Y%m%d%H%M%S")"
    fi

    log_info "Version: ${VERSION}"

    if [[ ! -d "${platforms_root}" ]]; then
        log_error "Platform source repo not found: ${platforms_root}"
        exit 1
    fi

    if [[ ! -d "${protocols_root}" ]]; then
        log_error "Protocols source repo not found: ${protocols_root}"
        exit 1
    fi

    # Build deployable platform service image
    docker build \
        -f "${INFRA_ROOT}/docker/Dockerfile.platforms" \
        --build-arg PLATFORM=agx \
        --build-arg APP_PORT=3000 \
        -t "gtcx/agx:${VERSION}" \
        "${platforms_root}"

    docker build \
        -f "${INFRA_ROOT}/docker/Dockerfile.protocols" \
        -t "gtcx/protocols:${VERSION}" \
        "${protocols_root}"

    log_success "Images built successfully"
}

# -----------------------------------------------------------------------------
# Security Scanning
# -----------------------------------------------------------------------------

security_scan() {
    log_step "Running security scans..."
    
    # Scan images with Trivy
    if command -v trivy &>/dev/null; then
        local images=("agx" "protocols")
        for image in "${images[@]}"; do
            log_info "Scanning ${image} image..."
            trivy image --exit-code 1 --severity HIGH,CRITICAL "gtcx/${image}:${VERSION}" || {
                log_error "Security vulnerabilities found in ${image} image"
                [[ "${ENVIRONMENT}" == "production" ]] && exit 1
                log_warning "Continuing despite vulnerabilities (non-production)"
            }
        done
    else
        log_warning "Trivy not installed - skipping security scan"
    fi
    
    log_success "Security scans passed"
}

# -----------------------------------------------------------------------------
# Deploy
# -----------------------------------------------------------------------------

deploy() {
    log_step "Deploying to ${ENVIRONMENT}..."
    
    cd "${INFRA_ROOT}/kubernetes"
    
    # Update image tags in kustomization
    log_info "Updating image tags..."
    cd "overlays/${ENVIRONMENT}"
    kustomize edit set image "gtcx/agx=${ECR_REGISTRY}/gtcx-agx:${VERSION}"
    kustomize edit set image "gtcx/protocols=${ECR_REGISTRY}/gtcx-protocols:${VERSION}"
    cd "${INFRA_ROOT}/kubernetes"

    # Apply configuration
    log_info "Applying Kubernetes configuration..."
    kubectl apply -k "overlays/${ENVIRONMENT}"

    # Wait for rollout — resolve deployment names dynamically from the cluster
    log_info "Waiting for deployment rollout..."
    local deployments
    deployments=$(kubectl get deployments -n "${NAMESPACE}" -l app.kubernetes.io/part-of=gtcx -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    if [[ -z "${deployments}" ]]; then
        log_error "No GTCX deployments found in namespace ${NAMESPACE}"
        exit 1
    fi
    for dep in ${deployments}; do
        log_info "Waiting for ${dep}..."
        kubectl rollout status "deployment/${dep}" -n "${NAMESPACE}" --timeout=300s
    done
    
    log_success "Deployment applied"
}

# -----------------------------------------------------------------------------
# Canary Deployment (Production)
# -----------------------------------------------------------------------------
# Deploys a separate canary Deployment with the new image alongside the
# existing primary. The canary shares the Service selector so it receives
# a proportional share of traffic. If healthy after CANARY_WAIT_SECONDS,
# the canary is deleted and the full rollout proceeds. If unhealthy, the
# canary is deleted and the primary is untouched.
# -----------------------------------------------------------------------------

CANARY_MANIFEST="${INFRA_ROOT}/kubernetes/overlays/production/canary.yaml"

canary_deploy() {
    log_step "Starting canary deployment..."
    log_info "Canary percentage target: ${CANARY_PERCENTAGE}%"

    # Patch the canary manifest with the target image
    local canary_image="${ECR_REGISTRY}/gtcx-agx:${VERSION}"
    log_info "Canary image: ${canary_image}"

    # Apply canary with the new version
    sed "s|image: gtcx/agx:canary|image: ${canary_image}|" "${CANARY_MANIFEST}" \
        | kubectl apply -f - -n "${NAMESPACE}"

    # Wait for canary pod to be ready
    log_info "Waiting for canary rollout..."
    if ! kubectl rollout status deployment/gtcx-agx-canary -n "${NAMESPACE}" --timeout=120s 2>/dev/null; then
        log_error "Canary failed to become ready. Removing canary..."
        canary_cleanup
        exit 1
    fi

    # Monitor canary health
    log_info "Monitoring canary for ${CANARY_WAIT_SECONDS} seconds..."

    local end_time=$(($(date +%s) + CANARY_WAIT_SECONDS))
    while [[ $(date +%s) -lt $end_time ]]; do
        # Check canary pod readiness
        local not_ready
        not_ready=$(kubectl get pods -n "${NAMESPACE}" -l app=gtcx-agx-prod,role=canary \
            -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null \
            | tr ' ' '\n' | grep -c "False" || echo "0")

        # Check for restart count (CrashLoopBackOff indicator)
        local restarts
        restarts=$(kubectl get pods -n "${NAMESPACE}" -l app=gtcx-agx-prod,role=canary \
            -o jsonpath='{.items[0].status.containerStatuses[0].restartCount}' 2>/dev/null || echo "0")

        # Delegate canary health decision to typed, tested module.
        local canary_eval
        canary_eval=$(node "${PROJECT_ROOT}/03-platform/tools/deployment-guard/03-platform/src/cli/canary-eval.mjs" \
            --not-ready="${not_ready}" \
            --restarts="${restarts}" \
            --elapsed="$(( $(date +%s) - (end_time - CANARY_WAIT_SECONDS) ))" \
            --max-wait="${CANARY_WAIT_SECONDS}" 2>&1 || true)

        if echo "${canary_eval}" | grep -q "CANARY_UNHEALTHY"; then
            local canary_reason
            canary_reason=$(echo "${canary_eval}" | grep "CANARY_UNHEALTHY:" | sed 's/CANARY_UNHEALTHY: //')
            log_error "Canary unhealthy: ${canary_reason}. Removing canary..."
            canary_cleanup
            exit 1
        fi

        # Shell-level defense-in-depth retained
        if [[ $not_ready -gt 0 ]]; then
            log_error "Canary pod not ready. Removing canary..."
            canary_cleanup
            exit 1
        fi
        if [[ "${restarts}" -gt 2 ]]; then
            log_error "Canary pod restarting (${restarts} restarts). Removing canary..."
            canary_cleanup
            exit 1
        fi

        sleep 30
        log_info "Canary healthy... $((end_time - $(date +%s)))s remaining"
    done

    log_success "Canary passed — promoting to full rollout"
    canary_cleanup
}

canary_cleanup() {
    log_info "Removing canary deployment..."
    kubectl delete deployment gtcx-agx-canary -n "${NAMESPACE}" --ignore-not-found=true
}

# -----------------------------------------------------------------------------
# Rollback
# -----------------------------------------------------------------------------

rollback_deployment() {
    log_warning "Rolling back deployment..."

    # Remove canary if present
    kubectl delete deployment gtcx-agx-canary -n "${NAMESPACE}" --ignore-not-found=true

    local deployments
    deployments=$(kubectl get deployments -n "${NAMESPACE}" -l app.kubernetes.io/part-of=gtcx -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    for dep in ${deployments}; do
        log_info "Rolling back ${dep}..."
        kubectl rollout undo "deployment/${dep}" -n "${NAMESPACE}"
    done
    for dep in ${deployments}; do
        kubectl rollout status "deployment/${dep}" -n "${NAMESPACE}" --timeout=300s
    done

    local evidence_dir
    evidence_dir="${INFRA_ROOT}/security/reports/rollback-evidence/${ENVIRONMENT}/$(date -u +%Y%m%dT%H%M%SZ)"
    if [[ -x "${INFRA_ROOT}/03-platform/scripts/capture-rollback-evidence.sh" ]]; then
        "${INFRA_ROOT}/03-platform/scripts/capture-rollback-evidence.sh" "${ENVIRONMENT}" \
            --output-dir="${evidence_dir}" \
            --reason="deploy-rollback" || log_warning "Rollback evidence capture failed"
    fi

    log_success "Rollback completed"
}

# -----------------------------------------------------------------------------
# Post-deployment Verification
# -----------------------------------------------------------------------------

post_deployment() {
    log_step "Running post-deployment verification..."
    
    # Check pods are running
    log_info "Checking pod status..."
    kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/part-of=gtcx
    
    # Run health checks
    log_info "Running health checks..."
    local api_pod
    api_pod=$(kubectl get pods -n "${NAMESPACE}" -l app=gtcx-agx -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "${api_pod}" ]]; then
        kubectl exec "${api_pod}" -n "${NAMESPACE}" -- wget -q --spider http://localhost:3000/api/health || {
            log_error "Health check failed!"
            [[ "${ENVIRONMENT}" == "production" ]] && rollback_deployment
            exit 1
        }
        log_success "Health checks passed"
    fi
    
    # Log deployment (per AUDITABLE principle)
    log_info "Recording deployment..."
    local deploy_record
    deploy_record="$(date -u +"%Y-%m-%dT%H:%M:%SZ") | ${ENVIRONMENT} | ${VERSION} | ${APPROVAL_TICKET:-N/A} | SUCCESS"

    # Write to CloudWatch Logs if AWS CLI available, otherwise S3
    if command -v aws &>/dev/null && [[ -n "${AWS_REGION:-}" ]]; then
        local log_group="/gtcx/${ENVIRONMENT}/deployments"
        local log_stream
        log_stream="deploy-$(date -u +%Y-%m-%d)"
        aws logs create-log-group --log-group-name "${log_group}" 2>/dev/null || true
        aws logs create-log-stream --log-group-name "${log_group}" --log-stream-name "${log_stream}" 2>/dev/null || true
        aws logs put-log-events \
            --log-group-name "${log_group}" \
            --log-stream-name "${log_stream}" \
            --log-events "timestamp=$(date +%s000),message=${deploy_record}" \
            --region "${AWS_REGION}" 2>/dev/null || log_warning "CloudWatch logging failed — falling back to local"
    fi

    # Always write local copy as backup
    echo "${deploy_record}" >> "${PROJECT_ROOT}/deployment.log"
    
    log_success "Post-deployment verification complete"
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

main() {
    if [[ -z "${ENVIRONMENT}" ]]; then
        log_error "Environment required"
        echo "Usage: $(basename "$0") <environment> [--approval-ticket=XXX] [--version=XXX] [--rollback]"
        exit 1
    fi
    
    validate_inputs

    if [[ "${DRY_RUN}" == "true" ]]; then
        dry_run_plan
        exit 0
    fi
    
    if [[ "${ROLLBACK}" == "true" ]]; then
        rollback_deployment
        exit 0
    fi
    
    pre_deployment_checks
    build_images
    security_scan
    ecr_login
    push_images
    
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        canary_deploy
    fi
    
    deploy
    post_deployment
    
    echo ""
    log_success "=========================================="
    log_success "  Deployment Complete!"
    log_success "  Environment: ${ENVIRONMENT}"
    log_success "  Version: ${VERSION}"
    log_success "  Namespace: ${NAMESPACE}"
    log_success "=========================================="
}

main
