---
title: 'Agent Status Update — template (Protocol 26 §3b)'
status: current
date: 2026-06-05
owner: gtcx-agentic
role: protocol-architect
document_id: OPS-AGENT-STATUS-UPDATE
tier: standard
tags: ['agents', 'protocol-26', 'communication']
review_cycle: on-change
---

# Agent Status Update — template

Structured operator communication for **progress, handoffs, and end-of-turn** summaries. Complements the **Proceed Brief** (session start / resume).

| When                                              | Use                                                   |
| ------------------------------------------------- | ----------------------------------------------------- |
| Session start, new story, blocker cleared         | **Proceed Brief** (`agent-proceed-brief-template.md`) |
| After executing work, mid-session report, handoff | **Status Update** (this template)                     |

---

## Template

```markdown
## Status Update

### Done

- <what shipped or verified> — `<command>` exit <code> · commit `<sha>` · probe: <fact>
- <second item only if needed>

### Next priority

- **Owner:** <repo | role>
- **Action:** <one imperative the agent or owner will run next>
- **Because:** <story ID / hub row / witness path>

### Approval needed

- <Class A/S only: e.g. populate prod secret, legal sign-off, spend — or omit entire section>
```

---

## Section rules

### Done

- Past tense, evidence-linked (exit codes, SHAs, `kubectl` Ready/NotReady, check JSON paths).
- No vague "implemented ESO" without probe result.

### Next priority

- **Exactly one** primary action. Secondary work goes in **Done** as "parallel completed" or waits for the next turn.
- Agent **executes** Class R next steps in the same session when possible — do not replace with "I can …".

### Approval needed

- Include **only** when Protocol 28 class **A** or **S** blocks automation.
- Omit the heading when empty (do not write "None" or "N/A").
- Forbidden: story menus, repo pick lists, push delegation.

---

## Example (infra hub #17)

```markdown
## Status Update

### Done

- ESO SecretStore + 7 ExternalSecrets — `kubectl get externalsecret -n compliance-os-staging` all SecretSynced
- Terraform IRSA + SM shells — `terraform apply` 10 resources created (b0ca238)

### Next priority

- **Owner:** compliance-os
- **Action:** Patch `compliance-web` image to `staging-<sha>` in staging kustomize; re-run `pnpm w2:staging-prereq-check`
- **Because:** Hub #17 — prereq still `ImagePullBackOff` on tag `0.1.0` (NotFound)

### Approval needed

- GHCR PAT with `read:packages` if SM `ghcr-pull-token` must be rotated (Class A — operator secret)
```

---

## Anti-patterns

| Wrong                                                             | Right                                                                        |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| End with "I can push / help populate SM if you want"              | **Next priority** + run Class R steps; **Approval needed** only for PAT/prod |
| **"Want me to tackle anything on the P1 list?"** after push table | Run `agent:next-work`; **Next priority** = that story; start work            |
| Commit/push tables with no **Next priority**                      | Tables under **Done** only; always one owned **Next**                        |
| Three equal options under Next                                    | One **Next priority**; matrix lists other repos, not a menu                  |
| Done section empty when commands ran                              | List what ran with exit codes                                                |

**Owning work after hub delivery:** Done (commits) → `agent:next-work` in owner repo → Next priority (story ID) → implement Class R in-session.

---

_Normative: [Protocol 26 §3b](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/protocols/26-agent-proceed-confirmation/protocol.md) · Rollout: `pnpm ecosystem:rollout-universal`_
