# AGENTS.md — GTCX Infrastructure

> **Applies to:** ALL AI agents operating on this codebase
> **Date:** 2026-05-25
> **Version:** 1.0
## 1.5 GTCX Institutional Baseline

This repo operates within the GTCX ecosystem. All agents must reference the canonical organizational baseline:

| Resource | Canonical Path | Document ID |
|----------|---------------|-------------|
| Baseline Overview | `gtcx-docs/01-docs/governance/institutional/README.md` | INST-001 |
| Baseline JSON | `gtcx-docs/01-docs/governance/institutional/gtcx-baseline.json` | INST-002 |
| Agent Startup Protocol | `gtcx-docs/01-docs/governance/institutional/agent-startup-protocol.md` | INST-003 |
| Personas | `gtcx-docs/01-docs/governance/institutional/personas/` | INST-P-001–007 |
| Lexicon | `gtcx-docs/01-docs/governance/institutional/lexicon/` | INST-L-001–003 |
| Frames | `gtcx-docs/01-docs/governance/institutional/frames/` | INST-F-001–004 |
| Deliverables | `gtcx-docs/01-docs/governance/institutional/deliverables/` | INST-D-001–006 |
| Conventions | `gtcx-docs/01-docs/governance/institutional/conventions/` | INST-C-001–003 |

**Registry:** See `gtcx-docs/01-docs/governance/REGISTRY.md` for the full document index.

### 1.5.1 Ecosystem cloud placement (OPS-CLOUD-PLACE-001)

All infrastructure work defaults to **AWS** (`af-south-1`). GCP is used only for the intelligence ML bridge (`04-ship/terraform/modules/gcp-ml-bridge/`), disabled until Phase 3.

| Doc | ID | Purpose |
|-----|-----|---------|
| Normative matrix | OPS-CLOUD-PLACE-001 | [`compliance-os/01-docs/04-ops/cloud-placement-gtcx-ecosystem-2026-06-05.md`](../../../compliance-os/01-docs/04-ops/cloud-placement-gtcx-ecosystem-2026-06-05.md) |
| Per-repo register | OPS-CLOUD-PLACE-002 | [`compliance-os/01-docs/04-ops/cloud-placement/repo-register-2026-06-05.md`](../../../compliance-os/01-docs/04-ops/cloud-placement/repo-register-2026-06-05.md) |
| Infra annex | — | [`01-docs/04-ops/coordination/cloud-placement-aws-control-plane-2026-06-05.md`](./01-docs/04-ops/coordination/cloud-placement-aws-control-plane-2026-06-05.md) |

## 1.6 Agent Startup Protocol (MANDATORY)

Before making any code changes, architectural decisions, or recommendations, complete this sequence:

### Phase 1: Load Baseline (30 sec)
1. Read this `AGENTS.md` file (stack, commands, constraints)
2. Read `.baseline/definition.json` (repo config, terminology, authority)
3. Read institutional baseline: `gtcx-docs/01-docs/governance/institutional/README.md` *(if accessible)*

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
11. Read `01-docs/05-audit/execution-roadmap.md` — **canonical execution plan** (3 sprints, 35 stories, all open findings). Anything `pending` or `in_progress` there is fair game; anything `done` does NOT need re-doing.
12. Read `01-docs/05-audit/latest.json` — machine-readable scores, gate state, open leadership decisions.

### Phase 4: Select Persona & Frame (30 sec)
11. Map task to persona: developer (default), trade-analyst, compliance-officer, field-inspector, protocol-engineer, platform-architect, product-strategist, security-engineer
12. Verify trust score ≥ persona threshold
13. Select frame: development (default), trading-floor, field-operations, regulatory-audit

### Phase 5.4: Compute Next Work (Protocol 22)
14. Run `pnpm agent:next-work` to compute the next story from the execution roadmap and work register.
15. If `backlogClear: true`, run witness (`node 03-platform/tools/03-platform/scripts/validate-all.mjs`) and refresh evidence gates — do not idle.
16. If a story is returned, execute it. Never ask the operator which story to pick when the manifest and roadmap exist.

