---
title: 'SIGNAL Full Assessment — gtcx-infrastructure'
status: current
date: 2026-06-07
owner: gtcx-infrastructure
command: signal-full
framework: gtcx-docs/01-docs/governance/frameworks/SIGNAL.md
scope: gtcx-infrastructure (platform / compliance substrate)
overall_signal: L2-low
target_signal: L4-low
baseline_commit: HEAD
---

# SIGNAL Full Assessment (2026-06-07)

**Scope:** `gtcx-infrastructure` — deployment, compliance substrate, agent governance gates, staging EKS.  
**Framework:** [SIGNAL.md](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/01-docs/governance/frameworks/SIGNAL.md) — overall level = **lowest** dimension.  
**Note:** This repo scores **SIGNAL-E (engineering + platform AI)**. End-user product AI (SIGNAL-P) lives primarily in `gtcx-intelligence`, `gtcx-mobile`, `exploration-os`. The in-repo **compliance SIGNAL scorecard** (`01-docs/05-audit/signal-scorecard.json`, 9.6/10) measures **AI safety pillars** (supervision/integrity/governance) — distinct from this maturity rail.

**Evidence anchors:** `01-docs/05-audit/latest.json` (IR 7.9, agenticMaturity 8.2), `validate-all` **50/50** @ `9d7d763`, `signal-scorecard.json` 9.60, Protocol 22–28 adoption, witness mode (`backlogClear: true`), USSD soak + gtcx-ctl validate --ci in CI.

**Re-scored:** 2026-06-07 (session `baseline session` @ `9d7d763`) — scores unchanged; witness gates refreshed.

---

# PHASE 1 — SIGNAL AUDIT

## Scorecard

| Dimension            | Level       | Gap to Next                                         | Primary Blocker                                                                                                               |
| -------------------- | ----------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Systems Architecture | **L2 high** | L3 — named orchestrator + inter-agent tracing       | Single-service LLM paths in compliance-gateway; no Temporal/NATS agent orchestrator in-repo                                   |
| Tooling              | **L2 high** | L3 — LangSmith/OTel per agent boundary              | 48-gate validate-all, P22 smoke, eval-pipeline workflow, gtcx-ctl, baseline cost-router shim; no Helicone/LangSmith project   |
| Process              | **L2 high** | L3 — per-agent prompt semver + agent integration CI | Protocols 22/26/27/28 production-real; audit prompts in Git; no semver `/prompts` per engine                                  |
| Safeguards           | **L2 high** | L3 — per-agent fallback + scoped IAM                | fail-closed signing, replay-guard, P28 Class S/A/R, injection-suite, anomaly-detector staging; no OPA/Presidio on agent paths |
| Monitoring           | **L2 mid**  | L2 high — LLM cost/latency SLO dashboard            | Prometheus/Grafana manifests + anomaly CronJob; no live LLM token dashboard; globalSouthResilience 5.5                        |
| Team & Ownership     | **L2 low**  | L2 mid — infra Human Lead + on-call linkage         | Ecosystem AI owner filed (protocols); **AGENTS.md Human Lead: TBD**; no infra-specific AI on-call                             |
| **Overall SIGNAL**   | **L2 low**  | **L4 low** (two levels)                             | **Team & Ownership** (infra lead TBD)                                                                                         |

## Dimension detail

### Systems Architecture — L2 high

**Evidence (production-real):**

- `compliance-gateway` on staging EKS — LLM inference path with cost-router shim (`03-platform/tools/compliance-gateway/src/cost-router-shim.mjs` → baseline-os).
- `eval-pipeline` + `injection-suite.mjs` — AI output validation and red-team payloads.
- `anomaly-detector` — 5 rules, staging CronJob (`build-push-anomaly-detector.yml`).
- NATS audit bus + WORM pipeline; MCP read-only tool surface (`compliance-gateway-mcp`).
- Cross-repo agent substrate: `pnpm agent:next-work`, `.baseline/launch-focus.json`, coordination outbound tickets.

**Gaps to L3:** No orchestrator routing named engines; intelligence-orchestrator is sibling product; no distributed trace trees across agent handoffs; durable agent queues (Temporal) not in infra.

### Tooling — L2 high

**Evidence:**

- `node 03-platform/tools/scripts/validate-all.mjs` — **48 gates** (coverage, static, security, build).
- CI: Protocol 22 `agent:next-work` smoke, adoption checks, `gtcx-ctl validate --ci` (IR-3.4).
- `eval-pipeline.yml` — model benchmark CI on gateway/eval changes.
- `03-platform/tools/scripts/validate-signal.mjs` — compliance scorecard gate (9.6/10).
- Turbo monorepo: lint/typecheck/test/build across 13 packages.

**Gaps to L3:** No LangSmith/Braintrust/Helicone wired to compliance-gateway LLM calls; promptfoo lives in sibling repos.

