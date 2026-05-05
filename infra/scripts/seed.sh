#!/usr/bin/env bash
# =============================================================================
# GTCX Database Seed Script
# =============================================================================
# Seed development/test databases with sample data via SQL files.
#
# WARNING: Never run on production!
#
# Usage:
#   ./scripts/seed.sh              # Seed development
#   ./scripts/seed.sh test         # Seed test database
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

ENVIRONMENT="${1:-development}"

# Safety check - never run on production
if [[ "${ENVIRONMENT}" == "production" ]] || [[ "${ENVIRONMENT}" == "prod" ]]; then
    log_error "REFUSING TO SEED PRODUCTION DATABASE"
    log_error "This script is for development and test environments only."
    exit 1
fi

log_info "Seeding ${ENVIRONMENT} database..."

cd "${PROJECT_ROOT}"
export NODE_ENV="${ENVIRONMENT}"

# Load seed SQL files
SEED_DIR="${PROJECT_ROOT}/infra/docker/init-scripts/postgres"
if [[ -d "${SEED_DIR}" ]]; then
    for file in "${SEED_DIR}"/*.sql; do
        if [[ -f "$file" ]]; then
            log_info "Loading $(basename "$file")..."
            psql "${DATABASE_URL}" -f "$file"
        fi
    done
    log_success "Database seeded successfully"
else
    log_warning "No seed directory found at ${SEED_DIR}"
fi

log_success "Seed complete for ${ENVIRONMENT}"
