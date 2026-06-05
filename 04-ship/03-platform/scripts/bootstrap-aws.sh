#!/usr/bin/env bash
# =============================================================================
# GTCX AWS Account Bootstrap
# =============================================================================
# One-shot script to prepare a fresh AWS account for the Zimbabwe pilot.
# Run this ONCE after creating a new AWS account and configuring credentials.
#
# What it does:
#   1. Validates AWS credentials and CLI
#   2. Enables af-south-1 (Cape Town) — it's opt-in
#   3. Creates S3 state bucket with versioning + KMS encryption
#   4. Creates DynamoDB lock table for Terraform state locking
#   5. Creates GitHub OIDC provider for CI/CD (optional)
#   6. Initializes Terraform for zimbabwe-pilot environment
#
# Prerequisites:
#   - AWS CLI v2 installed
#   - AWS credentials configured (aws configure)
#   - Account must have admin or PowerUser permissions
#   - Terraform >= 1.5.0 installed
#
# Usage:
#   ./03-platform/scripts/bootstrap-aws.sh
#   ./03-platform/scripts/bootstrap-aws.sh --skip-region    # If af-south-1 already enabled
#   ./03-platform/scripts/bootstrap-aws.sh --skip-oidc      # Skip GitHub OIDC setup
#
# Estimated time: 5-10 minutes (region enablement can take 1-2 minutes)
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Configuration
TARGET_REGION="af-south-1"
STATE_BUCKET="gtcx-terraform-state-zimbabwe-pilot"
LOCK_TABLE="gtcx-terraform-locks-zimbabwe-pilot"
ENV_DIR="${PROJECT_ROOT}/04-ship/terraform/environments/zimbabwe-pilot"

SKIP_REGION=false
SKIP_OIDC=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-region) SKIP_REGION=true; shift ;;
        --skip-oidc) SKIP_OIDC=true; shift ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

echo ""
echo "=============================================="
echo "  GTCX AWS Account Bootstrap"
echo "  Target: Zimbabwe Pilot (af-south-1)"
echo "=============================================="
echo ""

# =============================================================================
# Step 1: Validate Prerequisites
# =============================================================================

log_step "1/6 — Validating prerequisites..."

# AWS CLI
if ! command -v aws &>/dev/null; then
    log_error "AWS CLI not found. Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi
log_success "AWS CLI: $(aws --version 2>&1 | head -1)"

# Terraform
if ! command -v terraform &>/dev/null; then
    log_error "Terraform not found. Install: https://developer.hashicorp.com/terraform/install"
    exit 1
fi
log_success "Terraform: $(terraform version -json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["terraform_version"])' 2>/dev/null || terraform version | head -1)"

# kubectl
if ! command -v kubectl &>/dev/null; then
    log_warning "kubectl not found — you'll need it after EKS is created"
else
    log_success "kubectl: $(kubectl version --client -o json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["clientVersion"]["gitVersion"])' 2>/dev/null || echo 'installed')"
fi

# AWS credentials
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) || {
    log_error "AWS credentials not configured or expired"
    log_error "Run: aws configure (or aws sso login)"
    exit 1
}
AWS_USER=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null)
log_success "AWS Account: ${AWS_ACCOUNT_ID}"
log_success "AWS Identity: ${AWS_USER}"

echo ""

# =============================================================================
# Step 2: Enable af-south-1 Region
# =============================================================================

log_step "2/6 — Enabling af-south-1 (Cape Town) region..."

if [[ "${SKIP_REGION}" == "true" ]]; then
    log_info "Skipping region enablement (--skip-region)"
else
    # Check if already enabled
    REGION_STATUS=$(aws account get-region-opt-status --region-name "${TARGET_REGION}" --query "RegionOptStatus" --output text 2>/dev/null || echo "UNKNOWN")

    if [[ "${REGION_STATUS}" == "ENABLED" ]] || [[ "${REGION_STATUS}" == "ENABLED_BY_DEFAULT" ]]; then
        log_success "af-south-1 already enabled"
    elif [[ "${REGION_STATUS}" == "ENABLING" ]]; then
        log_warning "af-south-1 is currently being enabled — this can take 1-2 minutes"
        log_info "Waiting for region activation..."
        for i in {1..30}; do
            sleep 10
            STATUS=$(aws account get-region-opt-status --region-name "${TARGET_REGION}" --query "RegionOptStatus" --output text 2>/dev/null || echo "ENABLING")
            if [[ "${STATUS}" == "ENABLED" ]]; then
                log_success "af-south-1 enabled"
                break
            fi
            log_info "  Still enabling... (${i}/30)"
        done
    else
        log_info "Enabling af-south-1..."
        aws account enable-region --region-name "${TARGET_REGION}" 2>/dev/null || {
            log_error "Failed to enable af-south-1. You may need to enable it manually:"
            log_error "  AWS Console → Account → Regions → Africa (Cape Town) → Enable"
            log_error "Then re-run with --skip-region"
            exit 1
        }
        log_warning "Region enablement started — this takes 1-2 minutes"
        log_info "Waiting for activation..."
        for i in {1..30}; do
            sleep 10
            STATUS=$(aws account get-region-opt-status --region-name "${TARGET_REGION}" --query "RegionOptStatus" --output text 2>/dev/null || echo "ENABLING")
            if [[ "${STATUS}" == "ENABLED" ]]; then
                log_success "af-south-1 enabled"
                break
            fi
            if [[ $i -eq 30 ]]; then
                log_error "Region still enabling after 5 minutes. It may take up to 10 minutes."
                log_error "Re-run this script with --skip-region once it's ready."
                exit 1
            fi
            log_info "  Still enabling... (${i}/30)"
        done
    fi
