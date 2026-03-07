# Deployment — {project-name}

Infrastructure requirements, reference architecture, and deployment procedures.

---

## 1. Infrastructure Requirements

### 1.1 Compute

| Tier          | On-Prem Spec | Cloud Equivalent  | Notes   |
| ------------- | ------------ | ----------------- | ------- |
| Application   | {cpu/memory} | {instance type}   | {notes} |
| Database      | {cpu/memory} | {instance type}   | {notes} |
| Cache         | {memory}     | {instance type}   | {notes} |
| Load Balancer | {spec}       | {managed service} | {notes} |

### 1.2 Network Requirements

- Bandwidth: {inbound/outbound targets}
- Latency: {p95 target between components}
- Segmentation: {VPC, subnet, zone requirements}
- Security: {WAF, DDoS protection, IPS/IDS}

### 1.3 Software Dependencies

- OS: {version and kernel requirements}
- Runtime: {version — Node, Python, JVM, etc.}
- Database: {engine and version}
- Cache: {engine and version}

---

## 2. Reference Architecture

{Insert architecture diagram here — ASCII, Mermaid, or image link.}

**Environments**:

| Environment | Purpose                | URL           |
| ----------- | ---------------------- | ------------- |
| Production  | Live user traffic      | {prod-url}    |
| Staging     | Pre-release validation | {staging-url} |
| Development | Feature development    | {dev-url}     |

**Services**:

| Service     | Technology | CPU   | Memory   | Scale (min/max) |
| ----------- | ---------- | ----- | -------- | --------------- |
| {service-1} | {stack}    | {cpu} | {memory} | {min}/{max}     |
| {service-2} | {stack}    | {cpu} | {memory} | {min}/{max}     |

---

## 3. Deployment Procedures

### 3.1 Pre-Deployment Checklist

- [ ] Infrastructure provisioned and validated
- [ ] Network configuration verified
- [ ] TLS certificates valid
- [ ] Secrets and environment variables configured
- [ ] Database backups confirmed
- [ ] Monitoring and alerting active
- [ ] Rollback plan documented

### 3.2 Deployment Sequence

```bash
# 1. Build and push image
{build command}

# 2. Run database migrations (staging)
{migration command} --env staging

# 3. Deploy to staging
{deploy command} --env staging

# 4. Validate staging
{smoke test or health check command}

# 5. Deploy to production (requires approval)
{deploy command} --env production

# 6. Validate production
{health check command}
```

### 3.3 CI/CD Pipeline

```yaml
# Adapt to your CI system (GitHub Actions, GitLab CI, CircleCI, etc.)
on:
  push:
    branches: [main, staging]

jobs:
  test:
    steps:
      - run: { lint command }
      - run: { type check command }
      - run: { test command }

  build:
    needs: test
    steps:
      - run: { docker build and push command }

  deploy-staging:
    needs: build
    if: { staging branch condition }
    environment: staging
    steps:
      - run: { deploy to staging command }

  deploy-production:
    needs: build
    if: { main branch condition }
    environment: production # requires manual approval
    steps:
      - run: { deploy to production command }
```

---

## 4. Operational Runbooks

### Key rotation

```bash
# Rotate {secret name}
{rotation command}
# Update services
{restart/redeploy command}
```

### Database failover

```bash
# Trigger manual failover
{failover command}
# Verify replica is primary
{verification command}
```

### Incident — {critical service} down

1. Check health endpoint: `{health-url}`
2. Check logs: `{log command}`
3. Restart service: `{restart command}`
4. If unresolved — rollback: see section 5

---

## 5. Rollback Procedures

### Application rollback

```bash
# List recent deployments
{list revisions command}

# Roll back to previous version
{rollback command} --to-revision={revision-id}
```

### Database rollback

```bash
# Revert last migration
{migration revert command}

# Point-in-time recovery (last resort)
{pitr command} --point-in-time {timestamp}
```

---

## 6. Capacity Planning

| Metric     | Current Baseline | Scale-Up Threshold | Growth Model |
| ---------- | ---------------- | ------------------ | ------------ |
| {metric-1} | {value}          | {threshold}        | {projection} |
| {metric-2} | {value}          | {threshold}        | {projection} |

**Auto-scaling rules**:

| Metric                | Scale-Up At | Scale-Down At |
| --------------------- | ----------- | ------------- |
| CPU utilization       | >{n}%       | <{n}%         |
| Request latency (p95) | >{n}ms      | —             |

---

## 7. Disaster Recovery

**Objectives**:

| Component   | RTO    | RPO    |
| ----------- | ------ | ------ |
| Application | {time} | {time} |
| Database    | {time} | {time} |
| Full site   | {time} | {time} |

**Backup schedule**:

| Component      | Frequency   | Retention   | Storage    |
| -------------- | ----------- | ----------- | ---------- |
| Database       | {frequency} | {retention} | {location} |
| Object storage | {frequency} | {retention} | {location} |
| Configuration  | Git         | Indefinite  | VCS        |

**Full site recovery procedure**:

1. {step 1}
2. {step 2}
3. Validate with: `{validation command}`

---

## 8. Monitoring & Observability

**Metrics**: {collection tool} → {retention period} → {dashboard link}

**Logs**: {aggregation tool} → {retention period}

**Tracing**: {tracing tool} — sampling rate: {rate}

**Alert catalog**:

| Alert     | Severity | Condition   | Action   |
| --------- | -------- | ----------- | -------- |
| {alert-1} | Critical | {condition} | {action} |
| {alert-2} | Major    | {condition} | {action} |
| {alert-3} | Minor    | {condition} | {action} |

---

## Completion Checklist

- [ ] Infrastructure requirements documented by tier
- [ ] Architecture diagram included
- [ ] All environments defined with URLs
- [ ] Deployment sequence scripted and tested
- [ ] CI/CD pipeline configured
- [ ] Runbooks authored and validated
- [ ] Rollback procedures tested
- [ ] Capacity planning baselines established
- [ ] DR objectives defined with tested recovery procedure
- [ ] Monitoring stack and alerting configured
