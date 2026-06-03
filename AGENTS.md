# AGENTS.md — GTCX Infrastructure

> **Applies to:** ALL AI agents operating on this codebase
> **Date:** 2026-05-25
> **Version:** 1.0
## 1.5 GTCX Institutional Baseline

This repo operates within the GTCX ecosystem. All agents must reference the canonical organizational baseline:

| Resource | Canonical Path | Document ID |
|----------|---------------|-------------|
| Baseline Overview | `gtcx-docs/docs/governance/institutional/README.md` | INST-001 |
| Baseline JSON | `gtcx-docs/docs/governance/institutional/gtcx-baseline.json` | INST-002 |
| Agent Startup Protocol | `gtcx-docs/docs/governance/institutional/agent-startup-protocol.md` | INST-003 |
| Personas | `gtcx-docs/docs/governance/institutional/personas/` | INST-P-001–007 |
| Lexicon | `gtcx-docs/docs/governance/institutional/lexicon/` | INST-L-001–003 |
| Frames | `gtcx-docs/docs/governance/institutional/frames/` | INST-F-001–004 |
| Deliverables | `gtcx-docs/docs/governance/institutional/deliverables/` | INST-D-001–006 |
| Conventions | `gtcx-docs/docs/governance/institutional/conventions/` | INST-C-001–003 |

**Registry:** See `gtcx-docs/docs/governance/REGISTRY.md` for the full document index.

## 1.6 Agent Startup Protocol (MANDATORY)

Before making any code changes, architectural decisions, or recommendations, complete this sequence:

### Phase 1: Load Baseline (30 sec)
1. Read this `AGENTS.md` file (stack, commands, constraints)
2. Read `.baseline/definition.json` (repo config, terminology, authority)
3. Read institutional baseline: `gtcx-docs/docs/governance/institutional/README.md` *(if accessible)*

### Phase 2: Establish Repo Context (1 min)
4. Read `.baseline/memory/session.md` — last session, incomplete work, next steps
5. Read `.baseline/memory/patterns.md` — confirmed architectural patterns
6. Read `.baseline/memory/pitfalls.md` — known issues, anti-patterns, blockers
7. Read `.baseline/memory/dependencies.md` — cross-repo dependencies

*If .baseline/memory/ files are missing or empty, create them with discovered content.*

### Phase 3: Discover Current State (30 sec)
8. Run `git status` — uncommitted changes, modified files
9. Run `git log --oneline -10` — recent work, current branch
10. Check `workstream/` or `.baseline/memory/session.md` for active tasks
11. Read `docs/audit/execution-roadmap.md` — **canonical execution plan** (3 sprints, 35 stories, all open findings). Anything `pending` or `in_progress` there is fair game; anything `done` does NOT need re-doing.
12. Read `docs/audit/latest.json` — machine-readable scores, gate state, open leadership decisions.

### Phase 4: Select Persona & Frame (30 sec)
11. Map task to persona: developer (default), trade-analyst, compliance-officer, field-inspector, protocol-engineer, platform-architect, product-strategist, security-engineer
12. Verify trust score ≥ persona threshold
13. Select frame: development (default), trading-floor, field-operations, regulatory-audit

### Phase 5.4: Compute Next Work (Protocol 22)
14. Run `pnpm agent:next-work` to compute the next story from the execution roadmap and work register.
15. If `backlogClear: true`, run witness (`node tools/scripts/validate-all.mjs`) and refresh evidence gates — do not idle.
16. If a story is returned, execute it. Never ask the operator which story to pick when the manifest and roadmap exist.

### Phase 5: Attest & Begin (30 sec)
17. Summarize context in 3–5 sentences
18. Add attestation block to commit/PR:
```markdown
## Agent Context Attestation
- [x] Phase 1: Baseline loaded
- [x] Phase 2: Repo context established
- [x] Phase 3: Current state discovered
- [x] Phase 4: Persona & frame selected
- [x] Phase 5: Context attested
```

### Context Refresh (every 2 hours or task switch)
- Re-read `.baseline/memory/session.md`
- Re-check `git status`
- Re-read `.baseline/memory/pitfalls.md`
- Update `session.md` if state changed

**Full protocol:** `gtcx-docs/docs/governance/institutional/agent-startup-protocol.md`

---

## 1.7 Agent Work Selection (Protocol 22)

This repo implements [Protocol 22 — Agent Work Selection](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/protocols/22-agent-work-selection/protocol.md).

**Non-negotiable:** Agents compute next work from the execution roadmap and work register. **Never ask the operator which story to pick.**

```bash
# Compute next work
pnpm agent:next-work

# Verify Protocol 22 adoption is complete
pnpm agent:work-selection:check
```

