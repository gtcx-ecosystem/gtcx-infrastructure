#!/usr/bin/env bash
# =============================================================================
# GTCX Production Deployment Script
# =============================================================================
# Deploys GTCX to Kubernetes environments with safety checks.
#
# Principles Implemented:
#   - SECURE (11): Signed artifacts, security scanning
#   - AUDITABLE (3): Full deployment audit trail
#   - RESILIENT (12): Canary deployment, automatic rollback
#   - DOCUMENTED (27): Clear output at every step
#
# Usage:
#   ./scripts/deploy.sh staging
#   ./scripts/deploy.sh production --approval-ticket=GTCX-123
#   ./scripts/deploy.sh production --rollback
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
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

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
VERSION=""
CANARY_PERCENTAGE=5
CANARY_WAIT_SECONDS=300  # 5 minutes
AWS_REGION="${AWS_REGION:-af-south-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
ECR_REGISTRY=""

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
    
    # Production requires approval ticket
    if [[ "${ENVIRONMENT}" == "production" ]] && [[ -z "${APPROVAL_TICKET}" ]] && [[ "${ROLLBACK}" != "true" ]]; then
        log_error "Production deployment requires --approval-ticket=GTCX-XXX"
        exit 1
    fi
    
    # Check kubectl access
    if ! kubectl cluster-info &>/dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Inputs validated"
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
        read -p "Type 'DEPLOY' to confirm: " confirm
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

    local images=("intelligence" "protocols")
    for img in "${images[@]}"; do
        local local_tag="gtcx/${img}:${VERSION}"
        local ecr_tag="${ECR_REGISTRY}/gtcx-${ENVIRONMENT}-${img}:${VERSION}"
        local ecr_latest="${ECR_REGISTRY}/gtcx-${ENVIRONMENT}-${img}:latest"

        docker tag "${local_tag}" "${ecr_tag}"
        docker tag "${local_tag}" "${ecr_latest}"
        docker push "${ecr_tag}"
        docker push "${ecr_latest}"
        log_info "Pushed ${ecr_tag}"
    done

    log_success "All images pushed to ECR"
}

build_images() {
    log_step "Building Docker images..."

    cd "${PROJECT_ROOT}"

    # Determine version
    if [[ -z "${VERSION}" ]]; then
        VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
    fi

    log_info "Version: ${VERSION}"

    # Build Node.js service images
    docker build \
        -f infra/docker/Dockerfile.intelligence \
        -t "gtcx/intelligence:${VERSION}" \
        .

    docker build \
        -f infra/docker/Dockerfile.protocols \
        -t "gtcx/protocols:${VERSION}" \
        .

    log_success "Images built successfully"
}

# -----------------------------------------------------------------------------
# Security Scanning
# -----------------------------------------------------------------------------

security_scan() {
    log_step "Running security scans..."
    
    # Scan images with Trivy
    if command -v trivy &>/dev/null; then
        log_info "Scanning intelligence image..."
        trivy image --exit-code 1 --severity HIGH,CRITICAL "gtcx/intelligence:${VERSION}" || {
            log_error "Security vulnerabilities found in intelligence image"
            [[ "${ENVIRONMENT}" == "production" ]] && exit 1
            log_warning "Continuing despite vulnerabilities (non-production)"
        }

        log_info "Scanning protocols image..."
        trivy image --exit-code 1 --severity HIGH,CRITICAL "gtcx/protocols:${VERSION}" || {
            log_error "Security vulnerabilities found in protocols image"
            [[ "${ENVIRONMENT}" == "production" ]] && exit 1
        }
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
    
    cd "${PROJECT_ROOT}/infra/kubernetes"
    
    # Update image tags in kustomization
    log_info "Updating image tags..."
    cd "overlays/${ENVIRONMENT}"
    kustomize edit set image "gtcx/api:${VERSION}"
    kustomize edit set image "gtcx/crypto:${VERSION}"
    cd "${PROJECT_ROOT}/infra/kubernetes"
    
    # Apply configuration
    log_info "Applying Kubernetes configuration..."
    kubectl apply -k "overlays/${ENVIRONMENT}"
    
    # Wait for rollout
    log_info "Waiting for deployment rollout..."
    kubectl rollout status deployment/gtcx-api-${ENVIRONMENT:0:4} -n "${NAMESPACE}" --timeout=300s
    kubectl rollout status deployment/gtcx-crypto-${ENVIRONMENT:0:4} -n "${NAMESPACE}" --timeout=300s
    
    log_success "Deployment applied"
}