### Process — L2 high

**Evidence:**

- Mandatory agent startup (AGENTS.md §1.6): baseline → session → `git status` → `agent:next-work` → Proceed Brief.
- Protocol 22 work register (`01-docs/04-ops/agent-work-selection.md`); Protocol 26/27/28 cursor rules + checks.
- Audit prompts versioned under `01-docs/05-audit/prompts/`; execution-roadmap reconcile discipline.
- `execute-roadmap` + `auto-dev-state.md` witness chain.

**Gaps to L3:** Agent instructions are markdown docs, not semver-tagged per-engine prompts; no agent integration test suite in main CI path (only P22 smoke).

### Safeguards — L2 high

**Evidence:**

- `signal-scorecard.json`: Supervision 9.7, Integrity 9.8, Governance 9.5, Alignment 10.0.
- Approval tickets + idempotency on mutating gateway paths; MCP exposes read-only tools only.
- Replay-protection package (90%+ branch coverage); tenant binding on `/audit/bundles`.
- Secret scan, FIPS gate, audit-sink production guard, disk-queue durability in validate-all.

**Gaps to L3:** No per-agent IAM scoping; no Presidio on data paths; no per-workflow agent kill-switch (feature flags are product-level).

### Monitoring — L2 mid

**Evidence:**

- `01-docs/05-audit/latest.json` gates all green; `auto-dev-state.md` machine-readable posture.
- Gateway Prometheus metrics (S2-05): route/status/exception counters.
- Anomaly detector + eval-pipeline workflows; DR/live-restore evidence gates.
- OTel collector manifest (`04-ship/kubernetes/base/services/otel-collector.yaml`).

**Gaps to L2 high / L3:** Monitoring stack **partial** deploy (Global South plan 1.3); no production LLM latency/cost dashboard; no weekly agent eval report; no per-agent error-rate SLO.

### Team & Ownership — L2 low

**Evidence:**

- Personas + trust thresholds (AGENTS.md); Builder/Reviewer coordination contract.
- Protocol 22 removes human story-picking for automatable work.
- Ecosystem AI reliability charter (GOV-AI-001, protocols `ai-reliability-owner-2026-06-06.md`).

**Gaps to L2 mid:** **Human Lead: TBD** in infra `AGENTS.md`; no infra-specific AI on-call rotation; pen-test/ZWCMP human gates (EXT-INF) block assurance closure.

## Key findings

| Theme                         | Assessment                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary constraint**        | **Team & Ownership** — infra Human Lead unset; ecosystem owner not mirrored in repo coordination table                                       |
| **Highest-leverage move**     | Name infra Human Lead + link ecosystem AI reliability owner; wire baseline `cost-stats` dashboard for gateway LLM spend                      |
| **Transition unlock (L2→L3)** | Distributed tracing across agent boundaries (baseline trace_id → coordination tickets → gateway spans)                                       |
| **Strengths**                 | Strongest safeguards rail in ecosystem (scorecard 9.6); 48-gate validate-all; production staging substrate; Protocol 27 in-session execution |
| **Risks**                     | Monitoring L2 mid caps overall advance; 11+ parallel Cursor agents observed (ops maturity); EXT-INF human gates stall GR-T2                  |

---

# PHASE 2 — TASKS

## Summary table

| ID             | Title                                                              | Type       | Priority | Effort | Dimension(s)           |
| -------------- | ------------------------------------------------------------------ | ---------- | -------- | ------ | ---------------------- |
| SIGNAL-INF-001 | Mirror ecosystem AI owner + name infra Human Lead in AGENTS.md     | Unlock     | P0       | XS     | Team                   |
| SIGNAL-INF-002 | LLM cost/latency dashboard — baseline cost-stats + gateway metrics | Unlock     | P0       | M      | Monitoring             |
| SIGNAL-INF-003 | Agent PR witness gate — validate-all slice on agent-touch PRs      | Unlock     | P0       | S      | Process, Monitoring    |
| SIGNAL-INF-004 | Helicone or LangSmith on compliance-gateway LLM calls              | Advance    | P1       | M      | Tooling, Monitoring    |
| SIGNAL-INF-005 | Wire injection-suite into validate-all or weekly CI cron           | Advance    | P1       | S      | Safeguards, Process    |
| SIGNAL-INF-006 | Infra agent failure taxonomy in coordination log                   | Advance    | P1       | XS     | Safeguards, Monitoring |
| SIGNAL-INF-007 | Cross-repo OTel trace_id on outbound coordination tickets          | Foundation | P2       | L      | Systems                |
| SIGNAL-INF-008 | Deploy Prometheus/Grafana to staging with LLM panels               | Advance    | P1       | M      | Monitoring             |
| SIGNAL-INF-009 | Per-agent integration test job in CI (gateway + eval smoke)        | Foundation | P2       | M      | Systems, Process       |
| SIGNAL-INF-010 | OPA policy sketch for P28 Class A infra writes                     | Foundation | P3       | L      | Safeguards             |