| Artifact | Path |
| -------- | ---- |
| Manifest (work register) | `docs/operations/agent-work-selection.md` |
| Execution roadmap | `docs/audit/execution-roadmap.md` |
| Selection script | `scripts/agent-next-work.mjs` |
| Adoption check | `scripts/check-agent-work-selection.mjs` |
| Session pointer | `docs/audit/auto-dev-state.md` |

**Implementation classes:**
- `code` — scripts, tests, gates, CI, Terraform, K8s manifests → **select in development frame**
- `ops-docs` — docs, manifests, roadmaps, runbooks → **select when no code remains**
- `evidence-capture` — manual UAT, live staging probes → **skip**
- `external` — human signatures, CISO decisions, vendor procurement → **skip, flag for handoff**

---

## 1. What This Is

GTCX Infrastructure is part of the GTCX ecosystem. This repository follows BaselineOS standards for agent interaction, code quality, and cross-repo alignment.

## 2. Stack & Commands

- Use conventional commits: `type(scope): subject`
- No emojis in commit messages unless explicitly requested
- Read docs before exploring

## 3. Agent Protocols

- **Read first:** Check existing docs and specs before making changes
- **Minimal changes:** Make the smallest change that achieves the goal
- **Test before commit:** Run relevant tests before considering work complete
- **Quality gates:** Run lint, typecheck, and tests before committing

## 4. Cross-Repo Alignment

This repo participates in the GTCX ecosystem alignment checks.
Run `pnpm ecosystem:alignment:check` (or equivalent) to verify standards.

## Coordination Contract

This repo participates in the GTCX ecosystem coordination system managed by `baseline-os`.

| Field | Value |
|-------|-------|
| Repo ID | `gtcx-infrastructure` |
| Tier | Tier 2 (Platform) |
| Human Lead | TBD — update this |
| Agent Roles | Builder, Reviewer |
| QA Gates | `typecheck`, `test`, `arch-check`, `spec-drift` |

### Reporting Work

Report work items to the coordination hub:

```bash
cd /path/to/baseline-os
pnpm ecosystem:repo:report-work --repo=gtcx-infrastructure --item="Description" --status=in-progress
```

Valid statuses: `pending`, `in-progress`, `blocked`, `completed`, `deferred`.

### Querying Blockers

Check `baseline-os/workstream/coordination/coordination-report-latest.md` for cross-repo blockers.

### Trust Requirements

- Builders: trust ≥ 70 (Permissioned)
- Reviewers: trust ≥ 80 (Authorized)
- Public API changes require human approval

---

*Coordination contract added: 2026-05-26*
\n## Credential Access\n\nThe credential vault is managed by **gtcx-agentic** (consumes `@baselineos/vault` from baseline-os).\n\nAgents access credentials via the MCP tool:\n\n```\nTool: baseline_vault\n  action: "list"     → show available credentials and trust requirements\n  action: "get"      → retrieve a value (requires: name, agentId)\n  action: "status"   → vault health check\n```\n\nThe vault is centrally located at `~/.baseline/vault` (SQLite, AES-256 encrypted).\nTrust-score gated. All access is audited.\n\nStandard env vars: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `BASELINE_MASTER_KEY`.\n\nNever commit secrets. Never ask users for credentials in chat.\nRead Protocol 19 (`gtcx-docs/docs/governance/protocols/19-agent-credential-access/protocol.md`) for the full standard.

<!-- AGENT-SYNC:START -->
<!-- AUTOGENERATED FROM .agent/*.md — DO NOT EDIT THIS SECTION.
     Edit the source partials and run `pnpm agent:sync`. -->

## Repository

`gtcx-infrastructure` — Infrastructure, compliance substrate, and governance platform for GTCX: an AI-native compliance engine powering African commodity trade (KYC, attestation, settlement, audit).

## Stack

- **Languages:** TypeScript, JavaScript (ESM), Bash, HCL (Terraform)
- **Frameworks:** Node.js 20+, Astro (docs-site), NATS JetStream, AWS SDK v3
- **Package manager:** pnpm (workspace monorepo, 13 packages)
- **Runtime:** Node.js 20+, Docker, Kubernetes (EKS on af-south-1)
- **Infrastructure:** AWS (af-south-1), Terraform, Helm, Linkerd service mesh, Kyverno policies

## Non-Negotiables

1. **Conventional commits** — `type(scope): subject`, lowercase, imperative.
2. **No emojis** unless explicitly requested.
3. **No going in circles** — read this file + the repo's own docs before exploring.

## Build & Run

```bash
# Install dependencies
pnpm install

# Run all validation gates (17 gates: coverage, static, security, build)
node tools/scripts/validate-all.mjs

# Run tests for a specific tool
node --test tools/<tool>/tests/**/*.test.mjs

# Regenerate agent-sync docs
pnpm agent:sync

# Docker build (example: audit-flush)
docker build -t audit-flush:latest tools/audit-flush/