### Phase 5.6: Proceed Brief (Protocol 26)
17. Before substantive work, state **what will happen next and why**.
18. Use the Proceed Brief format. The human confirms, corrects, or stops — they do not choose among options.

```markdown
## Proceed Brief

**Next:** <one recommended action>
**Because:** <evidence-linked rationale>
**Blocked until:** <none | specific inbound / artifact>
**Override:** Reply **stop**, **correct:**, or name a story ID.
```

**Forbidden:** "What would you like me to do next?", "Do you want A or B?", "Should I commit, push, or wait?"

**When blocked:** File a Blocker Report (what is missing, where, who owns it) — do not disguise uncertainty as a multiple-choice question.

### Phase 5.7: Execute Verification Ladder (Protocol 27)
17. **Run** repo quality gates in-session. The human is not a remote shell.
18. Before marking work "done", execute every applicable step in order. Skip only when the repo manifest documents the step as N/A.

| Step | Command | Required when |
|------|---------|---------------|
| V1 | `git status`, `git diff --stat` | Always |
| V2 | `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | Documented in `package.json` |
| V3 | `pnpm test` (quick) or `pnpm test:full` | Tests exist for changed behavior |
| V4 | `node 03-platform/tools/03-platform/scripts/validate-all.mjs` | Story touches deploy, evidence, or cross-repo probe |
| V5 | `pnpm run validate:hub-scope`, `pnpm run validate:hub-workplan` | Changes in `gtcx-docs` coordination |
| V6 | Sibling-repo command in **owner checkout** | Cross-repo `XR-*` implementation (Protocol 24) |

**Forbidden closing patterns:** "Verify locally," "run this in your terminal," "you should run `pnpm test`."

**Permission Unblock Report:** When execution is blocked (sandbox, missing creds, MCP deny), emit a structured report with concrete enablement steps, then re-run the command after unblocking. Do not end with instructions to the user.

```markdown
## Permission Unblock Report
**Blocked command:** `<exact command>`
**Exit / error:** `<stderr or tool message — no secrets>`
**Why blocked:** `<sandbox | network | aws | k8s | gh | file write | other>`
**Impact:** `<what cannot be verified or shipped until unblocked>`
### Enable (operator — one-time)
1. `<concrete step>`
### After enable
Agent will re-run `<command>` in this session.
```

### Phase 5.8: Authority Classification (Protocol 28)
19. Tag every primary action with its authority class in the Proceed Brief:

| Class | Meaning | Examples |
|-------|---------|----------|
| **S** — Sovereign human | Human decides; agent stops | Legal ratification, founder **stop**, user says **do not commit** |
| **A** — Agent custody | Prior authorization exists; agent executes + evidence | `terraform apply` after XR-401-C, `gh issue comment`, SPKI export |
| **R** — Routine autonomous | No per-step authorization; agent runs | `lint`, `test`, `build`, `agent:next-work` |

**Do not** list "ceremony" or "terraform apply" as Class S by default — they are Class A when preceremony artifacts exist.

### Phase 5: Attest & Begin (30 sec)
20. Summarize context in 3–5 sentences
21. Add attestation block to commit/PR:
```markdown
## Agent Context Attestation
- [x] Phase 1: Baseline loaded
- [x] Phase 2: Repo context established
- [x] Phase 3: Current state discovered
- [x] Phase 4: Persona & frame selected
- [x] Phase 5.6: Proceed Brief delivered (Protocol 26) — recommendation-first, no menus
- [x] Phase 5.7: Verification ladder executed (Protocol 27) — commands listed in commit/PR body
- [x] Phase 5.8: Authority class tagged (Protocol 28) — S/A/R classification stated
- [x] Phase 5: Context attested
```

### Context Refresh (every 2 hours or task switch)
- Re-read `.baseline/memory/session.md`
- Re-check `git status`
- Re-read `.baseline/memory/pitfalls.md`
- Update `session.md` if state changed

**Full protocol:** `gtcx-docs/01-docs/governance/institutional/agent-startup-protocol.md`

---

## 1.7 Agent Work Selection (Protocol 22)

This repo implements [Protocol 22 — Agent Work Selection](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/01-docs/governance/protocols/22-agent-work-selection/protocol.md).

**Non-negotiable:** Agents compute next work from the execution roadmap and work register. **Never ask the operator which story to pick.**

```bash
# Compute next work
pnpm agent:next-work

