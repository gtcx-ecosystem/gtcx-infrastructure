---
title: 'SIGNAL Full Assessment — gtcx-infrastructure'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
command: signal-full
framework: gtcx-docs/01-docs/governance/frameworks/SIGNAL.md
scope: gtcx-infrastructure (platform / compliance substrate)
overall_signal: L2-low
target_signal: L4-low
baseline_commit: 6092700
---

# SIGNAL Full Assessment (2026-06-05)

**Scope:** `gtcx-infrastructure` — deployment, compliance substrate, agent governance gates, staging/prod EKS.  
**Framework:** [SIGNAL.md](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/01-docs/governance/frameworks/SIGNAL.md) — overall level = **lowest** dimension.  
**Distinction:** In-repo `signal-scorecard.json` (9.60/10) = **AI safety pillars**; this rail = **organizational SIGNAL maturity**.

**Evidence anchors:** `6092700`, `validate-signal.mjs` PASS @ 9.60, `validate-all` 50/51 (Docs Standard S4-08), repo hygiene 9.8, Hub #17 closed, `pnpm check:workspace-root-cleanliness:strict` exit 0.

---

# PHASE 1 — SIGNAL AUDIT

## Scorecard

| Dimension            | Level       | Gap to Next                                | Primary Blocker                                                                                        |
| -------------------- | ----------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Systems Architecture | **L2 high** | L3 — orchestrator + inter-agent tracing    | Single-service LLM paths; no in-repo multi-agent orchestrator                                          |
| Tooling              | **L2 high** | L3 — LangSmith/Helicone per LLM boundary   | 51-gate validate-all; no LLM trace tooling on gateway; `agent:next-work` breaks without `gtcx-agentic` |
| Process              | **L2 high** | L3 — semver prompts + agent integration CI | P22–P28 production-real; no per-engine prompt semver or agent integration tests in CI                  |
| Safeguards           | **L2 high** | L3 — per-agent IAM + fallback models       | Scorecard 9.60; gateway fail-closed strong; no OPA/Presidio on agent paths                             |
| Monitoring           | **L2 mid**  | L2 high — LLM cost/latency SLO dashboard   | Prometheus counters exist; no production LLM ops dashboard                                             |
| Team & Ownership     | **L2 low**  | L2 mid — infra Human Lead + on-call        | **AGENTS.md Human Lead: TBD**                                                                          |
| **Overall SIGNAL**   | **L2 low**  | **L4 low** (two levels)                    | **Team & Ownership**                                                                                   |

## Dimension detail

### Systems Architecture — L2 high

**Evidence:** compliance-gateway staging/prod; cost-router-shim → baseline-os; eval-pipeline + injection-suite; anomaly-detector CronJob; NATS audit + WORM; MCP read-only; Protocol 24 coordination + Hub #17 witness chain.

**Gaps to L3:** Named orchestrator routing engines; distributed trace trees across handoffs; durable agent queues (Temporal).

**Blockers:** Orchestration lives in sibling product repos; L2→L3 unlock = distributed tracing across agent boundaries.

### Tooling — L2 high

**Evidence:** `validate-all.mjs` 51 gates; workspace root cleanliness wired; `validate-signal.mjs` 9.60; CI P22 smoke + adoption checks; eval-pipeline workflow; gtcx-ctl validate --ci.

**Gaps to L3:** Helicone/LangSmith on gateway LLM calls; promptfoo on prompt PRs; fix `agent:next-work` → `gtcx-agentic` coupling for local + CI reliability.

**Blockers:** LLM observability not instrumented in this repo.

### Process — L2 high

**Evidence:** AGENTS.md §1.6 startup; Protocol 22–28 + checks; execution-roadmap witness; repo hygiene policy bootstrapped; Class A Hub #17 closed with evidence.

**Gaps to L3:** Semver `/prompts` per engine; agent integration CI; PR trace links.

**Blockers:** Governance exceeds agent-pipeline maturity.

### Safeguards — L2 high

**Evidence:** signal-scorecard 9.60; approval tickets + idempotency; replay-guard; tenant-bound audit bundles; validate-all security gates.

**Gaps to L3:** Per-agent IAM; Presidio; per-agent fallback/kill-switch.

**Blockers:** Gateway-centric safeguards ≠ orchestrated agent safeguards.

