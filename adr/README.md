---
title: 'Architecture Decision Record (ADR) Registry'
status: 'current'
date: '2026-05-12'
owner: 'frontier-infra-engineer'
role: 'protocol-architect'
tier: 'critical'
tags: ['adr', 'architecture', 'decisions', 'registry']
review_cycle: 'quarterly'
---

# Architecture Decision Record (ADR) Registry

**Date:** 2026-05-12  
**Status:** Active  
**Format:** Markdown with YAML frontmatter  
**Location:** `adr/`

---

## 1. Purpose

This registry tracks all significant architecture decisions affecting the GTCX infrastructure platform. Each ADR captures:

- **Context** — What forces were at play
- **Decision** — What was decided
- **Consequences** — What becomes easier or harder

---

## 2. ADR Index

| #   | ADR                               | Title                                     | Status   | Date       | Owner                |
| --- | --------------------------------- | ----------------------------------------- | -------- | ---------- | -------------------- |
| 001 | `adr-001-ecs-to-eks.md`           | Migrate from ECS to EKS                   | Accepted | 2024-03-15 | Platform Engineering |
| 002 | `adr-002-postgres-rds.md`         | PostgreSQL on RDS with Multi-AZ           | Accepted | 2024-04-02 | Database Team        |
| 003 | `adr-003-oidc-github-actions.md`  | GitHub OIDC for CI/CD Authentication      | Accepted | 2024-05-10 | Security             |
| 004 | `adr-004-af-south-1-primary.md`   | af-south-1 as Primary Region              | Accepted | 2024-06-01 | Platform Engineering |
| 005 | `adr-005-terraform-state-s3.md`   | S3 + DynamoDB for Terraform State         | Accepted | 2024-06-15 | Platform Engineering |
| 006 | `adr-006-pnpm-workspace.md`       | pnpm Workspace for Monorepo               | Accepted | 2024-07-20 | Developer Experience |
| 007 | `adr-007-linkerd-service-mesh.md` | Linkerd for mTLS Service Mesh             | Proposed | 2025-01-10 | Platform Engineering |
| 008 | `adr-008-anomaly-detection.md`    | Anomaly Detection with Prometheus Rules   | Accepted | 2025-03-01 | ML Engineering       |
| 009 | `adr-009-worm-audit-storage.md`   | WORM S3 for Audit Trail                   | Accepted | 2025-04-15 | Security             |
| 010 | `adr-010-kms-signing-ecc-p256.md` | KMS ECC_NIST_P256 for Protocol Signing    | Accepted | 2026-05-10 | Security             |
| 011 | `adr-011-irsa-platforms.md`       | IRSA for gtcx-platforms Workload Identity | Accepted | 2026-05-10 | Platform Engineering |
| 012 | `adr-012-eval-pipeline.md`        | Eval Pipeline for AI Output Validation    | Accepted | 2026-05-12 | ML Engineering       |

---

## 3. Status Definitions

| Status     | Meaning                   | Next Step                       |
| ---------- | ------------------------- | ------------------------------- |
| Proposed   | Decision under discussion | Seek feedback; schedule review  |
| Accepted   | Decision ratified         | Implement; update affected docs |
| Deprecated | Decision superseded       | Reference replacement ADR       |
| Superseded | Replaced by newer ADR     | Archive; link to replacement    |

---

## 4. Naming Convention

```
adr-<NNN>-<short-kebab-description>.md
```

- `NNN` — Zero-padded sequence number
- `short-kebab-description` — 3–5 kebab-case words

---

## 5. Template

```markdown
---
title: 'ADR-NNN: <Title>'
status: 'proposed|accepted|deprecated|superseded'
date: 'YYYY-MM-DD'
owner: '<name>'
tags: ['adr', '<domain>']
---

# ADR-NNN: <Title>

## Context

<What is the issue that we're seeing that is motivating this decision or change?>

## Decision

<What is the change that we're proposing or have agreed to implement?>

## Consequences

### Positive

- <What becomes easier?>

### Negative

- <What becomes harder?>

### Neutral

- <What changes but is neither positive nor negative?>

## Alternatives Considered

| Alternative | Rejected Because |
| ----------- | ---------------- |
| <Option A>  | <Reason>         |
| <Option B>  | <Reason>         |

## References

- <Link to related docs, PRs, issues>
```

---

## 6. Machine-Enforced Naming

All ADRs must:

1. Be in `adr/` root (not nested)
2. Follow naming convention `adr-NNN-*.md`
3. Include YAML frontmatter with `title`, `status`, `date`, `owner`
4. Be referenced in this registry

Validation:

```bash
# Check naming convention
find adr/ -maxdepth 1 -name "adr-[0-9][0-9][0-9]-*.md" | wc -l

# Check frontmatter
find adr/ -maxdepth 1 -name "adr-*.md" -exec grep -L "^---$" {} \;

# Check registry references
for f in adr/adr-*.md; do
  grep -q "$(basename "$f")" adr/README.md || echo "Missing: $f"
done
```

---

## 7. Related Documents

- `docs/architecture/` — Architecture diagrams and deep-dives
- `docs/audit/archive/10-10-roadmap-2026-05-12.md` — Roadmap including ADR registry completion
- `docs/engineering/` — Engineering standards and conventions
