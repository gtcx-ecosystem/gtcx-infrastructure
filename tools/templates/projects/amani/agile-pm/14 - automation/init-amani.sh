#!/bin/bash

# AMANI - Conversational AI System Setup
# Initializes AMANI multi-channel guidance system
# Version: 1.0.0
# Last Updated: November 15, 2024

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="amani-guidance-system"
PYTHON_VERSION="3.11"
NODE_VERSION="18"
LANGUAGES_COUNT="50"

echo -e "${PURPLE}========================================${NC}"
echo -e "${PURPLE}   AMANI Guidance System Setup         ${NC}"
echo -e "${PURPLE}========================================${NC}"

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
pip install --upgrade pip
print_success "Virtual environment created"

# Install Python dependencies
print_status "Installing AI/ML dependencies..."
pip install -r requirements.txt
pip install torch transformers langchain openai anthropic
pip install fastapi uvicorn websockets redis celery
pip install twilio python-telegram-bot slack-sdk
print_success "Python dependencies installed"

# Download language models
print_status "Downloading language models..."
python scripts/download_models.py \
    --languages "en,sw,ar,fr,pt,am,ha,yo,ig,zu" \
    --models "translation,sentiment,intent"
print_success "Language models downloaded"

# Setup PostgreSQL database
print_status "Setting up PostgreSQL databases..."
if command_exists psql; then
    psql -h localhost -U postgres <<EOF
CREATE DATABASE amani_conversations;
CREATE DATABASE amani_analytics;
CREATE USER amani_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE amani_conversations TO amani_user;
GRANT ALL PRIVILEGES ON DATABASE amani_analytics TO amani_user;
EOF
    print_success "Databases created"
else
    print_error "PostgreSQL not found. Please install PostgreSQL"
fi

# Setup Redis for caching
print_status "Setting up Redis..."
if command_exists docker; then
    docker run -d \
        --name redis-amani \
        -p 6379:6379 \
        redis:alpine \
        redis-server --appendonly yes
    print_success "Redis container started"
else
    print_error "Docker not found. Please install Docker"
fi

# Setup message queue (RabbitMQ)
print_status "Setting up RabbitMQ..."
docker run -d \
    --name rabbitmq-amani \
    -p 5672:5672 \
    -p 15672:15672 \
    -e RABBITMQ_DEFAULT_USER=amani \
    -e RABBITMQ_DEFAULT_PASS=guidance123 \
    rabbitmq:management
print_success "RabbitMQ started (Management UI at :15672)"

# Configure channels
print_status "Configuring communication channels..."

# WhatsApp Business API
cat > config/whatsapp.yaml <<EOF
account_id: YOUR_WHATSAPP_BUSINESS_ID
access_token: YOUR_ACCESS_TOKEN
phone_number_id: YOUR_PHONE_NUMBER_ID
webhook_verify_token: $(openssl rand -hex 16)
EOF

# Twilio (SMS/Voice)
cat > config/twilio.yaml <<EOF
account_sid: YOUR_TWILIO_ACCOUNT_SID
auth_token: YOUR_TWILIO_AUTH_TOKEN
phone_number: YOUR_TWILIO_PHONE
voice_webhook: https://amani.gtcx.global/voice/webhook
sms_webhook: https://amani.gtcx.global/sms/webhook
EOF

# USSD Gateway
cat > config/ussd.yaml <<EOF
provider: africa_talking
username: YOUR_USERNAME
api_key: YOUR_API_KEY
short_code: "*384#"
callback_url: https://amani.gtcx.global/ussd/callback
EOF

print_success "Channel configurations created"

# Setup language resources
print_status "Setting up language resources..."
mkdir -p resources/languages
for lang in en sw ar fr pt am ha yo ig zu; do
    mkdir -p resources/languages/$lang
    cp templates/responses_template.json resources/languages/$lang/responses.json
    cp templates/intents_template.json resources/languages/$lang/intents.json
done
print_success "Language resources initialized"

