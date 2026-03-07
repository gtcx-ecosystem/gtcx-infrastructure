# System Design — {system-name}

## Overview

{Describe what this system does in 2-3 sentences. Include its primary purpose, the key problem it solves, and who relies on it.}

## Goals & Non-Goals

**Goals:**

- {Primary objective this system must achieve.}
- {Secondary objective.}
- {Tertiary objective.}

**Non-Goals:**

- {Explicitly out of scope for this design iteration.}
- {Feature or concern intentionally deferred.}

## Architecture

```mermaid
graph TD
    A[{component-1}] --> B[{component-2}]
    B --> C[{component-3}]
    B --> D[{component-4}]
```

### Component Descriptions

| Component     | Responsibility | Technology       |
| ------------- | -------------- | ---------------- |
| {component-1} | {what it does} | {stack/language} |
| {component-2} | {what it does} | {stack/language} |
| {component-3} | {what it does} | {stack/language} |

## Data Model

### Key Entities

| Entity     | Description          | Storage          |
| ---------- | -------------------- | ---------------- |
| {entity-1} | {what it represents} | {database/table} |
| {entity-2} | {what it represents} | {database/table} |

### Relationships

- {entity-1} has many {entity-2}
- {entity-2} belongs to {entity-1}

## API Surface

| Method | Endpoint        | Description   |
| ------ | --------------- | ------------- |
| GET    | {/resource}     | {description} |
| POST   | {/resource}     | {description} |
| PUT    | {/resource/:id} | {description} |
| DELETE | {/resource/:id} | {description} |

## Infrastructure

- **Runtime**: {where it runs — Kubernetes, ECS, Lambda, bare metal}
- **Region(s)**: {deployment regions}
- **Scaling**: {horizontal/vertical, auto-scaling triggers}
- **Storage**: {databases, caches, object stores}
- **CI/CD**: {pipeline and deployment strategy}

## Security

- **Authentication**: {auth method — JWT, mTLS, API keys}
- **Authorization**: {RBAC, ABAC, policy engine}
- **Data Protection**: {encryption at rest, in transit, PII handling}
- **Threat Considerations**: {key attack vectors and mitigations}

## Observability

- **Logging**: {structured logging format, log aggregation tool}
- **Metrics**: {key metrics collected, dashboards}
- **Alerting**: {alert conditions, notification channels}
- **Tracing**: {distributed tracing approach, correlation IDs}

## Dependencies

### External Services

| Service     | Purpose               | SLA          | Fallback            |
| ----------- | --------------------- | ------------ | ------------------- |
| {service-1} | {why we depend on it} | {uptime SLA} | {degraded behavior} |

### Internal Services

| Service     | Purpose               | Owner  |
| ----------- | --------------------- | ------ |
| {service-1} | {why we depend on it} | {team} |

## Open Questions

- [ ] {Unresolved design decision or trade-off.}
- [ ] {Area needing further investigation.}
- [ ] {Decision blocked on external input.}

## Revision History

| Date         | Author   | Changes        |
| ------------ | -------- | -------------- |
| {YYYY-MM-DD} | {author} | Initial design |
