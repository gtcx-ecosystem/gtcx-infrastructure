# GA Evidence Summary

Generated: [YYYY-MM-DDTHH:MM:SS]Z
Source: [path-to-evidence-log]

| Gate                              | Last Evidence Date | Evidence                                               | Owner           | Entries |
| --------------------------------- | ------------------ | ------------------------------------------------------ | --------------- | ------- |
| Compliance Evidence (ISO 27001)   | [YYYY-MM-DD]       | `docs/operations/evidence-archive-index-[YYYY-MM].md`  | Compliance Lead | [n]     |
| Compliance Evidence (SOC2)        | [YYYY-MM-DD]       | `docs/operations/evidence-archive-index-[YYYY-MM].md`  | Compliance Lead | [n]     |
| Performance ([X] req/s)           | [YYYY-MM-DD]       | `docs/performance/results/[service]-[timestamp].md`    | Platform Lead   | [n]     |
| Reliability & Ops (DR Drill)      | [YYYY-MM-DD]       | `docs/operations/dr-drill-evidence-[YYYY-MM-DD].md`    | SRE Lead        | [n]     |
| Reliability & Ops (SLA Metrics)   | [YYYY-MM-DD]       | `docs/operations/sla-metrics-evidence-[YYYY-MM-DD].md` | SRE Lead        | [n]     |
| Security (Dependency Audit)       | [YYYY-MM-DD]       | `[path-to-audit-results]`                              | Security Lead   | [n]     |
| Security (Pen Test + Remediation) | [YYYY-MM-DD]       | `[path-to-pen-test-package]`                           | Security Lead   | [n]     |
| Security (SBOM)                   | [YYYY-MM-DD]       | `[path-to-sbom-file]`                                  | Security Lead   | [n]     |
| Security (Secret Scan)            | [YYYY-MM-DD]       | `[path-to-scan-output]`                                | Security Lead   | [n]     |

## Usage Notes

- This file is auto-generated from the evidence log. Do not edit manually.
- Re-run the summary script after new evidence entries are added to the log.
- All gates with 0 entries require evidence before sign-off can proceed.