---

## P0 — Unlock

### [SIGNAL-INF-001] Mirror ecosystem AI owner + name infra Human Lead

- **Type:** Unlock
- **Dimension(s):** Team
- **Level impact:** Team **L2 low → L2 mid** — raises overall ceiling
- **Current:** `AGENTS.md` coordination table: **Human Lead: TBD**
- **Target:** Named lead + link to `gtcx-protocols/01-docs/operations/coordination/ai-reliability-owner-2026-06-06.md`
- **Implementation:** Update AGENTS.md + `01-docs/04-ops/coordination/README.md`; append `cross-repo-agent-log.md`
- **Effort:** XS | **Priority:** P0 | **Dependencies:** None

### [SIGNAL-INF-002] LLM cost/latency dashboard (gateway + baseline)

- **Type:** Unlock
- **Dimension(s):** Monitoring
- **Level impact:** Monitoring **L2 mid → L2 high**
- **Current:** Gateway Prometheus counters; baseline-os `cost-stats` exists but not dashboarded in infra
- **Target:** Grafana panel: token spend, p95 latency, error rate per model/route; monthly review ritual
- **Implementation:** Export gateway LLM metrics; import baseline cost-stats JSON; add `04-ship/monitoring/dashboards/llm-ops.json`
- **Effort:** M | **Priority:** P0 | **Dependencies:** SIGNAL-INF-001 (owner signs off thresholds)

### [SIGNAL-INF-003] Agent PR witness gate

- **Type:** Unlock
- **Dimension(s):** Process, Monitoring
- **Level impact:** Process **L2 high → L2 full**
- **Current:** P27 requires in-session gates; not enforced on every agent-touch PR
- **Target:** PR checklist: code → `pnpm test`; gates → `validate-all` or documented subset; evidence path in PR body
- **Implementation:** `01-docs/04-ops/agent-pr-checklist.md` + PR template link; CI comment bot optional
- **Effort:** S | **Priority:** P0 | **Dependencies:** SIGNAL-INF-001

---

## P1 — Advance

### [SIGNAL-INF-004] LLM observability on compliance-gateway

- **Type:** Advance | **Priority:** P1 | **Effort:** M
- **Dimension(s):** Tooling, Monitoring
- **Implementation:** Instrument `cost-router-shim.mjs` with Helicone/LangSmith; redact PII in traces

### [SIGNAL-INF-005] Injection-suite in CI witness cadence

- **Type:** Advance | **Priority:** P1 | **Effort:** S
- **Dimension(s):** Safeguards, Process
- **Implementation:** Weekly `workflow_dispatch` or validate-all optional gate on `03-platform/tools/eval-pipeline/injection-suite.mjs`

### [SIGNAL-INF-006] Infra agent failure taxonomy

- **Type:** Advance | **Priority:** P1 | **Effort:** XS
- **Dimension(s):** Safeguards, Monitoring
- **Implementation:** Copy protocols SIGNAL-006 template into `01-docs/04-ops/coordination/cross-repo-agent-log.md`

### [SIGNAL-INF-008] Staging monitoring stack live

- **Type:** Advance | **Priority:** P1 | **Effort:** M
- **Dimension(s):** Monitoring
- **Implementation:** `kubectl apply` monitoring overlay; verify Alertmanager routes; link runbook

---

## P2/P3 — Foundation

### [SIGNAL-INF-007] Cross-repo OTel trace correlation

- **Type:** Foundation | **Priority:** P2 | **Effort:** L
- **Level impact:** Systems **L2 high → L3 low**

### [SIGNAL-INF-009] Agent integration tests in CI

- **Type:** Foundation | **Priority:** P2 | **Effort:** M

### [SIGNAL-INF-010] OPA sketch for P28 Class A writes

- **Type:** Foundation | **Priority:** P3 | **Effort:** L

---

## Sprint Zero (top 5)

1. **SIGNAL-INF-001** — Name Human Lead + link AI reliability owner
2. **SIGNAL-INF-003** — Agent PR witness checklist
3. **SIGNAL-INF-006** — Failure taxonomy (XS quick win)
4. **SIGNAL-INF-005** — Injection-suite weekly witness
5. **SIGNAL-INF-002** — LLM ops dashboard (starts Monitoring unlock)

---

# PHASE 3 — ROADMAP

**Current overall:** **L2 low**  
**Target:** **L4 low** (two full levels: L3, then L4)

---

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

---

## PHASE 1 — Advancing to L3 (Orchestrated)