# Verify Protocol 22 adoption is complete
pnpm agent:work-selection:check
```

| Artifact | Path |
| -------- | ---- |
| Manifest (work register) | `01-docs/04-ops/agent-work-selection.md` |
| Execution roadmap | `01-docs/05-audit/execution-roadmap.md` |
| Selection script | `03-platform/scripts/agent-next-work.mjs` |
| Adoption check | `03-platform/scripts/check-agent-work-selection.mjs` |
| Session pointer | `01-docs/05-audit/auto-dev-state.md` |

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
| Human Lead | @amanianai |
| AI Reliability (ecosystem) | [gtcx-protocols ai-reliability-owner-2026-06-06](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/ai-reliability-owner-2026-06-06.md) |
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
\n## Credential Access\n\nThe credential vault is managed by **gtcx-agentic** (consumes `@baselineos/vault` from baseline-os).\n\nAgents access credentials via the MCP tool:\n\n```\nTool: baseline_vault\n  action: "list"     → show available credentials and trust requirements\n  action: "get"      → retrieve a value (requires: name, agentId)\n  action: "status"   → vault health check\n```\n\nThe vault is centrally located at `~/.baseline/vault` (SQLite, AES-256 encrypted).\nTrust-score gated. All access is audited.\n\nStandard env vars: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `BASELINE_MASTER_KEY`.\n\nNever commit secrets. Never ask users for credentials in chat.\nRead Protocol 19 (`gtcx-docs/01-docs/governance/protocols/19-agent-credential-access/protocol.md`) for the full standard.

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
node 03-platform/tools/03-platform/scripts/validate-all.mjs

# Run tests for a specific tool
node --test 03-platform/tools/<tool>/tests/**/*.test.mjs

# Regenerate agent-sync docs
pnpm agent:sync

# Docker build (example: audit-flush)
docker build -t audit-flush:latest 03-platform/tools/audit-flush/

# Terraform (staging)
cd 04-ship/terraform/environments/staging && terraform plan -var-file=terraform.tfvars
```

## Audits (cross-repo)

To run any forensic audit on this repo (master-audit, full-audit, 10-10-roadmap, repo-overview, doc-cleanup, doc-standard, verification-audit, docs-machine-readable):

1. Read `../gtcx-agentic/audit/AGENT-START.md` — the canonical entry point lists every command, its prompt file, and the output path.
2. Read the specific command file (`../gtcx-agentic/audit/commands/<command>.md`).
3. Read the prompt file referenced there (`../gtcx-agentic/audit/prompts/<category>/<file>.md`).
4. Execute the prompt against this repo.
5. Write the output to the path the command specifies (typically `01-docs/05-audit/<command>-<YYYY-MM-DD>.md`).

The audit registry is provider-agnostic — the same prompts work for Claude, Codex, Gemini, Kimi, Deepseek, Grok, etc.

## Credentials: system-of-record + ownership split (cross-repo)

**Canonical policy:** `gtcx-docs/01-docs/governance/protocols/19-agent-credential-access/protocol.md` (see “System-of-Record and Operational Ownership Split”).

- **System-of-record (SoR)**: `gtcx-agentic` Baseline vault (shared provider creds + audited access)
- **Runtime usage owner**: product repo (e.g. `gtcx-intelligence`) owns its runtime secrets
- **CI/automation owner**: `gtcx-infrastructure` owns org automation secrets/policy
- **Contracts only**: `gtcx-protocols` defines env var names, redaction rules, and artifact paths/globs

**Credentialed evidence packs:** run either via vault injection on a dev laptop or in infra-owned CI; write redacted JSON evidence only (no raw secrets).