# Terraform (staging)
cd infra/terraform/environments/staging && terraform plan -var-file=terraform.tfvars
```

## Audits (cross-repo)

To run any forensic audit on this repo (master-audit, full-audit, 10-10-roadmap, repo-overview, doc-cleanup, doc-standard, verification-audit, docs-machine-readable):

1. Read `../gtcx-agentic/audit/AGENT-START.md` — the canonical entry point lists every command, its prompt file, and the output path.
2. Read the specific command file (`../gtcx-agentic/audit/commands/<command>.md`).
3. Read the prompt file referenced there (`../gtcx-agentic/audit/prompts/<category>/<file>.md`).
4. Execute the prompt against this repo.
5. Write the output to the path the command specifies (typically `docs/audit/<command>-<YYYY-MM-DD>.md`).

The audit registry is provider-agnostic — the same prompts work for Claude, Codex, Gemini, Kimi, Deepseek, Grok, etc.

## Credentials: system-of-record + ownership split (cross-repo)

**Canonical policy:** `gtcx-docs/docs/governance/protocols/19-agent-credential-access/protocol.md` (see “System-of-Record and Operational Ownership Split”).

- **System-of-record (SoR)**: `gtcx-agentic` Baseline vault (shared provider creds + audited access)
- **Runtime usage owner**: product repo (e.g. `gtcx-intelligence`) owns its runtime secrets
- **CI/automation owner**: `gtcx-infrastructure` owns org automation secrets/policy
- **Contracts only**: `gtcx-protocols` defines env var names, redaction rules, and artifact paths/globs

**Credentialed evidence packs:** run either via vault injection on a dev laptop or in infra-owned CI; write redacted JSON evidence only (no raw secrets).

## Execute roadmap (any LLM, any repo)

Command: **`execute-roadmap`** (not `roadmap`).

1. Read `../gtcx-docs/tools/roadmap/roadmap-framework/AGENT-START.md`
2. Read `commands/execute-roadmap.md` and `prompts/roadmap/roadmap-reconcile-execute-prompt.md`
3. Update `docs/strategy/execution-roadmap.md` or `docs/audit/execution-roadmap.md`; execute until active phase done
4. Quick: `prompts/shareable/execute-roadmap-prompt-RUN.md`

Provider-agnostic — Claude, Codex, Gemini, Kimi, Cursor, etc.

## Cross-repo coordination (Protocol 24)

**Canonical policy:** [Protocol 24 — Cross-Repo Coordination](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/protocols/24-cross-repo-coordination/protocol.md)  
**Complements:** [Protocol 22 — Agent Work Selection](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/protocols/22-agent-work-selection/protocol.md) (what to work on next).

When a story is **blocked on a sibling repo** or you **hand off** cross-repo work, follow these five steps in order:

| Step                | Action                                                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Ack**          | Read open handoffs: `baseline-os/workstream/coordination/coordination-report-latest.md` (if present) and any `from-*` / `to-*` tickets naming this repo. Reply with `outbound-ack` template when you receive a durable inbound.                                                |
| **2. Roadmap**      | Record ticket IDs and blocker repo in `docs/audit/auto-dev-state.md`, `.baseline/memory/dependencies.md`, and/or `docs/audit/agent-work-pointer.md` (if used). Do not leave blockers chat-only.                                                                                |
| **3. Inbound doc**  | File a durable handoff: `docs/gtm/inbound-tickets/from-<this-repo>-<topic>-YYYY-MM-DD.md` or `docs/coordination/<initiative>-coordination.md` ([template](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/reference/templates/agents/3-structure/coordination.md)). |
| **4. Hub if P0**    | Ecosystem-critical path: from `baseline-os`, `pnpm ecosystem:repo:report-work --repo=<repo> --item="..." --status=blocked`. Use `gtcx-docs/docs/gtm/inbound-tickets/` only when the **docs hub** is the coordination witness (releases, standards).                            |
| **5. No duplicate** | Link [deployment-proof-index](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/audit/evidence/deployment-proof-index.md) and protocol contracts — **do not** copy harness YAML, evidence indexes, or normative protocol text into product repos.                |

**Not in this repo:** inbound archive SoR for ecosystem-wide weekly reports — that stays **`baseline-os`** (`workstream/coordination/`).

**Evidence paths (link only):** production smoke and EAP issuance artifacts live in owning repos per deployment-proof-index (e.g. `gtcx-intelligence/docs/audit/evidence/`).

## Claude-Specific Notes

- Session-start protocol from `~/.claude/CLAUDE.md` applies: read `DESIGN_BAR.md` and `AI_NATIVE_PATTERNS.md` before UI work.
- Reject conventional UI anti-patterns: AI sidebar, AI tab, "Run AI" buttons, blank forms, dashboard-as-report.
- No emojis, no preamble, no time estimates, lead with the answer.
<!-- AGENT-SYNC:END -->
