#!/usr/bin/env bash
# =============================================================================
# Terraform State Migration Script
# =============================================================================
# Migrates Terraform state backend to a new region/bucket.
# Creates the target S3 bucket and DynamoDB lock table if they don't exist,
# backs up the current state, then runs terraform init -migrate-state.
#
# Usage:
#   ./03-platform/scripts/migrate-state.sh zimbabwe-pilot
#
# Prerequisites:
#   - AWS CLI configured with permissions for both source and target regions
#   - Terraform >= 1.5.0
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

ENVIRONMENT="${1:-}"
if [[ -z "${ENVIRONMENT}" ]]; then
    log_error "Environment required"
    echo "Usage: $(basename "$0") <environment>"
    echo "Example: $(basename "$0") zimbabwe-pilot"
    exit 1
fi

ENV_DIR="${PROJECT_ROOT}/04-ship/terraform/environments/${ENVIRONMENT}"
if [[ ! -d "${ENV_DIR}" ]]; then
    log_error "Environment directory not found: ${ENV_DIR}"
    exit 1
fi

# Extract backend config from main.tf
BUCKET=$(grep -A5 'backend "s3"' "${ENV_DIR}/main.tf" | grep 'bucket' | head -1 | sed 's/.*= *"\(.*\)"/\1/')
REGION=$(grep -A5 'backend "s3"' "${ENV_DIR}/main.tf" | grep 'region' | head -1 | sed 's/.*= *"\(.*\)"/\1/')
LOCK_TABLE=$(grep -A5 'backend "s3"' "${ENV_DIR}/main.tf" | grep 'dynamodb_table' | head -1 | sed 's/.*= *"\(.*\)"/\1/')

log_info "Environment: ${ENVIRONMENT}"
log_info "Target bucket: ${BUCKET}"
log_info "Target region: ${REGION}"
log_info "Lock table: ${LOCK_TABLE}"
echo ""

# --- Safety confirmation ---
log_warning "This will migrate Terraform state to ${REGION}."
log_warning "Ensure you have backups before proceeding."
read -r -p "Type 'MIGRATE' to confirm: " confirm
if [[ "${confirm}" != "MIGRATE" ]]; then
    log_info "Cancelled."
    exit 0
fi

# --- Create target S3 bucket if it doesn't exist ---
log_info "Ensuring S3 bucket exists in ${REGION}..."
if aws s3api head-bucket --bucket "${BUCKET}" 2>/dev/null; then
    log_info "Bucket ${BUCKET} already exists"
else
    log_info "Creating bucket ${BUCKET} in ${REGION}..."
    aws s3api create-bucket \
        --bucket "${BUCKET}" \
        --region "${REGION}" \
        --create-bucket-configuration LocationConstraint="${REGION}"

    # Enable versioning for state protection
    aws s3api put-bucket-versioning \
        --bucket "${BUCKET}" \
        --versioning-configuration Status=Enabled

    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket "${BUCKET}" \
        --server-side-encryption-configuration \
        '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"},"BucketKeyEnabled":true}]}'

    # Block public access
    aws s3api put-public-access-block \
        --bucket "${BUCKET}" \
        --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

    log_success "Bucket created with versioning, encryption, and public access block"
fi

# --- Create DynamoDB lock table if it doesn't exist ---
log_info "Ensuring DynamoDB lock table exists in ${REGION}..."
if aws dynamodb describe-table --table-name "${LOCK_TABLE}" --region "${REGION}" &>/dev/null; then
    log_info "Lock table ${LOCK_TABLE} already exists"
else
    log_info "Creating lock table ${LOCK_TABLE} in ${REGION}..."
    aws dynamodb create-table \
        --table-name "${LOCK_TABLE}" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "${REGION}" \
        --tags Key=Project,Value=gtcx Key=ManagedBy,Value=terraform Key=Environment,Value="${ENVIRONMENT}"

    aws dynamodb wait table-exists --table-name "${LOCK_TABLE}" --region "${REGION}"
    log_success "Lock table created"
fi

# --- Backup current state ---
log_info "Backing up current state..."
cd "${ENV_DIR}"
BACKUP_FILE="${ENV_DIR}/terraform.tfstate.backup.$(date +%Y%m%d-%H%M%S)"
terraform state pull > "${BACKUP_FILE}" 2>/dev/null || log_warning "No existing state to back up"
if [[ -s "${BACKUP_FILE}" ]]; then
    log_success "State backed up to ${BACKUP_FILE}"
else
    log_info "No existing state — fresh initialization"
    rm -f "${BACKUP_FILE}"
fi

# --- Run migration ---
log_info "Running terraform init -migrate-state..."
terraform init -migrate-state

log_success "State migration complete"
log_info "Verify with: terraform state list"
