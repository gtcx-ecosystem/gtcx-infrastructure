# Production Readiness Review — {service-name}

## Overview

- **Service**: {service-name}
- **Description**: {service-description}
- **Target launch date**: {date}
- **Reviewer**: {reviewer-name}
- **Review date**: {date}

## Checklist

### Infrastructure

- [ ] Deployment configuration reviewed and tested
- [ ] Auto-scaling rules defined and validated
- [ ] Resource limits (CPU, memory) set for all containers
- [ ] Secrets managed via vault / secrets manager (no hardcoded values)
- [ ] DNS and load balancer configuration verified
- [ ] TLS certificates provisioned and auto-renewing

### Reliability

- [ ] Health check endpoints implemented (liveness + readiness)
- [ ] Graceful shutdown handles in-flight requests
- [ ] Circuit breakers configured for downstream dependencies
- [ ] Retry policies with exponential backoff in place
- [ ] Rate limiting configured for public-facing endpoints
- [ ] Timeout values set for all external calls

### Observability

- [ ] Structured logging with correlation IDs
- [ ] Application metrics exported (latency, error rate, throughput)
- [ ] Distributed tracing enabled
- [ ] Alerting rules defined for critical paths
- [ ] Dashboards created for key service metrics
- [ ] Error tracking integrated (Sentry, etc.)

### Security

- [ ] Authentication and authorization enforced on all endpoints
- [ ] Input validation on all user-supplied data
- [ ] Dependency audit clean (no critical/high vulnerabilities)
- [ ] CORS policy configured and restricted
- [ ] CSP headers set for web-facing services
- [ ] Secrets rotated and access scoped to least privilege

### Data

- [ ] Database migrations tested against production-like data
- [ ] Backup strategy documented and verified
- [ ] Rollback plan for schema changes tested
- [ ] Data retention policy defined and enforced
- [ ] PII handling reviewed and compliant

### Operations

- [ ] Runbook exists for common failure scenarios
- [ ] On-call rotation assigned
- [ ] Rollback procedure documented and rehearsed
- [ ] Load testing performed at expected peak traffic
- [ ] Incident response plan references this service
- [ ] Feature flags in place for risky changes

### Documentation

- [ ] API documentation published and up to date
- [ ] Architecture diagram current
- [ ] Changelog updated for this release
- [ ] Consumer/integration guides available

## Open Issues

| Issue     | Severity                       | Owner   | Status                        |
| --------- | ------------------------------ | ------- | ----------------------------- |
| {issue-1} | Critical / High / Medium / Low | {owner} | Open / In Progress / Resolved |
| {issue-2} | Critical / High / Medium / Low | {owner} | Open / In Progress / Resolved |

## Sign-off

| Role        | Name   | Approved | Date   |
| ----------- | ------ | -------- | ------ |
| Engineering | {name} | Yes / No | {date} |
| Security    | {name} | Yes / No | {date} |
| Operations  | {name} | Yes / No | {date} |
| Product     | {name} | Yes / No | {date} |

## Verdict

**{GO / NO-GO}**

{conditions — if conditional GO, list what must be resolved before launch.}