**Duration:** 6–10 weeks  
**Unlock:** Distributed tracing across agent boundaries (L2→L3 transition checklist #3)

| #   | L2→L3 criterion                | Infra task                                                                                      |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | Two+ named AI engines          | compliance-gateway + eval-pipeline + anomaly-detector (name in topology doc)                    |
| 2   | Orchestrator routes tasks      | Document baseline-os `agent:next-work` + launch-focus as control plane; NATS audit as event bus |
| 3   | Inter-agent tracing            | **SIGNAL-INF-007** — trace_id on coordination tickets + OTel spans                              |
| 4   | Per-agent prompt version       | Semver `01-docs/05-audit/prompts/` + gateway system-prompt tags                                 |
| 5   | Durable task queue             | NATS JetStream audit + deploy queue (existing); Temporal = Phase 2                              |
| 6   | Fallback model                 | **SIGNAL-INF-004** — Portkey/LiteLLM via cost-router                                            |
| 7   | Agent failure incidents        | **SIGNAL-INF-006** taxonomy + PagerDuty route                                                   |
| 8   | AI reliability owner           | **SIGNAL-INF-001**                                                                              |
| 9   | Per-agent cost/quality metrics | **SIGNAL-INF-002**, **SIGNAL-INF-004**                                                          |
| 10  | Agent integration tests in CI  | **SIGNAL-INF-009**                                                                              |

### Implementation-ready checklist (Phase 1)

- [ ] **Week 1:** SIGNAL-INF-001, INF-006, INF-003 (ownership + process)
- [ ] **Week 2:** SIGNAL-INF-002 + INF-008 — staging Grafana live with LLM panel
- [ ] **Week 3:** SIGNAL-INF-004 — instrument gateway LLM calls
- [ ] **Week 4:** SIGNAL-INF-005 — injection-suite weekly cron + evidence JSON
- [ ] **Week 5–6:** SIGNAL-INF-007 — trace_id propagation pilot (infra ↔ protocols tickets)
- [ ] **Week 7–8:** SIGNAL-INF-009 — agent integration test job in `ci.yml`
- [ ] **Week 9:** Topology doc: `01-docs/architecture/agent-topology-2026-Q3.md`
- [ ] **Week 10:** Re-assessment checkpoint (below)

### Re-assessment checkpoint (end Phase 1)

```bash
pnpm agent:next-work
node 03-platform/tools/scripts/validate-all.mjs          # expect 48+ pass
node 03-platform/tools/scripts/validate-signal.mjs       # expect ≥9.0
node --test 03-platform/tools/eval-pipeline/injection-suite.mjs  # if wired
# Manual: Grafana LLM dashboard shows 7d token trend
# Manual: 3 agent incidents logged with taxonomy columns
```

**Gate to Phase 2:** Monitoring ≥ L2 high; Team ≥ L2 mid; at least one distributed trace spanning two repos in staging evidence JSON.

---

## PHASE 2 — Advancing to L4 (Autonomous engineering workflows)

**Duration:** 3–6 months after Phase 1 gate  
**Unlock:** Policy layer (OPA) with automated human escalation (L3→L4)

| Workstream    | Tasks                                                                        | Outcome                                    |
| ------------- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| Policy        | SIGNAL-INF-010, extend P28 to OPA policies for terraform apply / WORM upload | Class A writes policy-gated                |
| Autonomous CI | Agent opens PR → validate-all → evidence bundle → human merge only           | One workflow E2E without human until merge |
| Safeguards    | Kill-switch per workflow in staging quarterly drill                          | Documented rollback                        |
| Legal         | EXT-INF-002 pen-test + EXT-INF-014 DPA                                       | Human Class S — parallel track             |

### Re-assessment checkpoint (end Phase 2)

- OPA denies unapproved Class A write in staging test
- One agent-driven PR merged with full validate-all + release evidence witness
- Escalation rate < 0.5% of agent runs (tracked 30d)
- Overall SIGNAL ≥ **L4 low**

---

## Critical path

```
SIGNAL-INF-001 (owner)
  → SIGNAL-INF-002/004 (monitoring)
    → SIGNAL-INF-007 (tracing)
      → SIGNAL-INF-009 (agent CI)
        → Phase 1 gate
          → SIGNAL-INF-010 (OPA)
            → L4
```

## Quick wins (< 1 week)

| Task                          | Effort   | Impact                          |
| ----------------------------- | -------- | ------------------------------- |
| SIGNAL-INF-001                | XS       | Unblocks Team dimension         |
| SIGNAL-INF-006                | XS       | Safeguards + Monitoring witness |
| SIGNAL-INF-003                | S        | Process hardening               |
| IR-3.4 gtcx-ctl validate --ci | **done** | Environment preflight in CI     |
| SIGNAL-INF-005                | S        | Injection red-team cadence      |

---

_Assessment witness: `01-docs/05-audit/signal-assessment-2026-06-07.md` · Framework v1.0 · Assessor: platform-architect agent_
