#!/bin/bash

# MABA - Project Initialization Script
# Initializes MABA development environment
# Version: 1.0.0
# Last Updated: November 15, 2024

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="maba-transformation-engine"
PYTHON_VERSION="3.11"
NODE_VERSION="18"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   MABA Development Environment Setup   ${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo -e "${YELLOW}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check Python
print_status "Checking Python installation..."
if command_exists python3; then
    INSTALLED_PYTHON=$(python3 --version | cut -d " " -f 2)
    print_success "Python $INSTALLED_PYTHON found"
else
    print_error "Python not found. Please install Python $PYTHON_VERSION"
    exit 1
fi

# Create virtual environment
print_status "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate
print_success "Virtual environment created"

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
print_success "Python dependencies installed"

# Check Node.js
print_status "Checking Node.js installation..."
if command_exists node; then
    INSTALLED_NODE=$(node --version)
    print_success "Node.js $INSTALLED_NODE found"
else
    print_error "Node.js not found. Please install Node.js $NODE_VERSION"
    exit 1
fi

# Install Node dependencies
print_status "Installing Node.js dependencies..."
npm install
print_success "Node dependencies installed"

# Setup Docker containers
print_status "Setting up Docker containers..."
if command_exists docker; then
    docker-compose up -d postgres redis elasticsearch
    print_success "Docker containers started"
else
    print_error "Docker not found. Please install Docker"
fi

# Setup database
print_status "Setting up PostgreSQL database..."
sleep 5  # Wait for PostgreSQL to start
psql -h localhost -U postgres -c "CREATE DATABASE maba_dev;"
psql -h localhost -U postgres -d maba_dev -f schema/init.sql
print_success "Database initialized"

# Create necessary directories
print_status "Creating project directories..."
mkdir -p data/input
mkdir -p data/output
mkdir -p data/temp
mkdir -p logs
mkdir -p config/local
print_success "Directories created"

# Copy configuration templates
print_status "Setting up configuration files..."
cp config/templates/local.yaml config/local/
cp config/templates/.env.example .env
print_success "Configuration files created"

# Run initial tests
print_status "Running initial tests..."
pytest tests/unit/test_health.py
print_success "Tests passed"

# Setup pre-commit hooks
print_status "Setting up pre-commit hooks..."
pre-commit install
print_success "Pre-commit hooks installed"

# Initialize Ray cluster (local)
print_status "Initializing Ray cluster..."
ray start --head --dashboard-host 0.0.0.0
print_success "Ray cluster started (dashboard at http://localhost:8265)"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Setup Complete! 🚀                  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Configure .env file with your settings"
echo "3. Run development server: python main.py"
echo "4. Access dashboard at http://localhost:8000"
echo ""
echo "Useful commands:"
echo "- Run tests: pytest"
echo "- Start workers: python -m maba.workers"
echo "- Check logs: tail -f logs/maba.log"
echo ""