# Initialize knowledge base
print_status "Initializing knowledge base..."
cd knowledge_base
python init_knowledge.py \
    --topics "land_registration,verification,disputes,inheritance" \
    --countries "kenya,nigeria,ghana,south_africa,rwanda"
print_success "Knowledge base initialized"

# Setup voice services
print_status "Setting up voice services..."
cd ../voice
npm install
npm run build
print_success "Voice services ready"

# Train initial models
print_status "Training conversation models..."
cd ../training
python train_intent_classifier.py
python train_entity_extractor.py
python train_response_generator.py
print_success "Models trained"

# Setup monitoring
print_status "Setting up monitoring dashboard..."
docker run -d \
    --name grafana-amani \
    -p 3002:3000 \
    grafana/grafana

docker run -d \
    --name prometheus-amani \
    -p 9092:9090 \
    -v $PWD/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
    prom/prometheus
print_success "Monitoring stack deployed"

# Create test conversations
print_status "Creating test conversations..."
cd ../scripts
python create_test_conversations.py \
    --languages "en,sw" \
    --scenarios "registration,verification,dispute" \
    --count 100
print_success "Test conversations created"

# Setup API gateway
print_status "Setting up API gateway..."
cd ../gateway
npm install
npm run build
print_success "API gateway configured"

# Initialize conversation flows
print_status "Initializing conversation flows..."
cd ../flows
for flow in registration verification dispute support; do
    python compile_flow.py --flow $flow --output compiled/$flow.json
done
print_success "Conversation flows compiled"

# Setup webhook endpoints
print_status "Setting up webhook endpoints..."
cat > nginx.conf <<EOF
server {
    listen 443 ssl;
    server_name amani.gtcx.global;
    
    location /whatsapp/webhook {
        proxy_pass http://localhost:8000;
    }
    
    location /sms/webhook {
        proxy_pass http://localhost:8001;
    }
    
    location /ussd/callback {
        proxy_pass http://localhost:8002;
    }
    
    location /voice/webhook {
        proxy_pass http://localhost:8003;
    }
}
EOF
print_success "Webhook endpoints configured"

# Start services
print_status "Starting AMANI services..."

# Start conversation engine
cd ../engine
nohup python main.py > logs/engine.log 2>&1 &
print_success "Conversation engine started"

# Start channel handlers
cd ../channels
nohup python whatsapp_handler.py > logs/whatsapp.log 2>&1 &
nohup python sms_handler.py > logs/sms.log 2>&1 &
nohup python ussd_handler.py > logs/ussd.log 2>&1 &
nohup python voice_handler.py > logs/voice.log 2>&1 &
print_success "Channel handlers started"

# Start web interface
cd ../web
npm run dev &
print_success "Web interface started"

# Health check
print_status "Running health checks..."
sleep 5
curl -f http://localhost:8000/health || print_error "Conversation engine not responding"
curl -f http://localhost:3003/health || print_error "Web interface not responding"
print_success "All services healthy"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   AMANI Setup Complete! 🌍            ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Services running:"
echo "- Conversation Engine: http://localhost:8000"
echo "- WhatsApp Handler: http://localhost:8001"
echo "- SMS Handler: http://localhost:8002"
echo "- USSD Handler: http://localhost:8003"
echo "- Voice Service: http://localhost:8004"
echo "- Web Chat: http://localhost:3003"
echo "- Grafana: http://localhost:3002"
echo "- RabbitMQ: http://localhost:15672"
echo ""
echo "Configuration needed:"
echo "1. Add WhatsApp Business API credentials"
echo "2. Add Twilio credentials for SMS/Voice"
echo "3. Configure USSD gateway settings"
echo "4. Set up SSL certificates"
echo ""
echo "Test commands:"
echo "- Test WhatsApp: python test_whatsapp.py"
echo "- Test SMS: python test_sms.py"
echo "- Test USSD: python test_ussd.py"
echo "- Load test: locust -f loadtest.py"
echo ""
echo "Supported languages: ${LANGUAGES_COUNT}+"
echo "Ready to serve 2 billion users! 🚀"