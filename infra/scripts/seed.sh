#!/usr/bin/env bash
# =============================================================================
# GTCX Database Seed Script
# =============================================================================
# Seed development/test databases with sample data.
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
export RAILS_ENV="${ENVIRONMENT}"

# Run Rails seed
if [[ -f "db/seeds.rb" ]]; then
    bundle exec rails db:seed
    log_success "Database seeded successfully"
else
    log_warning "No db/seeds.rb found"
fi

# Load sample data if available
if [[ -d "db/sample_data" ]]; then
    log_info "Loading sample data..."
    for file in db/sample_data/*.sql; do
        if [[ -f "$file" ]]; then
            log_info "Loading $(basename "$file")..."
            bundle exec rails db:load_sample_data FILE="$file"
        fi
    done
fi

log_success "Seed complete for ${ENVIRONMENT}"
