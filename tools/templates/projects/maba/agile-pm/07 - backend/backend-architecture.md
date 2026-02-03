# MABA - Backend Architecture

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Status**: In Development  


## 1. Service Architecture Overview

### Core Services
```yaml
transformation_service:
  port: 8001
  description: "Core ETL and transformation engine"
  tech: Python, Ray
  
ingestion_service:
  port: 8002
  description: "Multi-source data ingestion"
  tech: Python, Apache Camel
  
mapping_service:
  port: 8003
  description: "AI-powered schema mapping"
  tech: Python, LangChain
  
job_scheduler:
  port: 8004
  description: "Distributed job orchestration"
  tech: Python, Celery
```

## 2. API Endpoints

### Transformation API
```python
POST /api/v1/transform
{
  "source_type": "postgresql",
  "source_config": {...},
  "target_schema": "unified_v2",
  "options": {
    "batch_size": 10000,
    "parallel_workers": 4
  }
}

GET /api/v1/jobs/{job_id}
Response: {
  "status": "processing",
  "progress": 67.5,
  "records_processed": 675000,
  "errors": []
}

POST /api/v1/mappings/suggest
{
  "source_schema": {...},
  "sample_data": [...]
}
```

## 3. Database Schema

```sql
-- Main transformation tables
CREATE TABLE transformation_jobs (
    id UUID PRIMARY KEY,
    source_type VARCHAR(50),
    source_config JSONB,
    target_schema VARCHAR(100),
    status VARCHAR(20),
    progress FLOAT,
    created_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_log JSONB
);

CREATE TABLE schema_mappings (
    id UUID PRIMARY KEY,
    source_type VARCHAR(50),
    source_field VARCHAR(255),
    target_field VARCHAR(255),
    transformation_rule JSONB,
    confidence_score FLOAT,
    created_by VARCHAR(255),
    approved BOOLEAN DEFAULT FALSE
);

CREATE TABLE transformed_records (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES transformation_jobs(id),
    original_id VARCHAR(255),
    transformed_data JSONB,
    validation_status VARCHAR(20),
    created_at TIMESTAMPTZ
);
```

## 4. Distributed Processing with Ray

```python
import ray
from ray import serve

@ray.remote
class TransformationWorker:
    def __init__(self, config):
        self.config = config
        self.transformer = DataTransformer(config)
    
    def process_batch(self, records):
        """Process a batch of records"""
        return self.transformer.transform_batch(records)

# Initialize Ray cluster
ray.init(address='ray://ray-head:10001')

# Distribute work
futures = []
for batch in data_batches:
    worker = TransformationWorker.remote(config)
    futures.append(worker.process_batch.remote(batch))

# Collect results
results = ray.get(futures)
```

## 5. Message Queue Architecture

```yaml
RabbitMQ Queues:
  ingestion.queue:
    - New data source connections
    - Priority: High
    
  transformation.queue:
    - Transformation jobs
    - Priority: Normal
    
  validation.queue:
    - Data validation tasks
    - Priority: Normal
    
  notification.queue:
    - Status updates
    - Priority: Low
```

## 6. Caching Strategy

```python
# Redis caching layers
CACHE_CONFIG = {
    'schema_cache': {
        'ttl': 3600,  # 1 hour
        'prefix': 'schema:'
    },
    'mapping_cache': {
        'ttl': 86400,  # 24 hours
        'prefix': 'mapping:'
    },
    'result_cache': {
        'ttl': 300,  # 5 minutes
        'prefix': 'result:'
    }
}
```

## 7. Error Handling & Recovery

```python
class TransformationErrorHandler:
    def handle_error(self, error, context):
        if isinstance(error, SchemaError):
            return self.retry_with_fallback_schema(context)
        elif isinstance(error, ConnectionError):
            return self.retry_with_exponential_backoff(context)
        elif isinstance(error, DataValidationError):
            return self.quarantine_record(context)
        else:
            return self.dead_letter_queue(error, context)
```

## 8. Performance Optimization

- **Batch Processing**: 10,000 records per batch
- **Parallel Workers**: Auto-scale 1-20 based on load
- **Memory Management**: Streaming for large datasets
- **Connection Pooling**: 50 connections per database
- **Query Optimization**: Prepared statements, indexes


**Document Status**: Backend specification  
**Review Cycle**: Every sprint  
**Owner**: Backend Team Lead