### Monitoring — L2 mid

**Evidence:** Gateway Prometheus metrics; anomaly-detector; OTel collector manifest; latest.json gates; baseline cost-stats SoR (cross-repo).

**Gaps to L2 high:** LLM latency/cost dashboard + SLO alerts; weekly agent eval report.

**Blockers:** AI-specific observability not dashboarded in infra.

### Team & Ownership — L2 low

**Evidence:** Personas + trust thresholds; Protocol 22; ecosystem AI reliability charter (protocols).

**Gaps to L2 mid:** Named infra Human Lead; infra AI on-call; mirror ecosystem owner in AGENTS.md.

**Blockers:** TBD Human Lead holds overall level at L2 low.

## Key findings

| Theme                  | Assessment                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Primary constraint** | Team & Ownership — Human Lead TBD                                                                            |
| **Highest-leverage**   | SIGNAL-INF-001 + SIGNAL-INF-002 (owner + LLM ops dashboard)                                                  |
| **Transition unlock**  | L2→L3: distributed tracing across agent boundaries                                                           |
| **Strengths**          | Safeguards 9.60; 51-gate validate-all; P27 culture; prod W2 substrate                                        |
| **Risks**              | Monitoring L2 mid; agent:next-work sibling dep; parallel agents without on-call; S4-08 docs drift for agents |

---

# PHASE 2 — TASKS

## Summary table

| ID             | Title                                        | Type       | Priority | Effort | Dimension(s)           |
| -------------- | -------------------------------------------- | ---------- | -------- | ------ | ---------------------- |
| SIGNAL-INF-001 | Name infra Human Lead + mirror AI owner      | Unlock     | P0       | XS     | Team                   |
| SIGNAL-INF-002 | LLM cost/latency dashboard                   | Unlock     | P0       | M      | Monitoring             |
| SIGNAL-INF-003 | Agent PR witness gate                        | Unlock     | P0       | S      | Process, Monitoring    |
| SIGNAL-INF-011 | Fix agent:next-work gtcx-agentic coupling    | Unlock     | P0       | S      | Tooling, Process       |
| SIGNAL-INF-004 | Helicone/LangSmith on gateway LLM            | Advance    | P1       | M      | Tooling, Monitoring    |
| SIGNAL-INF-005 | Injection-suite weekly witness               | Advance    | P1       | S      | Safeguards, Process    |
| SIGNAL-INF-006 | Agent failure taxonomy in coordination log   | Advance    | P1       | XS     | Safeguards, Monitoring |
| SIGNAL-INF-008 | Staging Prometheus/Grafana live + LLM panels | Advance    | P1       | M      | Monitoring             |
| SIGNAL-INF-007 | Cross-repo OTel trace_id on coordination     | Foundation | P2       | L      | Systems                |
| SIGNAL-INF-009 | Agent integration tests in CI                | Foundation | P2       | M      | Systems, Process       |
| SIGNAL-INF-010 | OPA sketch for P28 Class A writes            | Foundation | P3       | L      | Safeguards             |

## P0 — Unlock

### [SIGNAL-INF-001] Mirror ecosystem AI owner + name infra Human Lead

- **Type:** Unlock | **Priority:** P0 | **Effort:** XS
- **Dimension(s):** Team
- **Level impact:** Team L2 low → L2 mid (raises overall ceiling)
- **Current:** `AGENTS.md` — Human Lead: TBD
- **Target:** Named lead + link `gtcx-protocols/01-docs/04-ops/coordination/ai-reliability-owner-2026-06-06.md`
- **Implementation:** Edit AGENTS.md coordination table; update `01-docs/04-ops/coordination/README.md`; append `cross-repo-agent-log.md`
- **Dependencies:** None

### [SIGNAL-INF-011] Fix agent:next-work gtcx-agentic module coupling

- **Type:** Unlock | **Priority:** P0 | **Effort:** S
- **Dimension(s):** Tooling, Process
- **Level impact:** Tooling L2 high stability; unblocks P22 CI smoke locally
- **Current:** `ERR_MODULE_NOT_FOUND` for `gtcx-agentic/03-platform/scripts/lib/suggest-persona.mjs` @ `6092700`
- **Target:** Graceful fallback when sibling absent OR vendor `suggest-persona` into infra with re-export
- **Implementation:** Pin optional import in `03-platform/scripts/agent-next-work.mjs`; document sibling checkout in `01-docs/01-agents/onboarding/orientation.md`; verify CI checkout includes gtcx-agentic
- **Dependencies:** None

