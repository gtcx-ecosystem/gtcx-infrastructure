# GTCX Migration Stack

> **Universal data transformation, verification, and guidance infrastructure**

## Overview

The GTCX Migration Stack is a domain-agnostic infrastructure layer that transforms heterogeneous data sources into verified, standardized formats while providing multilingual user guidance. Originally built for land record digitization, the stack is designed to support any domain requiring data transformation, multi-source verification, and accessible user interfaces.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
│      Citizens | Governments | Enterprises | Developers      │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                    AMANI - Guidance Layer                   │
│   Multilingual Conversational AI (200+ languages)           │
│   Channels: WhatsApp | SMS | USSD | Voice | Web            │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────────┐
        │                   │                 │
┌───────▼──────┐   ┌────────▼────────┐   ┌───▼──────────────┐
│     MABA     │◄──►     KORA        │◄──►  External APIs   │
│ Transformation│   │  Verification   │   │  Gov Registries  │
│    Engine    │   │     Oracle      │   │  Satellite Data  │
└──────────────┘   └─────────────────┘   └──────────────────┘
```

## Components

### MABA - Universal Transformation Engine

Transform any data from any source into any target schema.

- **AI-powered schema mapping** with 95%+ automatic accuracy
- **Distributed processing** via Ray/Spark (1M+ records/day)
- **Universal connectors**: databases, files, APIs, streams
- **Self-healing** with automatic error resolution

[→ MABA Documentation](./maba/README.md)

### KORA - Multi-Source Verification Oracle

Create tamper-proof verification through multi-source consensus.

- **Byzantine fault-tolerant** consensus across sources
- **Cryptographic proofs** with blockchain anchoring
- **ML-powered fraud detection** that learns over time
- **Zero-knowledge proofs** for sensitive data

[→ KORA Documentation](./kora/README.md)

### AMANI - Multilingual Guidance Layer

Make complex processes accessible to everyone.

- **200+ languages** with cultural adaptation
- **Multi-channel**: WhatsApp, SMS, USSD, Voice, Web
- **Offline-first** for low-connectivity environments
- **Context-aware** assistance and proactive guidance

[→ AMANI Documentation](./amani/README.md)

## Domain Examples

| Domain             | MABA Transforms        | KORA Verifies           | AMANI Guides                  |
| ------------------ | ---------------------- | ----------------------- | ----------------------------- |
| **GTCX Commodity** | Legacy ERPs → Core12   | Provenance vs evidence  | Miners through compliance     |
| **Land/Cadastre**  | Paper titles → digital | Ownership vs registries | Citizens through digitization |
| **Government**     | Ministry DBs → APIs    | License validity        | Officials through platform    |
| **Financial**      | KYC docs → profiles    | Identity claims         | Clients through onboarding    |

## Configuration

Domain-specific configurations live in `config/`:

```yaml
# config/gtcx.yaml - GTCX commodity verification
maba:
  target_schema: core12
  connectors:
    - ghana-minerals-commission
    - document-upload

kora:
  validators:
    - government-registry
    - geotag-location
    - community-attestation

amani:
  languages: [en, tw, ha, fr, pt]
  channels: [whatsapp, sms, ussd, web]
```

See [config/example.yaml](./config/example.yaml) for a template.

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis
- Docker (optional)

### Setup

```bash
# Navigate to migration stack
cd infrastructure/migration

# Check documentation status
python scripts/check_docs.py

# Generate missing documentation
python scripts/generate_docs.py maba
python scripts/generate_docs.py kora
python scripts/generate_docs.py amani
```

### Running Components

Each component can run independently or as part of the integrated stack:

```bash
# MABA - Transformation Engine
cd maba
pip install -r requirements.txt
python -m maba.server

# KORA - Verification Oracle
cd kora
cargo build --release
./target/release/kora

# AMANI - Guidance Layer
cd amani
pip install -r requirements.txt
python -m amani.server
```

## Documentation Structure

Each component follows the standard GTCX agile-pm structure:

```
component/
├── README.md                 # Component overview
├── agile-pm/
│   ├── 01 - overview/        # Project overview
│   ├── 02 - vision/          # Product requirements
│   ├── 03 - design/          # UX/UI design
│   ├── 04 - spec/            # Technical architecture ← KEY SPECS HERE
│   ├── 05 - roadmap/         # Milestones
│   ├── 06 - planning/        # Sprint planning
│   ├── 07 - backend/         # Backend architecture
│   ├── 08 - frontend/        # Frontend architecture
│   ├── 09 - security/        # Security requirements
│   ├── 10 - compliance/      # Regulatory compliance
│   ├── 11 - support/         # User documentation
│   ├── 12 - gtm/             # Go-to-market
│   ├── 13 - agent-resources/ # AI agent guidelines
│   ├── 14 - automation/      # Setup scripts
│   └── 15 - metrics-dashboards/
└── src/                      # Source code (when implemented)
```

## Integration with GTCX

When used with GTCX commodity verification:

1. **MABA** transforms miner data into Core12 schema
2. **KORA** verifies against GCI (Global Compliance Intelligence)
3. **AMANI** guides users via VIA/VXA mobile agents

Configuration: [config/gtcx.yaml](./config/gtcx.yaml)

## API Overview

### MABA

```
POST /api/v1/transform    # Start transformation job
GET  /api/v1/jobs/{id}    # Check job status
GET  /api/v1/mappings     # Get schema mappings
```

### KORA

```
POST /api/v1/verify       # Submit for verification
GET  /api/v1/proof/{id}   # Get cryptographic proof
POST /api/v1/dispute      # File dispute
```

### AMANI

```
POST /api/v1/chat         # Send message
GET  /api/v1/languages    # List supported languages
POST /api/v1/translate    # Translate content
```

## Scripts

| Script                     | Purpose                          |
| -------------------------- | -------------------------------- |
| `scripts/generate_docs.py` | Generate documentation templates |
| `scripts/check_docs.py`    | Audit documentation completeness |

## Performance Targets

| Metric       | MABA             | KORA                   | AMANI                        |
| ------------ | ---------------- | ---------------------- | ---------------------------- |
| Throughput   | 1M records/day   | 100K verifications/day | 10K conversations/hour       |
| Accuracy     | 95% auto-mapping | 99.5% verification     | 90% first-contact resolution |
| Latency      | <100ms/record    | <500ms/verification    | <2s response                 |
| Availability | 99.9%            | 99.95%                 | 99.9%                        |

## License

GTCX Protocol - Proprietary
Copyright 2024-2025 GTCX Global

_Part of the [GTCX Protocol](../../README.md) ecosystem_
