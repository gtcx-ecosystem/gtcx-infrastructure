---
title: Operator journey map
date: 2026-06-10
owner: gtcx-infrastructure
---

# Operator journey map

Control-plane journeys for **gtcx-infrastructure** (not end-user trade flows).

```mermaid
flowchart LR
  subgraph integrator [Sibling integrator]
    A[Inbound handoff] --> B[Wait for seal]
    B --> C[Product prereq check]
  end
  subgraph operator [Platform operator]
    D[DaaS card] --> E[Staging scripts / TF / kubectl]
    E --> F[Fleet health witness]
  end
  subgraph security [Security operator]
    G[Sovereign register] --> H[SECaaS friction]
    H --> I[Evidence ingest]
  end
  A --> D
  E --> B
  F --> C
  G --> H
```

| Phase     | Journey                    | EXR     | JTBD                         |
| --------- | -------------------------- | ------- | ---------------------------- |
| Handoff   | Staging substrate delivery | EXR-001 | JTBD-staging-substrate-ready |
| Witness   | Fleet health proof         | EXR-002 | JTBD-fleet-health-witness    |
| Assurance | Security evidence path     | EXR-003 | JTBD-security-evidence-path  |

Sibling product journeys: link only — e.g. compliance-os EXR-001 evidence intake.