### [SIGNAL-INF-002] LLM cost/latency dashboard

- **Type:** Unlock | **Priority:** P0 | **Effort:** M
- **Dimension(s):** Monitoring
- **Level impact:** Monitoring L2 mid → L2 high
- **Current:** Gateway counters; baseline `cost-stats` not dashboarded
- **Target:** Grafana: token spend, p95 latency, error rate per route/model; monthly review
- **Implementation:** Export gateway metrics; import baseline cost-stats; `04-ship/monitoring/dashboards/llm-ops.json`
- **Dependencies:** SIGNAL-INF-001 (threshold owner)

### [SIGNAL-INF-003] Agent PR witness gate

- **Type:** Unlock | **Priority:** P0 | **Effort:** S
- **Dimension(s):** Process, Monitoring
- **Level impact:** Process L2 high → L2 full
- **Current:** P27 in-session; not uniform on agent-touch PRs
- **Target:** PR checklist: test + validate-all subset + evidence paths
- **Implementation:** `01-docs/04-ops/agent-pr-checklist.md` + `.github/pull_request_template.md` link
- **Dependencies:** SIGNAL-INF-001

## P1 — Advance

### [SIGNAL-INF-004] LLM observability on compliance-gateway

- **Type:** Advance | **P1** | **M** | Tooling, Monitoring
- Instrument `cost-router-shim.mjs` with Helicone or LangSmith; PII-redacted traces

### [SIGNAL-INF-005] Injection-suite CI witness cadence

- **Type:** Advance | **P1** | **S** | Safeguards, Process
- Weekly `workflow_dispatch` or validate-all optional gate; evidence JSON under `01-docs/05-audit/`

### [SIGNAL-INF-006] Infra agent failure taxonomy

- **Type:** Advance | **P1** | **XS** | Safeguards, Monitoring
- Structured columns in `cross-repo-agent-log.md` (agent_id, failure_class, trace_id, recovery)

### [SIGNAL-INF-008] Staging monitoring stack live

- **Type:** Advance | **P1** | **M** | Monitoring
- Apply monitoring overlay; verify Alertmanager; link runbook

## P2/P3 — Foundation

### [SIGNAL-INF-007] Cross-repo OTel trace correlation — P2, L — Systems L2→L3

### [SIGNAL-INF-009] Agent integration tests in CI — P2, M — Systems, Process

### [SIGNAL-INF-010] OPA sketch for P28 Class A — P3, L — Safeguards L3→L4

## Sprint Zero (top 5)

1. SIGNAL-INF-001 — Name Human Lead
2. SIGNAL-INF-011 — Fix agent:next-work coupling
3. SIGNAL-INF-006 — Failure taxonomy (XS)
4. SIGNAL-INF-003 — Agent PR checklist
5. SIGNAL-INF-002 — LLM ops dashboard (start)

---

# PHASE 3 — ROADMAP

**Current overall:** L2 low  
**Target:** L4 low (+2 levels)

## Level projection

| Dimension            | Now        | After Phase 1 (L3) | After Phase 2 (L4) |
| -------------------- | ---------- | ------------------ | ------------------ |
| Systems Architecture | L2 high    | **L3 low**         | L3 high            |
| Tooling              | L2 high    | **L3 low**         | L3 high            |
| Process              | L2 high    | **L3 low**         | L3 high            |
| Safeguards           | L2 high    | L2 high            | **L3 low**         |
| Monitoring           | L2 mid     | **L2 high**        | **L3 low**         |
| Team & Ownership     | L2 low     | **L2 mid**         | **L2 high**        |
| **Overall**          | **L2 low** | **L3 low**         | **L4 low**         |

## PHASE 1 — Advancing to L3 (Orchestrated)

**Duration:** 6–10 weeks  
**Unlock:** Distributed tracing across agent boundaries