## LLM routing + token usage (BaselineOS SoR)

| Concern                       | Owner          | Operator entry                                                |
| ----------------------------- | -------------- | ------------------------------------------------------------- |
| Route decisions + pricing     | `baseline-os`  | `baseline cost-route --prompt "..." --json`                   |
| Token usage aggregate         | `baseline-os`  | `baseline cost-stats --json`                                  |
| Agent vault (populate/verify) | `gtcx-agentic` | `pnpm agent:vault:verify`                                     |
| Staging vs production keys    | `gtcx-agentic` | `01-docs/operators/vault-environments.md`                        |
| Ecosystem coordination        | `baseline-os`  | `workstream/coordination/ECOSYSTEM-COST-ROUTER-2026-06-03.md` |

**Do not** use `baseline-os/04-ship/docker/.env.staging` for production vault work.

## Execute roadmap (any LLM, any repo)

Command: **`execute-roadmap`** (not `roadmap`).

1. Read `../gtcx-docs/03-platform/tools/roadmap/roadmap-framework/AGENT-START.md`
2. Read `commands/execute-roadmap.md` and `prompts/roadmap/roadmap-reconcile-execute-prompt.md`
3. Update `01-docs/strategy/execution-roadmap.md` or `01-docs/05-audit/execution-roadmap.md`; execute until active phase done
4. Quick: `prompts/shareable/execute-roadmap-prompt-RUN.md`

Provider-agnostic — Claude, Codex, Gemini, Kimi, Cursor, etc.

## Cross-repo coordination (Protocol 24)

**Canonical policy:** [Protocol 24 — Cross-Repo Coordination](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/01-docs/governance/protocols/24-cross-repo-coordination/protocol.md)  
**Complements:** [Protocol 22 — Agent Work Selection](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/01-docs/governance/protocols/22-agent-work-selection/protocol.md) (what to work on next).

When a story is **blocked on a sibling repo** or you **hand off** cross-repo work, follow these five steps in order:

| Step                | Action                                                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Ack**          | Read open handoffs: `baseline-os/workstream/coordination/coordination-report-latest.md` (if present) and any `from-*` / `to-*` tickets naming this repo. Reply with `outbound-ack` template when you receive a durable inbound.                                                |
| **2. Roadmap**      | Record ticket IDs and blocker repo in `01-docs/05-audit/auto-dev-state.md`, `.baseline/memory/dependencies.md`, and/or `01-docs/05-audit/agent-work-pointer.md` (if used). Do not leave blockers chat-only.                                                                                |
| **3. Inbound doc**  | File a durable handoff: `01-docs/08-gtm/inbound-tickets/from-<this-repo>-<topic>-YYYY-MM-DD.md` or `01-docs/06-coordination/<initiative>-coordination.md` ([template](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/01-docs/reference/templates/agents/3-structure/coordination.md)). |
| **4. Hub if P0**    | Ecosystem-critical path: from `baseline-os`, `pnpm ecosystem:repo:report-work --repo=<repo> --item="..." --status=blocked`. Use `gtcx-docs/01-docs/08-gtm/inbound-tickets/` only when the **docs hub** is the coordination witness (releases, standards).                            |
| **5. No duplicate** | Link [deployment-proof-index](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/05-audit/evidence/deployment-proof-index.md) and protocol contracts — **do not** copy harness YAML, evidence indexes, or normative protocol text into product repos.                |

**Not in this repo:** inbound archive SoR for ecosystem-wide weekly reports — that stays **`baseline-os`** (`workstream/coordination/`).

**Evidence paths (link only):** production smoke and EAP issuance artifacts live in owning repos per deployment-proof-index (e.g. `gtcx-intelligence/01-docs/05-audit/evidence/`).

## Claude-Specific Notes

- Session-start protocol from `~/.claude/CLAUDE.md` applies: read `DESIGN_BAR.md` and `AI_NATIVE_PATTERNS.md` before UI work.
- Reject conventional UI anti-patterns: AI sidebar, AI tab, "Run AI" buttons, blank forms, dashboard-as-report.
- No emojis, no preamble, no time estimates, lead with the answer.

