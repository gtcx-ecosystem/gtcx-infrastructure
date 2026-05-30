---
title: 'Guide: ADRs vs System Design'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['architecture', 'infrastructure', 'frontend', 'database', 'agentic']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Guide: ADRs vs System Design

When to use an ADR versus a system design document.

## Use an ADR When

- A decision changes architecture or standards
- The decision has long-term impact
- Alternatives were considered

## Use System Design When

- You need a full architecture overview
- You are proposing a multi-component solution
- You need diagrams and data flow

## Workflow

1. Draft system design if needed
2. Capture any significant decisions as ADRs
3. Link ADRs from the system design doc

## Reference

- [ADR Template](./adr-template.md)
- System Design Template (`./2-system-design/system-design-template.md`)

## Metadata

- **Owner**: Architecture Lead
- **Effective Date**: [YYYY-MM-DD]
- **Last Reviewed**: [YYYY-MM-DD]
- **Next Review**: [YYYY-MM-DD]