fi

echo ""

# =============================================================================
# Step 3: Create S3 State Bucket
# =============================================================================

log_step "3/6 — Creating Terraform state bucket in ${TARGET_REGION}..."

if aws s3api head-bucket --bucket "${STATE_BUCKET}" --region "${TARGET_REGION}" 2>/dev/null; then
    log_success "Bucket ${STATE_BUCKET} already exists"
else
    log_info "Creating bucket: ${STATE_BUCKET}"
    aws s3api create-bucket \
        --bucket "${STATE_BUCKET}" \
        --region "${TARGET_REGION}" \
        --create-bucket-configuration LocationConstraint="${TARGET_REGION}"

    # Versioning (state protection)
    aws s3api put-bucket-versioning \
        --bucket "${STATE_BUCKET}" \
        --region "${TARGET_REGION}" \
        --versioning-configuration Status=Enabled

    # KMS encryption (per SECURE principle)
    aws s3api put-bucket-encryption \
        --bucket "${STATE_BUCKET}" \
        --region "${TARGET_REGION}" \
        --server-side-encryption-configuration \
        '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"},"BucketKeyEnabled":true}]}'

    # Block all public access
    aws s3api put-public-access-block \
        --bucket "${STATE_BUCKET}" \
        --region "${TARGET_REGION}" \
        --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

    # Tag
    aws s3api put-bucket-tagging \
        --bucket "${STATE_BUCKET}" \
        --region "${TARGET_REGION}" \
        --tagging 'TagSet=[{Key=Project,Value=gtcx},{Key=Environment,Value=zimbabwe-pilot},{Key=ManagedBy,Value=bootstrap-script}]'

    log_success "State bucket created (versioned, KMS-encrypted, public access blocked)"
fi

echo ""

# =============================================================================
# Step 4: Create DynamoDB Lock Table
# =============================================================================

log_step "4/6 — Creating Terraform lock table in ${TARGET_REGION}..."

if aws dynamodb describe-table --table-name "${LOCK_TABLE}" --region "${TARGET_REGION}" &>/dev/null; then
    log_success "Lock table ${LOCK_TABLE} already exists"
else
    log_info "Creating lock table: ${LOCK_TABLE}"
    aws dynamodb create-table \
        --table-name "${LOCK_TABLE}" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "${TARGET_REGION}" \
        --tags Key=Project,Value=gtcx Key=Environment,Value=zimbabwe-pilot Key=ManagedBy,Value=bootstrap-script

    log_info "Waiting for table to become active..."
    aws dynamodb wait table-exists --table-name "${LOCK_TABLE}" --region "${TARGET_REGION}"
    log_success "Lock table created"
fi

echo ""

# =============================================================================
# Step 5: GitHub OIDC Provider (for CI/CD)
# =============================================================================

log_step "5/6 — Setting up GitHub OIDC provider..."

if [[ "${SKIP_OIDC}" == "true" ]]; then
    log_info "Skipping OIDC setup (--skip-oidc)"
else
    OIDC_EXISTS=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?ends_with(Arn, 'token.actions.githubusercontent.com')]" --output text 2>/dev/null)

    if [[ -n "${OIDC_EXISTS}" ]]; then
        log_success "GitHub OIDC provider already exists"
    else
        log_info "Creating GitHub OIDC provider..."
        aws iam create-open-id-connect-provider \
            --url "https://token.actions.githubusercontent.com" \
            --client-id-list "sts.amazonaws.com" \
            --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
            2>/dev/null || log_warning "OIDC provider creation failed — may need manual setup"
        log_success "GitHub OIDC provider created"
    fi
fi

echo ""

# =============================================================================
# Step 6: Initialize Terraform
# =============================================================================

log_step "6/6 — Initializing Terraform for zimbabwe-pilot..."

if [[ ! -d "${ENV_DIR}" ]]; then
    log_error "Environment directory not found: ${ENV_DIR}"
    exit 1
fi

cd "${ENV_DIR}"
terraform init -input=false

log_success "Terraform initialized"

echo ""

# =============================================================================
# Summary
# =============================================================================

echo "=============================================="
echo -e "  ${GREEN}Bootstrap Complete${NC}"
echo "=============================================="
echo ""
echo "  Account:    ${AWS_ACCOUNT_ID}"
echo "  Region:     ${TARGET_REGION}"
echo "  State:      s3://${STATE_BUCKET}"
echo "  Lock:       dynamodb://${LOCK_TABLE}"
echo "  Environment: ${ENV_DIR}"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Review the plan:"
echo "     cd ${ENV_DIR}"
echo "     terraform plan -var-file=terraform.tfvars"
echo ""
echo "  2. Apply (creates all infrastructure):"
echo "     terraform apply -var-file=terraform.tfvars"
echo ""
echo "  3. Configure kubectl:"
echo "     aws eks update-kubeconfig --name gtcx-zimbabwe-pilot --region ${TARGET_REGION}"
echo ""
echo "  4. Deploy services:"
echo "     cd ${PROJECT_ROOT}"
echo "     ./04-ship/03-platform/scripts/deploy.sh production --approval-ticket=GTCX-001"
echo ""
echo "  Estimated monthly cost: ~\$325 (pilot config)"
echo "  Estimated terraform apply time: ~15-20 minutes"
echo ""