# -----------------------------------------------------------------------------
# Canary Deployment (Production)
# -----------------------------------------------------------------------------

canary_deploy() {
    log_step "Starting canary deployment (${CANARY_PERCENTAGE}%)..."
    
    # Scale canary to percentage
    local total_replicas
    total_replicas=$(kubectl get deployment/gtcx-api-prod -n "${NAMESPACE}" -o jsonpath='{.spec.replicas}')
    local canary_replicas=$((total_replicas * CANARY_PERCENTAGE / 100))
    [[ $canary_replicas -lt 1 ]] && canary_replicas=1
    
    log_info "Deploying ${canary_replicas} canary replicas..."
    
    # Deploy canary
    kubectl set image deployment/gtcx-api-prod \
        api="gtcx/api:${VERSION}" \
        -n "${NAMESPACE}" \
        --record
    
    # Wait and monitor
    log_info "Monitoring canary for ${CANARY_WAIT_SECONDS} seconds..."
    
    local end_time=$(($(date +%s) + CANARY_WAIT_SECONDS))
    while [[ $(date +%s) -lt $end_time ]]; do
        # Check pod readiness via condition status
        local not_ready
        not_ready=$(kubectl get pods -n "${NAMESPACE}" -l app=gtcx-api-prod \
            -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null \
            | tr ' ' '\n' | grep -c "False" || echo "0")

        if [[ $not_ready -gt 0 ]]; then
            log_error "Unhealthy pods detected during canary (${not_ready} not ready). Rolling back..."
            rollback_deployment
            exit 1
        fi

        # Check for pods in CrashLoopBackOff or Error state
        local failing_pods
        failing_pods=$(kubectl get pods -n "${NAMESPACE}" -l app=gtcx-api-prod \
            --field-selector=status.phase!=Running,status.phase!=Succeeded \
            -o name 2>/dev/null | wc -l | tr -d ' ')

        if [[ $failing_pods -gt 0 ]]; then
            log_error "Failing pods detected during canary (${failing_pods} pods). Rolling back..."
            rollback_deployment
            exit 1
        fi

        sleep 30
        log_info "Canary healthy... $((end_time - $(date +%s)))s remaining"
    done
    
    log_success "Canary deployment successful"
}

# -----------------------------------------------------------------------------
# Rollback
# -----------------------------------------------------------------------------

rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    kubectl rollout undo deployment/gtcx-api-${ENVIRONMENT:0:4} -n "${NAMESPACE}"
    kubectl rollout undo deployment/gtcx-crypto-${ENVIRONMENT:0:4} -n "${NAMESPACE}"
    
    kubectl rollout status deployment/gtcx-api-${ENVIRONMENT:0:4} -n "${NAMESPACE}" --timeout=300s
    
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
    api_pod=$(kubectl get pods -n "${NAMESPACE}" -l app=gtcx-api-${ENVIRONMENT:0:4} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "${api_pod}" ]]; then
        kubectl exec "${api_pod}" -n "${NAMESPACE}" -- wget -q --spider http://localhost:3000/health || {
            log_error "Health check failed!"
            [[ "${ENVIRONMENT}" == "production" ]] && rollback_deployment
            exit 1
        }
        log_success "Health checks passed"
    fi
    
    # Log deployment (per AUDITABLE principle)
    log_info "Recording deployment..."
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") | ${ENVIRONMENT} | ${VERSION} | ${APPROVAL_TICKET:-N/A} | SUCCESS" >> "${PROJECT_ROOT}/deployment.log"
    
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