## Universal agent behavior (ANY LLM — terminal, IDE, CLI)

**Applies to:** Claude, Kimi, Gemini, Codex, Cursor (IDE + `agent` CLI), Copilot, and any future agent with shell access.

**Canonical docs (read every session):**

1. `01-docs/04-ops/agent-universal-instructions.md`
2. `01-docs/04-ops/human-gate-navigation.md` — Class **S** + **`blocksIR: false`** gates are **parallel**, not repo frozen

**Full chain:** `baseline start` (INST-003 + repo session + gates). Repo-only: `pnpm agent:start`.

### Session start (one command)

```bash
baseline start
# or: pnpm agent:start   # P22 bootstrap only — not full INST-003 chain
```

Optional: `pnpm agent:start --json` · legacy alias `pnpm agent:session-start` (same as `agent:start`).

### P22 — Work selection

- Run next-work; **never** ask "which story?" or present numbered menus.
- Execute the returned story in **this repo** unless P24 handoff says switch owner repo.

### P26 — Proceed Brief (then implement)

Emit **one** brief, then work. Human may **stop**, **correct:**, or story ID — not pick options.

**Forbidden replies:** Your call · Two options · 1./2. menus · Say push if you want · **Say if you want** · **committed next or** · **left as local WIP** · Which do you prefer? · **I can…** · **Want me to tackle…** · **anything on the P1 list?** · approval of path already selected (Class R).

**After push/status tables:** run `agent:next-work` → **Status Update** → **Next priority** = that story → implement (do not offer a repo pick list).

**Uncommitted Class R files:** commit in-session (micro-commit) — never ask operator to choose commit vs WIP.

**Required close:** **Status Update** only — message **stops** after Approval needed. **One** Next priority (from `agent:next-work`); never "Want me to proceed with A or B?". Execute Class R Next in-session.

**Status Update (end of turn):** `### Done` · `### Next priority` (one owner + action) · `### Approval needed` (Class A/S only — omit if empty). Template: `01-docs/04-ops/agent-status-update-template.md`.

### P27 — You run commands

- Gates, dev servers (Metro/Expo background), `adb`, `git push` — in-session.
- Report **command + exit code**.
- Harness blocks bare `git push`? **D3:** `pnpm --dir ../gtcx-agentic ecosystem:git-push --repo <name>` · **D5:** `pnpm --dir ../gtcx-agentic ecosystem:push-all`.
- Blocked after diagnosis D1–D6? **Permission Unblock Report** — not "run locally."

### P28 — Authority

| Class | Behavior                                       |
| ----- | ---------------------------------------------- |
| **R** | Self-execute docs, tests, commits, normal push |
| **A** | Run after artifact (XR, inbound ticket)        |
| **S** | Stop; Blocker Report only                      |

### Hub specs

- P22 `gtcx-docs/01-docs/governance/protocols/22-agent-work-selection/protocol.md`
- P26 `gtcx-docs/01-docs/governance/protocols/26-agent-proceed-confirmation/protocol.md`
- P27 `gtcx-docs/01-docs/governance/protocols/27-agent-execution-obligation/protocol.md`

## Session start (all terminals / LLMs)

```bash
pnpm session
# or: baseline session
pnpm session --json
```

**Lookup:** `session` → `next` → `gates` → `hub` — see `01-docs/04-ops/agent-command-lookup.md`

Prints P22 next-work + P26 Proceed Brief skeleton. Not IDE-specific.

## Protocol 26 — Proceed Brief (no menus)

After P22: **one Proceed Brief → implement**. Template: `01-docs/04-ops/agent-proceed-brief-template.md` (when present).

**Forbidden:** Your call · Two options · Say push if you want · path-approval ask for Class R work.

## Protocol 27 — execution obligation

**You run commands.** Dev servers, gates, `adb`, push — not operator checklists.

**Diagnosis before human:** Shell → background → node spawn → owner repo → `ecosystem:push-all` → Unblock Report.

