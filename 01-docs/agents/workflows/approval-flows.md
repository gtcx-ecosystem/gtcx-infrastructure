---
title: 'Approval Flows'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['compliance', 'architecture', 'infrastructure', 'testing', 'api']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Approval Flows

---

## Overview

Approval flows define who can authorize publication of different content types. They balance speed (getting news out fast) with quality (ensuring accuracy) and risk management (protecting the organization).

---

## Approval Matrix

### By Content Type

| Content Type          | L1 Copy | L2 Fact | L3 Legal | L4 Final | Total Reviews |
| --------------------- | ------- | ------- | -------- | -------- | ------------- |
| **Breaking alert**    | ✅      | ○       | ○        | ✅       | 2             |
| **News digest**       | ✅      | ○       | ○        | ✅       | 2             |
| **Regulatory brief**  | ✅      | ✅      | ○        | ✅       | 3             |
| **Sector report**     | ✅      | ✅      | ✅       | ✅       | 4             |
| **Field dispatch**    | ✅      | ✅      | ○        | ✅       | 3             |
| **Policy brief**      | ✅      | ✅      | ✅       | ✅       | 4             |
| **Index publication** | ✅      | ✅      | ✅       | ✅       | 4             |

Legend: ✅ Required | ○ Optional/As needed

---

## Approval Levels

### L1: Copy Edit

**Purpose**: Style, clarity, grammar

**Approvers**:

- Any editor
- Senior contributors (for minor pieces)

**Criteria**:

- [ ] Follows style guide
- [ ] Clear and readable
- [ ] Proper formatting
- [ ] Links work
- [ ] Images appropriate

**Turnaround**: 15-30 minutes

### L2: Fact Check

**Purpose**: Accuracy, verification

**Approvers**:

- Fact-check editor
- Bureau Chief (for regional content)
- Senior analyst (for data)

**Criteria**:

- [ ] All claims sourced
- [ ] Sources verified
- [ ] Data accurate
- [ ] Quotes confirmed
- [ ] Context correct

**Turnaround**: 1-4 hours

### L3: Legal Review

**Purpose**: Risk, liability, compliance

**Approvers**:

- Legal counsel
- Editor-in-Chief (delegated authority)

**Criteria**:

- [ ] No defamation risk
- [ ] No confidentiality breach
- [ ] Regulatory compliance
- [ ] Source protection adequate
- [ ] Fair comment doctrine

**Triggers** (when required):

- Named criticism of individuals/companies
- Allegations of wrongdoing
- Unpublished government information
- Source confidentiality issues
- Potential market impact

**Turnaround**: 4-24 hours

### L4: Final Approval

**Purpose**: Publication authorization

**Approvers** (by content type):

| Content Type      | Final Approver  | Delegate        |
| ----------------- | --------------- | --------------- |
| Breaking alert    | Duty editor     | Bureau Chief    |
| News digest       | Duty editor     | —               |
| Regulatory brief  | Bureau Chief    | Senior editor   |
| Sector report     | Editor-in-Chief | Managing editor |
| Field dispatch    | Bureau Chief    | Senior editor   |
| Policy brief      | Editor-in-Chief | —               |
| Index publication | Editor-in-Chief | —               |

**Criteria**:

- [ ] All prior reviews complete
- [ ] Editorially sound
- [ ] Strategically aligned
- [ ] Timing appropriate
- [ ] Risk acceptable

---

## Escalation Paths

### Standard Escalation

```
Writer → Editor → Bureau Chief → Managing Editor → Editor-in-Chief
```

### Emergency Escalation (Breaking News)

```
Writer → Duty Editor → Editor-in-Chief (direct)
```

### Legal Escalation

```
Any level → Legal counsel → Editor-in-Chief + CEO (if high-risk)
```

---

## Special Approval Requirements

### Market-Moving Information

Content that could affect market prices or company valuations:

| Requirement  | Standard                                    |
| ------------ | ------------------------------------------- |
| Timing       | Coordinate with markets (avoid mid-trading) |
| Verification | Minimum 2 independent sources               |
| Review       | L2 + L3 required                            |
| Approval     | Editor-in-Chief only                        |

### Government Relations

Content involving government criticism or leaked information:

| Requirement       | Standard                   |
| ----------------- | -------------------------- |
| Source protection | Legal review required      |
| Right of reply    | Government response sought |
| Review            | L3 required                |
| Approval          | Editor-in-Chief only       |

### Index Publications

[Index Name], or other index releases:

| Requirement       | Standard                    |
| ----------------- | --------------------------- |
| Data verification | Data team sign-off          |
| Methodology check | Chief analyst review        |
| Embargo           | 24-hour stakeholder preview |
| Approval          | Editor-in-Chief only        |

### Corrections

Errors in published content:

| Severity                  | Approval        | Action                        |
| ------------------------- | --------------- | ----------------------------- |
| Minor (typo, formatting)  | Duty editor     | Silent fix                    |
| Material (factual error)  | Managing editor | Correction notice             |
| Significant (major error) | Editor-in-Chief | Full correction + explanation |

---

## After-Hours Protocol

### Coverage Hours

| Period                  | Coverage       | Final Approver |
| ----------------------- | -------------- | -------------- |
| Weekday 08:00-20:00 UTC | Full editorial | As per matrix  |
| Weekday 20:00-08:00 UTC | Duty editor    | Duty editor    |
| Weekend                 | Duty editor    | Duty editor    |
| Holiday                 | On-call editor | On-call editor |

### Breaking News After Hours

1. **Assess urgency** — Can it wait until morning?
2. **If urgent** — Contact duty editor via WhatsApp
3. **If very urgent** — Duty editor can escalate to EIC
4. **Document** — Log all after-hours decisions

### Duty Editor Authority

After-hours duty editors can approve:

- Breaking alerts
- News digests
- Urgent regulatory briefs

Duty editors must escalate:

- Market-moving content
- Government-sensitive content
- Legal-risk content

---

## Approval Workflow in System

### Status Flow

```
DRAFT → SUBMITTED → IN_REVIEW → [REVISION] → APPROVED → SCHEDULED → PUBLISHED
                         ↓
                      KILLED
```

### Approval Actions

| Action     | Effect                    | Who Can             |
| ---------- | ------------------------- | ------------------- |
| `APPROVE`  | Moves to next stage       | Designated approver |
| `REVISE`   | Returns to author         | Any reviewer        |
| `ESCALATE` | Moves to higher authority | Any reviewer        |
| `KILL`     | Stops publication         | Editor+             |
| `HOLD`     | Pauses workflow           | Editor+             |

### Audit Trail

Every approval action logged:

```json
{
  "story_id": "[PROJ-2026-001]",
  "action": "APPROVE",
  "level": "L2_FACT_CHECK",
  "approver": "[approver@organization-url]",
  "timestamp": "2026-01-27T14:32:00Z",
  "notes": "All sources verified, data confirmed with [Source Organization]"
}
```

---

## Override Authority

### Editor-in-Chief

Can override any approval requirement with documented justification:

- Public interest urgency
- Competitive necessity
- Source protection

### CEO

Can override any editorial decision:

- Existential risk to organization
- Legal requirement
- Board directive

_Note: CEO override of editorial decisions is logged and reported to board._

---

## References

- [Story Lifecycle](./story-lifecycle.md)
- [Editorial Independence](../governance/editorial-independence.md)
