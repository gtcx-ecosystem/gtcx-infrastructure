# MABA - Agent Guide

**Component**: MABA (Transformation Engine)  
**Purpose**: Guide for AI agents working on MABA  
**Last Updated**: November 15, 2024  


## Agent Quick Start

### Your Mission
You are working on MABA, the universal transformation engine that ingests and transforms heterogeneous data sources into standardized, verifiable formats for the GTCX ecosystem.

### Key Responsibilities
1. Implement data ingestion adapters
2. Build AI-powered schema mapping
3. Optimize distributed processing
4. Ensure data quality and validation
5. Create comprehensive documentation


## Before You Start

### Must Read
1. Technical Architecture: `04 - spec/technical-architecture-template.md`
2. Current Sprint: `06 - planning/sprint-planning-template.md`
3. Security Requirements: `09 - security/security-requirements.md`
4. API Specifications: `07 - backend/api-specification.md`

### Understand the Context
- MABA is the entry point for all data in GTCX
- No verification happens without MABA's transformation
- Performance is critical (target: 1M records/hour)
- Data quality directly impacts downstream systems


## Technical Guidelines

### Code Standards
```python
# Python code style for MABA
"""
Module: Data Ingestion Adapter
Author: [Your Name]
Date: [Date]
Description: Comprehensive docstring required
"""

import logging
from typing import Optional, Dict, Any
from abc import ABC, abstractmethod

class IngestionAdapter(ABC):
    """Base class for all ingestion adapters.
    
    Attributes:
        config: Adapter configuration
        logger: Logger instance
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
```

### Testing Requirements
- Unit test coverage: >80%
- Integration tests for all adapters
- Performance benchmarks required
- Error scenario testing mandatory

### Documentation Standards
- Every function needs docstrings
- Complex logic requires inline comments
- Update README.md with changes
- Create examples for new features


## Development Workflow

### 1. Pick a Task
```bash
# Check current sprint tasks
cat 06\ -\ planning/sprint-planning-template.md

# Find your assigned story
grep -n "Assignee: AI Agent" 06\ -\ planning/user-stories/*.md
```

### 2. Create Branch
```bash
git checkout -b feature/MABA-XXX-description
```

### 3. Implement
- Follow technical architecture
- Write tests first (TDD)
- Ensure performance targets
- Handle errors gracefully

### 4. Test
```bash
# Run unit tests
pytest tests/unit/

# Run integration tests
pytest tests/integration/

# Check coverage
pytest --cov=maba tests/
```

### 5. Document
- Update relevant documentation
- Add usage examples
- Document any assumptions
- Note performance characteristics

### 6. Submit PR
```markdown
## PR Template
### Changes
- What: [Description of changes]
- Why: [Reason for changes]
- How: [Technical approach]

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Performance benchmarks met
- [ ] Documentation updated

### Related Issues
- Closes MABA-XXX
```


## Performance Optimization

### Key Metrics to Monitor
- Ingestion rate (records/second)
- Transformation latency (ms)
- Memory usage (GB)
- CPU utilization (%)
- Error rate (%)

### Optimization Techniques
```python
# Use batch processing
def process_batch(records: List[Record]) -> List[ProcessedRecord]:
    # Process in batches of 10,000
    batch_size = 10000
    results = []
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        processed = self.transform_batch(batch)
        results.extend(processed)
    
    return results

# Implement caching
@lru_cache(maxsize=1000)
def expensive_computation(input_data):
    # Cache results of expensive operations
    pass

# Use async I/O
async def fetch_data_async(sources: List[Source]):
    tasks = [fetch_from_source(s) for s in sources]
    return await asyncio.gather(*tasks)
```


## Common Tasks

### Adding a New Data Source Adapter
1. Create adapter class inheriting from `IngestionAdapter`
2. Implement required methods
3. Add configuration schema
4. Write unit tests
5. Create integration test
6. Document usage

### Improving Schema Mapping
1. Analyze current accuracy metrics
2. Identify problem patterns
3. Enhance ML model training data
4. Test improvements
5. Monitor production metrics

### Debugging Data Quality Issues
1. Check ingestion logs
2. Validate source data
3. Review transformation rules
4. Inspect quality metrics
5. Implement fixes
6. Add regression tests


## Important Warnings

### Never Do These
- [Missing] Skip unit tests
- [Missing] Ignore performance benchmarks
- [Missing] Hardcode credentials
- [Missing] Bypass validation
- [Missing] Modify production data directly

### Always Do These
- [Done] Validate input data
- [Done] Handle errors gracefully
- [Done] Log important operations
- [Done] Monitor performance
- [Done] Update documentation


## Success Metrics

### Your Code Should
- Process 1M+ records/hour
- Maintain <0.1% error rate
- Use <8GB memory per worker
- Achieve >95% schema mapping accuracy
- Have >80% test coverage


## Getting Help

### Resources
- Technical questions: `#maba-dev` Slack channel
- Architecture decisions: Schedule with Tech Lead
- Performance issues: Check monitoring dashboard
- Security concerns: Contact Security Team

### Useful Commands
```bash
# Check system status
make status

# Run full test suite
make test

# Generate performance report
make benchmark

# Update documentation
make docs

# Deploy to staging
make deploy-staging
```


## Checklist Before Committing

- Code follows Python style guide
- All tests pass
- Performance benchmarks met
- Documentation updated
- Security scan passed
- PR description complete
- Related issues linked


**Remember**: MABA is the foundation of GTCX's data pipeline. Your code quality directly impacts the entire ecosystem. Build with excellence!


**Agent Support**: If you encounter issues, refer to `13 - agent-resources/troubleshooting.md`