**Forbidden:** verify locally · focus your terminal · run these commands · let me know when you've run.

## Status Update (progress / handoff / end of turn)

Use **after work in the turn** or when reporting cluster/repo state — not instead of Proceed Brief at session start.

```markdown
## Status Update

### Done

- <outcome> — <evidence: command exit N, commit SHA, probe result>

### Next priority

- **Owner:** <repo or role>
- **Action:** <single imperative>
- **Because:** <1 line — P22 ID, blocker, witness>

### Approval needed

- <only Class A or S gates — secret, prod, legal, force-push; omit section if none>
```

**Rules:** One next priority (not a menu). **Approval needed** only for real gates — never "I can push / I can help / if you want." Class **R**: execute, then show Done + Next.

Template: `01-docs/04-ops/agent-status-update-template.md` · Spec: P26 §3b (gtcx-docs).

## Persona selection (Phase 4 — mandatory)

**Bridge:** [ecosystem-persona-bridge-2026-06.md](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/ecosystem-persona-bridge-2026-06.md)  
**Registry:** [gtcx-docs institutional personas](https://github.com/gtcx-ecosystem/gtcx-docs/tree/main/01-docs/governance/institutional/personas)

| Step | Action                                                                                        |
| ---- | --------------------------------------------------------------------------------------------- |
| 1    | Run `pnpm agent:next-work` — use JSON `persona.institutional` + `persona.docUrl` when present |
| 2    | **Read** the persona `.md` file (not only the ID)                                             |
| 3    | State **Active persona** + **Frame** in every Proceed Brief (Protocol 26)                     |
| 4    | On **task switch**, re-select persona and read the new doc                                    |

**MCP personas** (`builder`, `security`, …) apply when using BaselineOS MCP tools; **institutional** names apply in chat, commits, and hub docs.

**Forbidden:** defaulting to generic coder voice for security, compliance, or coordination tasks.

## Ecosystem agent learning card (normative — read every session)

**Canonical SoR:** [ecosystem-agent-learning-card-2026-06.md](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/ecosystem-agent-learning-card-2026-06.md) (gtcx-protocols).

### Read order

| Step | Link                                                                                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | [Unblock playbook F1–F10](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/ecosystem-unblock-playbook-2026-06.md)                                 |
| 2    | [P26 Status Update + post-pilot gating](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/agent-status-update-and-post-pilot-gating-2026-06-06.md) |
| 3    | [Human-external register](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/04-ops/coordination/human-external-blocker-register-2026-06.md)                              |
| 4    | [Cross-repo bridge — Latest updates](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/cross-repo-agent-bridge.md)                                 |
| 5    | This repo `01-docs/04-ops/agent-work-selection.md` · `01-docs/05-audit/auto-dev-state.md`                                                                                                     |

**End of turn:** one P26 Status Update (not a menu) → append [cross-repo-agent-log](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/cross-repo-agent-log.md) if state changed.

### Rules (all repos)

- **`backlogClear`** on a sibling (e.g. gtcx-protocols) does **not** stop IR in **this** repo.
- **Class S** (H-03, DTF-5.5.4 LOI, pen-test SOW, …) → **Approval needed** only — never execute from wrong repo.
- **Class R** (tests, manifests, capture scripts) → run in-session; never list under Approval needed.
- **Never** execute H-03 countersign or XR-518 `--confirm` unless owner repo + Class A artifact says so.
<!-- AGENT-SYNC:END -->

## Agent folder & workspace (P29)

| Resource | Path |
| -------- | ---- |
| Terminal index | [`agents/README.md`](./agents/README.md) |
| Universal protocols | [`agents/universal/README.md`](./agents/universal/README.md) |
| Workspace SoR | [`workspace/`](./workspace/) |

```bash
pnpm workspace:check
pnpm pm:sync
```

Spec: [P29 Agent Workspace Domains](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/01-docs/governance/protocols/29-agent-workspace-domains/protocol.md)

<!-- gtcx-workspace-p29 -->
