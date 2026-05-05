# MABA - Universal Transformation Engine

**Transform any data from any source → any target schema**

## Overview

MABA is the data ingestion and transformation backbone. It converts heterogeneous data sources into standardized, verifiable formats using AI-powered schema mapping and distributed processing.

## Core Capabilities

- **Universal Ingestion**: Accepts any data format (databases, files, APIs, streams)
- **Intelligent Transformation**: AI-powered schema mapping and reconciliation
- **Distributed Processing**: Scales to millions of records via Ray/Spark
- **Self-Healing**: Automatic error detection and resolution
- **Real-time Indexing**: Instant searchability via Elasticsearch

## Performance

| Metric                  | Target                          |
| ----------------------- | ------------------------------- |
| Processing throughput   | 1M+ records/day                 |
| Schema mapping accuracy | 95% automatic                   |
| Error rate              | <0.1% after auto-reconciliation |
| Latency                 | <100ms per record               |

## Tech Stack

- **Language**: Python 3.11+
- **Processing**: Ray, Apache Spark
- **Database**: PostgreSQL + PostGIS
- **Search**: Elasticsearch 8.x
- **ML/AI**: PyTorch, Hugging Face Transformers
- **Orchestration**: Airflow, Kubernetes
- **APIs**: FastAPI, GraphQL

## Plugin Architecture

### Connectors (Pluggable)

```
maba/connectors/
├── documents/
│   ├── pdf/              # PDF extraction with OCR
│   ├── word/             # Word document parsing
│   ├── excel/            # Excel/CSV processing
│   └── scanned/          # Image-based document OCR
├── databases/
│   ├── postgresql/       # Direct PostgreSQL connection
│   ├── mysql/            # MySQL connector
│   ├── oracle/           # Oracle database
│   ├── mongodb/          # MongoDB document store
│   └── legacy/           # COBOL, mainframe exports
├── apis/
│   ├── rest/             # REST API ingestion
│   ├── soap/             # SOAP service connector
│   ├── graphql/          # GraphQL endpoint
│   └── streaming/        # Kafka, Pulsar streams
└── domain/
    ├── gtcx-core12/      # GTCX commodity schema
    ├── land-cadastre/    # Land records schema
    ├── kyc-aml/          # Financial compliance schema
    └── custom/           # Your domain schema
```

### Schema Mapping

MABA uses AI to automatically map source schemas to target schemas:

```python
from maba import TransformationEngine

engine = TransformationEngine()

# Configure for your domain
engine.configure(
    source_connector="databases/postgresql",
    target_schema="domain/gtcx-core12",
    options={
        "ai_mapping": True,
        "confidence_threshold": 0.85,
        "fallback": "manual_review"
    }
)

# Run transformation
job = engine.create_job(
    source="postgresql://host/mining_db",
    batch_size=10000
)
results = engine.process(job)
```

## Integration

### Downstream

- **KORA**: Transformed data flows to verification
- **AMANI**: Indexed data supports user guidance

### Upstream

- Any data source with a connector

## Documentation

Full agile-pm documentation in `agile-pm/` folder:

- Technical architecture: `04 - spec/`
- API specification: `04 - spec/api-specification-template.md`
- Sprint planning: `06 - planning/`

_Source: Originally from the GTCX monorepo migration tools; now maintained in gtcx-amis (MABA specs) and gtcx-infrastructure (templates)_