| #   | L2→L3 criterion          | Task                                             |
| --- | ------------------------ | ------------------------------------------------ |
| 1   | Two+ named engines       | Topology doc: gateway + eval + anomaly-detector  |
| 2   | Orchestrator routes      | Document baseline `agent:next-work` + NATS audit |
| 3   | Inter-agent tracing      | SIGNAL-INF-007                                   |
| 4   | Per-agent prompt version | Semver `01-docs/05-audit/prompts/` tags          |
| 5   | Durable task queue       | NATS JetStream (existing); Temporal Phase 2      |
| 6   | Fallback model           | SIGNAL-INF-004 via cost-router                   |
| 7   | Agent failure incidents  | SIGNAL-INF-006 + PagerDuty                       |
| 8   | AI reliability owner     | SIGNAL-INF-001                                   |
| 9   | Per-agent cost/quality   | SIGNAL-INF-002, INF-004                          |
| 10  | Agent integration CI     | SIGNAL-INF-009                                   |

### Week-by-week (implementation-ready)

| Week | Deliverable                                      | Verification                                                     |
| ---- | ------------------------------------------------ | ---------------------------------------------------------------- |
| 1    | SIGNAL-INF-001, INF-011, INF-006                 | AGENTS.md named lead; `pnpm agent:next-work` exit 0 locally + CI |
| 2    | SIGNAL-INF-003, INF-005                          | PR template + one injection-suite evidence JSON                  |
| 3    | SIGNAL-INF-008                                   | Staging Grafana reachable; alert routes green                    |
| 4    | SIGNAL-INF-002                                   | LLM panel shows 7d token trend                                   |
| 5    | SIGNAL-INF-004                                   | LangSmith/Helicone trace for staging LLM call                    |
| 6    | SIGNAL-INF-007 pilot                             | trace_id on 3 coordination tickets + OTel span                   |
| 7–8  | SIGNAL-INF-009                                   | CI job: gateway + eval smoke integration test                    |
| 9    | `01-docs/architecture/agent-topology-2026-Q3.md` | Named engines + handoff diagram                                  |
| 10   | Re-assessment                                    | Checkpoint below                                                 |

### Re-assessment checkpoint (Phase 1 gate)

```bash
pnpm agent:next-work                    # exit 0
pnpm check:workspace-root-cleanliness:strict  # exit 0
node 03-platform/tools/03-platform/scripts/validate-all.mjs     # ≥50/51 pass
node 03-platform/tools/03-platform/scripts/validate-signal.mjs  # ≥9.0
```

Manual: Grafana LLM dashboard 7d trend; one distributed trace spanning two repos in staging evidence JSON; 3 agent incidents with taxonomy columns.

**Gate to Phase 2:** Monitoring ≥ L2 high; Team ≥ L2 mid; tracing pilot evidenced.

## PHASE 2 — Advancing to L4 (Autonomous)

**Duration:** 3–6 months post Phase 1  
**Unlock:** OPA policy layer + automated human escalation

| Workstream    | Tasks                              | Outcome                     |
| ------------- | ---------------------------------- | --------------------------- |
| Policy        | SIGNAL-INF-010 + P28 OPA           | Class A writes policy-gated |
| Autonomous CI | Agent PR → validate-all → evidence | E2E to human-merge only     |
| Safeguards    | Quarterly kill-switch drill        | Documented rollback         |
| Legal         | EXT-INF-002, EXT-INF-014           | Human Class S parallel      |

### Phase 2 checkpoint

- OPA denies unapproved Class A write in staging
- One agent PR merged with full validate-all witness
- Escalation rate tracked 30d; Overall SIGNAL ≥ L4 low

## Critical path

```
SIGNAL-INF-001 → SIGNAL-INF-011 → SIGNAL-INF-002/004 → SIGNAL-INF-007 → SIGNAL-INF-009 → Phase 1 gate → SIGNAL-INF-010 → L4
```

## Quick wins (< 1 week)

| Task           | Effort | Impact            |
| -------------- | ------ | ----------------- |
| SIGNAL-INF-001 | XS     | Team unlock       |
| SIGNAL-INF-006 | XS     | Incident taxonomy |
| SIGNAL-INF-011 | S      | P22 reliability   |
| SIGNAL-INF-003 | S      | Process hardening |
| SIGNAL-INF-005 | S      | Red-team cadence  |

---

_Assessor: platform-architect agent · Witness: `6092700` · Prior: `signal-assessment-2026-06-07.md`_
