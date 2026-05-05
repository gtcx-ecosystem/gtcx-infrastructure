#!/usr/bin/env bash
# =============================================================================
# deploy-intelligence.sh — Build, push, and deploy GTCX intelligence services
# =============================================================================
#
# Usage:
#   ./deploy-intelligence.sh --env staging --service anisa
#   ./deploy-intelligence.sh --env production --service all
#   ./deploy-intelligence.sh --env staging --service sdk --dry-run
#
# Prerequisites:
#   - aws cli configured with ECR access
#   - kubectl context set to the target EKS cluster
#   - argo rollouts kubectl plugin (for canary status)
#   - docker buildx available
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INTELLIGENCE_ROOT="$(cd "$SCRIPT_DIR/../../5-intelligence" && pwd)"
K8S_DIR="$INFRA_ROOT/infra/k8s/intelligence"

# Defaults
ENV=""
SERVICE=""
DRY_RUN=false
AWS_REGION="${AWS_REGION:-af-south-1}"
NAMESPACE="intelligence"

# --- Helpers ---

usage() {
  cat <<USAGE
Usage: $(basename "$0") --env <staging|production> --service <anisa|sdk|all> [--dry-run]

Options:
  --env         Target environment (staging|production)
  --service     Service to deploy (anisa|sdk|all)
  --dry-run     Print commands without executing
  -h, --help    Show this help
USAGE
  exit 1
}

log() { echo "[deploy] $*"; }
err() { echo "[deploy] ERROR: $*" >&2; exit 1; }

run() {
  if [ "$DRY_RUN" = true ]; then
    echo "[dry-run] $*"
  else
    eval "$@"
  fi
}

# --- Argument parsing ---

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV="$2"
      shift 2
      ;;
    --service)
      SERVICE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      err "Unknown argument: $1"
      ;;
  esac
done

[[ -z "$ENV" ]] && err "Missing --env (staging|production)"
[[ -z "$SERVICE" ]] && err "Missing --service (anisa|sdk|all)"
[[ "$ENV" != "staging" && "$ENV" != "production" ]] && err "Invalid env: $ENV (must be staging|production)"
[[ "$SERVICE" != "anisa" && "$SERVICE" != "sdk" && "$SERVICE" != "all" ]] && err "Invalid service: $SERVICE (must be anisa|sdk|all)"

# --- ECR configuration ---

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) || err "Failed to get AWS account ID. Check aws cli config."
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_TAG="${ENV}-$(git -C "$INTELLIGENCE_ROOT" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)"

log "Environment:  $ENV"
log "Service:      $SERVICE"
log "ECR Registry: $ECR_REGISTRY"
log "Image Tag:    $IMAGE_TAG"
log "Dry Run:      $DRY_RUN"
echo

# --- ECR login ---

log "Authenticating with ECR..."
run "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY"

# --- Build and push ---

build_and_push() {
  local service_name="$1"
  local image_name="$2"
  local dockerfile_dir="$3"

  log "Building $service_name..."
  run "docker build -t $ECR_REGISTRY/$image_name:$IMAGE_TAG -t $ECR_REGISTRY/$image_name:latest -f $dockerfile_dir/Dockerfile $INTELLIGENCE_ROOT"

  log "Pushing $service_name..."
  run "docker push $ECR_REGISTRY/$image_name:$IMAGE_TAG"
  run "docker push $ECR_REGISTRY/$image_name:latest"
}

if [[ "$SERVICE" == "anisa" || "$SERVICE" == "all" ]]; then
  build_and_push "ANISA" "gtcx-anisa" "$INTELLIGENCE_ROOT/intelligence/anisa"
fi

if [[ "$SERVICE" == "sdk" || "$SERVICE" == "all" ]]; then
  build_and_push "Intelligence SDK" "gtcx-intelligence-sdk" "$INTELLIGENCE_ROOT/intelligence/sdk"
fi

# --- Apply K8s manifests ---

apply_manifests() {
  local service_name="$1"
  local manifest="$2"

  log "Applying $service_name manifests..."
  local rendered
  rendered=$(ECR_REGISTRY="$ECR_REGISTRY" envsubst < "$manifest")

  if [ "$DRY_RUN" = true ]; then
    echo "[dry-run] kubectl apply (rendered from $manifest)"
    echo "$rendered" | head -5
    echo "  ..."
  else
    echo "$rendered" | kubectl apply -n "$NAMESPACE" -f -
  fi
}

if [[ "$SERVICE" == "anisa" || "$SERVICE" == "all" ]]; then
  apply_manifests "ANISA (canary)" "$K8S_DIR/canary.yml"
fi

if [[ "$SERVICE" == "sdk" || "$SERVICE" == "all" ]]; then
  apply_manifests "Intelligence SDK" "$K8S_DIR/canary-sdk.yml"
fi

# --- Wait for rollout ---

wait_for_rollout() {
  local service_name="$1"
  local resource_type="$2"
  local resource_name="$3"

  log "Waiting for $service_name rollout to complete..."
  if [ "$DRY_RUN" = true ]; then
    echo "[dry-run] Would wait for $resource_type/$resource_name"
    return
  fi

  if [[ "$resource_type" == "rollout" ]]; then
    kubectl argo rollouts status "$resource_name" -n "$NAMESPACE" --timeout 600s
  else
    kubectl rollout status "$resource_type/$resource_name" -n "$NAMESPACE" --timeout 300s
  fi
}

if [[ "$SERVICE" == "anisa" || "$SERVICE" == "all" ]]; then
  wait_for_rollout "ANISA" "rollout" "anisa"
fi

if [[ "$SERVICE" == "sdk" || "$SERVICE" == "all" ]]; then
  wait_for_rollout "Intelligence SDK" "deployment" "intelligence-sdk"
fi

# --- Smoke tests ---

smoke_test() {
  local service_name="$1"
  local svc_name="$2"
  local port="$3"

  log "Running smoke test for $service_name..."
  if [ "$DRY_RUN" = true ]; then
    echo "[dry-run] Would port-forward $svc_name:$port and curl /health"
    return
  fi

  # Start port-forward in background
  local local_port
  local_port=$((port + 10000))
  kubectl port-forward "svc/$svc_name" "$local_port:$port" -n "$NAMESPACE" &
  local pf_pid=$!

  # Wait for port-forward to establish
  sleep 3

  local status
  status=$(curl -sf -o /dev/null -w "%{http_code}" "http://localhost:$local_port/health" 2>/dev/null || echo "000")

  # Clean up port-forward
  kill "$pf_pid" 2>/dev/null || true
  wait "$pf_pid" 2>/dev/null || true

  if [[ "$status" == "200" ]]; then
    log "Smoke test PASSED for $service_name (HTTP $status)"
  else
    err "Smoke test FAILED for $service_name (HTTP $status)"
  fi
}

if [[ "$SERVICE" == "anisa" || "$SERVICE" == "all" ]]; then
  smoke_test "ANISA" "anisa" 8100
fi

if [[ "$SERVICE" == "sdk" || "$SERVICE" == "all" ]]; then
  smoke_test "Intelligence SDK" "intelligence-sdk" 8200
fi

# --- Done ---

echo
log "Deployment complete."
log "  Environment: $ENV"
log "  Service:     $SERVICE"
log "  Image Tag:   $IMAGE_TAG"
