#!/usr/bin/env bash
# =============================================================================
# GTCX Environment Setup Script
# =============================================================================
# Initial setup for local development or new deployment environments.
#
# Principles Implemented:
#   - DOCUMENTED (27): Clear instructions and output
#   - TESTED (29): Validates all prerequisites
#   - DEPLOYABLE (14): Works across all environments
#
# Usage:
#   ./scripts/setup.sh              # Full setup
#   ./scripts/setup.sh --check      # Check prerequisites only
#   ./scripts/setup.sh --docker     # Docker setup only
#   ./scripts/setup.sh --help       # Show help
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        log_success "$1 is installed"
        return 0
    else
        log_error "$1 is not installed"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# Prerequisites Check
# -----------------------------------------------------------------------------

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing=0
    
    # Required tools
    check_command "docker" || ((missing++))
    check_command "docker-compose" || check_command "docker compose" || ((missing++))
    check_command "node" || ((missing++))
    check_command "npm" || ((missing++))
    check_command "ruby" || ((missing++))
    check_command "bundle" || ((missing++))
    
    # Optional tools (warn if missing)
    check_command "kubectl" || log_warning "kubectl not found - needed for Kubernetes deployments"
    check_command "terraform" || log_warning "terraform not found - needed for cloud provisioning"
    check_command "cargo" || log_warning "cargo not found - needed for Rust development"
    
    # Check Docker is running
    if docker info &> /dev/null; then
        log_success "Docker daemon is running"
    else
        log_error "Docker daemon is not running"
        ((missing++))
    fi
    
    # Check versions
    log_info "Checking versions..."
    echo "  Node: $(node --version 2>/dev/null || echo 'N/A')"
    echo "  Ruby: $(ruby --version 2>/dev/null | head -1 || echo 'N/A')"
    echo "  Docker: $(docker --version 2>/dev/null || echo 'N/A')"
    
    if [[ $missing -gt 0 ]]; then
        log_error "Missing $missing required tools. Please install them and retry."
        return 1
    fi
    
    log_success "All prerequisites met!"
    return 0
}

# -----------------------------------------------------------------------------
# Docker Setup
# -----------------------------------------------------------------------------

setup_docker() {
    log_info "Setting up Docker environment..."
    
    cd "${PROJECT_ROOT}"
    
    # Build base images
    log_info "Building base Docker images..."
    docker build \
        -f infra/docker/Dockerfile.base \
        --target ruby-production \
        -t gtcx/api:dev \
        . || {
            log_error "Failed to build API image"
            return 1
        }
    
    log_success "Docker images built successfully"
    
    # Create Docker network if it doesn't exist
    docker network create gtcx-network 2>/dev/null || true
    
    log_success "Docker setup complete"
}

# -----------------------------------------------------------------------------
# Database Setup
# -----------------------------------------------------------------------------

setup_database() {
    log_info "Setting up databases..."
    
    cd "${PROJECT_ROOT}"
    
    # Start database containers
    docker compose -f infra/docker/docker-compose.dev.yml up -d postgres postgres-audit redis
    
    # Wait for databases to be ready
    log_info "Waiting for databases to be ready..."
    sleep 5
    
    local retries=30
    while [[ $retries -gt 0 ]]; do
        if docker compose -f infra/docker/docker-compose.dev.yml exec -T postgres pg_isready -U gtcx &>/dev/null; then
            break
        fi
        retries=$((retries - 1))
        sleep 1
    done
    
    if [[ $retries -eq 0 ]]; then
        log_error "Database failed to start"
        return 1
    fi
    
    log_success "Databases are ready"
}

# -----------------------------------------------------------------------------
# Application Setup
# -----------------------------------------------------------------------------

setup_application() {
    log_info "Setting up application dependencies..."
    
    cd "${PROJECT_ROOT}"
    
    # Install Node dependencies
    if [[ -f "package.json" ]]; then
        log_info "Installing Node dependencies..."
        npm install
    fi
    
    # Install Ruby dependencies
    if [[ -f "Gemfile" ]]; then
        log_info "Installing Ruby dependencies..."
        bundle install
    fi
    
    # Copy environment file
    if [[ ! -f ".env" ]] && [[ -f ".env.example" ]]; then
        log_info "Creating .env file from example..."
        cp .env.example .env
        log_warning "Please edit .env with your configuration"
    fi
    
    log_success "Application setup complete"
}

# -----------------------------------------------------------------------------
# Run Migrations
# -----------------------------------------------------------------------------

run_migrations() {
    log_info "Running database migrations..."
    
    cd "${PROJECT_ROOT}"
    
    # Run migrations via the migrate script
    "${SCRIPT_DIR}/migrate.sh" development || {
        log_error "Migration failed"
        return 1
    }
    
    log_success "Migrations complete"
}

# -----------------------------------------------------------------------------
# Full Setup
# -----------------------------------------------------------------------------

full_setup() {
    log_info "Starting full GTCX setup..."
    
    check_prerequisites || exit 1
    setup_docker || exit 1
    setup_database || exit 1
    setup_application || exit 1
    run_migrations || exit 1
    
    echo ""
    log_success "=========================================="
    log_success "  GTCX Development Environment Ready!"
    log_success "=========================================="
    echo ""
    echo "Start all services:"
    echo "  docker compose -f infra/docker/docker-compose.dev.yml up"
    echo ""
    echo "Or start in background:"
    echo "  docker compose -f infra/docker/docker-compose.dev.yml up -d"
    echo ""
    echo "Access points:"
    echo "  API:        http://localhost:3000"
    echo "  Grafana:    http://localhost:3030 (admin/admin)"
    echo "  Prometheus: http://localhost:9090"
    echo "  Jaeger:     http://localhost:16686"
    echo ""
}

# -----------------------------------------------------------------------------
# Help
# -----------------------------------------------------------------------------

show_help() {
    cat << EOF
GTCX Environment Setup Script

Usage: $(basename "$0") [OPTIONS]

Options:
    --check         Check prerequisites only
    --docker        Docker setup only
    --database      Database setup only
    --application   Application setup only
    --migrations    Run migrations only
    --help, -h      Show this help message

Examples:
    $(basename "$0")              # Full setup
    $(basename "$0") --check      # Check prerequisites
    $(basename "$0") --docker     # Docker setup only

EOF
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

main() {
    case "${1:-}" in
        --check)
            check_prerequisites
            ;;
        --docker)
            setup_docker
            ;;
        --database)
            setup_database
            ;;
        --application)
            setup_application
            ;;
        --migrations)
            run_migrations
            ;;
        --help|-h)
            show_help
            ;;
        "")
            full_setup
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
