---
title: Goals and metrics — control plane UX
date: 2026-06-10
---

# Goals and metrics

## User goals (leading)

| Goal                                | Persona            | Leading metric                           | Target       |
| ----------------------------------- | ------------------ | ---------------------------------------- | ------------ |
| Staging handoff completes with seal | sibling-integrator | Time from inbound doc → outbound seal    | < 1 sprint   |
| Fleet health trusted                | platform-operator  | `daas:fleet:health` PASS rate per week   | 100% at seal |
| Assurance parallel track honest     | security-operator  | Sovereign vs friction register drift     | 0 mismatches |
| Evidence traceable                  | compliance-buyer   | Leadership decisions with evidence paths | 100% Class S |

## Lagging outcomes

| Outcome                   | Metric                    | Source                               |
| ------------------------- | ------------------------- | ------------------------------------ |
| DaaS program sealed       | DAAS-S1–S3 `complete`     | `pm/daas-roadmap.json`               |
| SECaaS S2 progress        | SEC-PENTEST-01 status     | `pm/security-friction-register.json` |
| Engineering readiness     | validate-all pass count   | `audit/latest.json`                  |
| External assurance burden | `externalBlockers.burden` | `audit/latest.json`                  |

## Anti-metrics (do not optimize)

- Raw terraform apply count without witness
- Story closure without exit codes
- Pen-test "complete" without vendor artifact
