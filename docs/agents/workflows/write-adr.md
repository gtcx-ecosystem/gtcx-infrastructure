---
title: 'Task Playbook: Write an ADR'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'frontend']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Task Playbook: Write an ADR

**Owner:** Lead engineer / DevOps engineer
**Safety tier:** Autonomous (propose) / Requires approval (accept)

---

## When to Run This

Run when:

- A new infrastructure decision must be made that affects environment topology, cloud provider selection, database separation, network security, or deployment strategy
- An existing ADR needs to be superseded due to changed requirements
- A technical choice lacks documented rationale and a PR review is blocked on it

Do not write an ADR for routine configuration changes. Write an ADR when the decision creates a structural constraint — something that would be costly to reverse or that future engineers need to understand to avoid breaking the system.

Security-sensitive ADRs (affecting secrets management, network policies, IAM, or the `gtcx_audit` database) require security review before proposing.

---

## Pre-Flight

```bash
# Review existing ADRs to understand context and avoid contradictions
ls docs/architecture/decisions/ | sort
```

Read:

- `docs/architecture/decisions/README.md` — current index and numbering
- `docs/architecture/decisions/adr-template.md` — mandatory template
- Any ADRs directly related to the decision area

---

## Steps

### 1. Assign ADR number

Check the current highest number in `docs/architecture/decisions/README.md`. Use the next available number: `NNN`.

---

### 2. Create the ADR file

File path: `docs/architecture/decisions/NNN-<kebab-case-title>.md`

Use `docs/architecture/decisions/adr-template.md` exactly. Fill every section:

| Section                 | Required content                                                 |
| ----------------------- | ---------------------------------------------------------------- |
| Status                  | `Proposed` — always start here                                   |
| Context                 | What is happening, what problem exists, what constraints apply   |
| Decision                | The specific choice made — precise and unambiguous               |
| Consequences            | What becomes easier, what becomes harder, what is now prohibited |
| Alternatives considered | At least two alternatives with reasons for rejection             |
| References              | Spec sections, prior ADRs, external standards                    |

**Infrastructure-specific context to include where relevant:**

- Which environments are affected (staging, production, or both)
- Whether the decision affects `gtcx_development` or `gtcx_audit` databases (or both)
- Whether the decision creates an approval-required change (IaC apply, migration, secret rotation)
- Security surface changes: IAM, network policy, secrets management

---

### 3. Update the ADR index

Add the new ADR to `docs/architecture/decisions/README.md`:

```markdown
| ADR-NNN (`NNN-title.md`) | Brief description | Proposed |
```

---

### 4. If the ADR supersedes an existing decision

Update the superseded ADR's status field:

```markdown
**Status**: Superseded by ADR-NNN (`NNN-title.md`)
```

Add the superseded ADR to the new ADR's References section.

---

### 5. Link from affected specs

If the ADR affects an infrastructure spec, add a reference to the relevant spec document.

---

### 6. Request human approval

ADRs in `Proposed` status are complete and reviewable. Do not change status to `Accepted`. Surface to the human reviewer with:

- The ADR file path
- A one-sentence summary of the decision
- The key trade-off that requires human judgment
- Whether security review is needed (secrets management, IAM, audit DB changes)

---

## Post-Flight

- [ ] `docs/architecture/decisions/README.md` is updated
- [ ] New ADR file is at the correct path (`NNN-<kebab-case-title>.md`)
- [ ] Status is `Proposed`
- [ ] If superseding: old ADR is marked superseded

---

## Hard Rules

- Never mark status `Accepted` — that is a human decision
- Never write an ADR for a decision already rejected by a prior ADR without explicitly superseding the prior ADR
- Security-sensitive ADRs (secrets, IAM, audit DB, network policy) require security review co-authorship

---

## Reference

- [`docs/architecture/decisions/`](../../architecture/decisions/) — ADR index and template
- [`docs/agents/workflows/safety-rules.md`](agent-safety-rules.md) — approval requirements
