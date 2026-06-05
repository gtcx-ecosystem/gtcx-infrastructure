---
title: 'Guide: Identifying Roles That Should Be Added'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['compliance', 'infrastructure', 'frontend', 'governance', 'ux']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Guide: Identifying Roles That Should Be Added

How to systematically audit an organization's role coverage and identify gaps that need new role definitions.

---

## When to Run This Process

Run this guide when:

- Starting a new project and establishing initial team structure
- The organization is scaling and coordination is breaking down
- Work is falling through the cracks with no clear owner
- A significant new function or workflow is being introduced
- An existing role definition feels overloaded

---

## Step 1: Inventory Existing Role Definitions

Read every file in `2-roles/`. For each role, extract:

| Field                     | What to capture                                                    |
| ------------------------- | ------------------------------------------------------------------ |
| Role name                 | The exact name as defined                                          |
| Core responsibilities     | What this role owns                                                |
| Review/approval authority | What this role signs off on                                        |
| Escalation path           | Who this role reports to or escalates to                           |
| Interfaces                | What other roles this role regularly hands off to or receives from |

Build a responsibility map: `responsibility → role`. Every claimed responsibility should have exactly one owning role.

---

## Step 2: Read All Workflow and Process Documents

Scan these document types for role references:

- `4-workflows/` — approval flows, lifecycles, handoffs
- `5-governance/` — policy documents, decision authorities
- `1-onboarding/` — who new members are told to contact for what
- Any process diagrams or flowcharts

For each step in a workflow, ask: **who is responsible for this step?** Note the answer — whether it is a named role, a vague reference ("the team", "someone"), or nothing at all.

---

## Step 3: Detect Gaps

Apply the following gap signals to your responsibility map:

### Signal 1: Unclaimed Responsibility

A workflow step, approval, or domain area has no role assigned to it.

**How to find it:** Look for workflow steps where the actor is:

- "the team"
- "someone"
- A person's name (not a role)
- Left blank

**What it means:** A role needs to be defined that owns this responsibility.

---

### Signal 2: Role Overload

One role is doing two or more unrelated categories of work.

**How to find it:** List all responsibilities under a single role. Group them by domain or type. If you find two or more clearly distinct clusters, the role is doing too much.

**What it means:** Split into two roles, or define a subordinate/specialist role for one of the clusters.

---

### Signal 3: Undefined Approver

An approval or review step exists in a workflow but the approver role is not defined in `1-roles/`.

**How to find it:** In `4-workflows/approval-flows.md`, extract every approval step. Cross-reference each approver against the role inventory from Step 1. Flag any that do not match a defined role.

**What it means:** Define the approver role, or clarify that an existing role owns this approval authority.

---

### Signal 4: Undefined Escalation Target

A role escalates to a title or function that does not exist in the role inventory.

**How to find it:** In each role definition, find the "reports to" or escalation path. Check whether the target is a defined role.

**What it means:** Either define the missing role, or update the escalation path to point to an existing role.

---

### Signal 5: Coverage Domain With No Lead

A significant subject area, region, or function has no role accountable for its coverage or quality.

**How to find it:** List every domain the organization covers. Check whether each domain has at least one role with explicit ownership. Look for domains mentioned in content or strategy documents but absent from role definitions.

**What it means:** Define a lead or coordinator role for the uncovered domain.

---

### Signal 6: Onboarding Confusion

New members are unsure who to contact for a type of question or request.

**How to find it:** Read `onboarding/` documents. Flag any step that says "ask the team" or "check with someone" instead of naming a specific role.

**What it means:** The role responsible for answering that question is either undefined or not communicated in onboarding.

---

## Step 4: Prioritize Gaps

Score each gap against these criteria:

| Criterion     | High                                            | Medium                         | Low                           |
| ------------- | ----------------------------------------------- | ------------------------------ | ----------------------------- |
| **Frequency** | This gap affects multiple workflows             | This gap affects one workflow  | This gap is theoretical       |
| **Impact**    | Missing owner causes quality failures or delays | Missing owner causes confusion | Missing owner is inconvenient |
| **Urgency**   | Needed before next major milestone              | Needed within current quarter  | Can wait                      |

Assign each gap a priority: **P1** (define immediately), **P2** (plan for next quarter), **P3** (log for future consideration).

---

## Step 5: Write Role Recommendations

For each P1 and P2 gap, write a brief role recommendation:

```markdown
## Recommended Role: [Role Name]

**Gap type:** [Signal 1-6 from above]
**Priority:** [P1 / P2 / P3]

**Problem statement:**
One or two sentences describing what is falling through the cracks without this role.

**Proposed responsibilities:**

- Responsibility 1
- Responsibility 2
- Responsibility 3

**Interfaces:**

- Receives work from: [Role A]
- Hands off to: [Role B]
- Reports to / escalates to: [Role C]

**Suggested first file:** `1-roles/[role-name].md`
```

Collect all recommendations in a single output document: `role-gap-report-[YYYY-MM].md`.

---

## Step 6: Validate Before Creating

Before writing a new role definition, confirm:

- [ ] This is a distinct set of responsibilities — not just one task
- [ ] The responsibilities require specific skills or authority that justify separation
- [ ] There is enough ongoing work to warrant a standing role
- [ ] Creating this role removes ambiguity rather than adding a new layer
- [ ] The role has a clear interface with at least one other defined role

If any of these fail, reconsider. The gap may be better addressed by updating an existing role definition rather than creating a new one.

---

## Output: Role Gap Report

Deliver a file named `role-gap-report-[YYYY-MM].md` containing:

1. **Summary table** — all gaps found, their signal type, and priority
2. **Role recommendations** — one block per P1/P2 gap, using the format in Step 5
3. **P3 backlog** — a brief list of low-priority gaps to revisit later
4. **Recommended file changes** — list of files to create or update to resolve gaps

---

## Quality Checklist

Before submitting the role gap report:

- [ ] Every workflow step in `4-workflows/` has an assigned role
- [ ] Every approval in `4-workflows/approval-flows.md` maps to a defined role
- [ ] Every escalation path in `1-roles/` points to a defined role
- [ ] Every domain in the organization's coverage area has at least one owning role
- [ ] No role definition claims responsibilities from two clearly unrelated domains
- [ ] Onboarding documents name specific roles, not vague references
- [ ] Each recommended role passed the validation checklist in Step 6

---

## References

- [contributors.md](./contributors.md) — contributor role template
- [03-platform/examples/bureau-chiefs.md](bureau-chiefs.md) — regional lead role example
- [03-platform/examples/editor-in-chief.md](editor-in-chief.md) — senior editorial role example
- [4-workflows/approval-flows.md](../workflows/approval-flows.md) — approval authority reference
- [5-governance/](../governance/editorial-independence.md) — governance and decision authority policies
