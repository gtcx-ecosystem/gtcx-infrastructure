---
title: 'Runbooks'
status: 'current'
date: '2026-05-02'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['architecture', 'infrastructure', 'devops', 'governance', 'telemetry']
review_cycle: 'quarterly'
---

# Runbooks

Incident response, escalation procedures, and on-call rotation.

## Contents

| File                                                                 | Description                                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [runbook-template.md](runbook-template.md)                           | Incident classification, on-call rotation, response playbooks, escalation, post-mortem |
| [audit-chain-incident-response.md](audit-chain-incident-response.md) | P0 path when `verifyChain` reports `valid: false` on a production batch                |
| [audit-signing-key-rotation.md](audit-signing-key-rotation.md)       | Scheduled + compromise-suspected Ed25519 keypair rotation for the audit-signer         |

## What belongs here

- Incident response playbooks
- Escalation procedures
- On-call rotation schedules
- Service recovery procedures
- Post-mortem templates

## What does NOT belong here

- Monitoring architecture → `architecture/monitoring/`
- Deployment automation → `engineering/devops/`
