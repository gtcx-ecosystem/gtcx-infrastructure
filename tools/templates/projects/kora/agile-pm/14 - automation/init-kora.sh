#!/bin/bash

# KORA - Verification System Initialization
# Sets up KORA development and production environment
# Version: 1.0.0
# Last Updated: November 15, 2024

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="kora-verification-oracle"
RUST_VERSION="1.73.0"
NODE_VERSION="18"
GO_VERSION="1.21"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   KORA Verification System Setup      ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to check command exists
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

# Check Rust installation
print_status "Checking Rust installation..."
if command_exists rustc; then
    INSTALLED_RUST=$(rustc --version | cut -d ' ' -f 2)
    print_success "Rust $INSTALLED_RUST found"
else
    print_status "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    print_success "Rust installed"
fi

# Install Rust components
print_status "Installing Rust components..."
rustup component add rustfmt clippy
cargo install cargo-watch cargo-audit cargo-expand
print_success "Rust components installed"

# Setup PostgreSQL
print_status "Setting up PostgreSQL for verifications..."
if command_exists psql; then
    psql -h localhost -U postgres <<EOF
CREATE DATABASE kora_verifications;
CREATE DATABASE kora_test;
GRANT ALL PRIVILEGES ON DATABASE kora_verifications TO postgres;
GRANT ALL PRIVILEGES ON DATABASE kora_test TO postgres;
EOF
    print_success "PostgreSQL databases created"
else
    print_error "PostgreSQL not found. Please install PostgreSQL"
fi

# Setup Neo4j for graph relationships
print_status "Setting up Neo4j..."
if command_exists docker; then
    docker run -d \
        --name neo4j-kora \
        -p 7474:7474 -p 7687:7687 \
        -v $PWD/neo4j/data:/data \
        -v $PWD/neo4j/logs:/logs \
        -e NEO4J_AUTH=neo4j/trustverify123 \
        neo4j:latest
    print_success "Neo4j container started"
else
    print_error "Docker not found. Please install Docker for Neo4j"
fi

# Build Rust verification engine
print_status "Building verification engine..."
cd verification-engine
cargo build --release
print_success "Verification engine built"

# Run database migrations
print_status "Running database migrations..."
cargo install sqlx-cli
sqlx migrate run --database-url postgresql://postgres:password@localhost/kora_verifications
print_success "Migrations completed"

# Setup blockchain connection
print_status "Setting up blockchain connection..."
cat > .env.local <<EOF
# Blockchain Configuration
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
PRIVATE_KEY=your_private_key_here

# Database
DATABASE_URL=postgresql://postgres:password@localhost/kora_verifications
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=trustverify123

# Redis
REDIS_URL=redis://localhost:6379

# API Keys
GOVERNMENT_API_KEY=
SATELLITE_API_KEY=
EOF
print_success "Environment configuration created"

# Install Node dependencies for frontend
print_status "Installing Node.js dependencies..."
cd ../frontend
npm install
print_success "Node dependencies installed"

# Generate cryptographic keys
print_status "Generating cryptographic keys..."
cd ../scripts
./generate-keys.sh
print_success "Keys generated (stored in keys/ directory)"

# Setup monitoring
print_status "Setting up monitoring..."
docker run -d \
    --name prometheus-kora \
    -p 9090:9090 \
    -v $PWD/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
    prom/prometheus

docker run -d \
    --name grafana-kora \
    -p 3000:3000 \
    grafana/grafana
print_success "Monitoring stack deployed"

# Run initial tests
print_status "Running verification tests..."
cd ../verification-engine
cargo test
print_success "All tests passed"

# Setup fraud detection model
print_status "Setting up fraud detection..."
cd ../fraud-detection
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train_model.py
print_success "Fraud detection model trained"

# Initialize federation partners
print_status "Initializing federation network..."
./init-federation.sh
print_success "Federation network initialized"

# Create test data
print_status "Creating test verification data..."
cd ../scripts
./seed-test-data.sh
print_success "Test data created"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   KORA Setup Complete! 🚀             ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your API keys"
echo "2. Start the verification engine: cargo run"
echo "3. Start the frontend: npm run dev"
echo "4. Access dashboard at http://localhost:3001"
echo "5. Access Grafana at http://localhost:3000"
echo "6. Access Neo4j at http://localhost:7474"
echo ""
echo "Verification endpoints:"
echo "- REST API: http://localhost:8080"
echo "- GraphQL: http://localhost:8080/graphql"
echo "- WebSocket: ws://localhost:8080/ws"
echo ""
echo "Test commands:"
echo "- Run tests: cargo test"
echo "- Check security: cargo audit"
echo "- Format code: cargo fmt"
echo "- Lint: cargo clippy"
echo ""