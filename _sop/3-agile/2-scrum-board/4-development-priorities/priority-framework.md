# Priority Framework

Classification system for work items, bugs, features, and improvements.

---

## Priority Levels

| Priority | Level    | Response time | Business impact                       |
| -------- | -------- | ------------- | ------------------------------------- |
| **P0**   | Critical | 0–4 hours     | Business operations blocked           |
| **P1**   | High     | 4–24 hours    | Significant user or business impact   |
| **P2**   | Medium   | 1–7 days      | Moderate impact, workaround available |
| **P3**   | Low      | 1–4 weeks     | Minimal impact, nice-to-have          |

---

## P0 — Critical

**Definition:** Blocks business operations or poses immediate security / compliance risk. Requires around-the-clock attention until resolved.

**Characteristics:**

- System down or inaccessible
- Critical security vulnerability or active breach
- Data loss or corruption
- Payment processing failure
- Compliance violation

**Response:**

- Escalate immediately to team lead → project manager → stakeholders
- All-hands until resolved or stable
- Post-mortem required after resolution
- Customer communication if user-facing

---

## P1 — High

**Definition:** Major feature broken or significantly degraded. Significant user impact; workaround may exist.

**Characteristics:**

- Major feature non-functional
- Critical workflow blocked
- Integration failure
- Authentication problems
- Severe performance degradation

**Response:**

- Begin work within 4 hours
- Escalate to team lead if not resolved within 24 hours
- Daily stakeholder updates
- Document resolution and lessons learned

---

## P2 — Medium

**Definition:** Moderate impact on operations or user experience. Can be scheduled into normal sprint cycle.

**Characteristics:**

- Minor feature issues
- Non-critical bugs
- Performance optimizations
- UI/UX improvements
- Documentation updates

**Response:**

- Schedule within current or next sprint
- Escalate if not addressed within 1 week
- Weekly stakeholder updates

---

## P3 — Low

**Definition:** Minimal business or user impact. Can be addressed when capacity allows.

**Characteristics:**

- Minor cosmetic issues
- Code quality improvements
- Nice-to-have features
- Technical debt cleanup
- Edge case improvements

**Response:**

- Address when capacity allows
- No escalation required
- Monthly review

---

## Priority Assignment

### Impact vs. Urgency Matrix

| Impact \ Urgency | Low | Medium | High | Critical |
| ---------------- | --- | ------ | ---- | -------- |
| **Low**          | P3  | P3     | P2   | P1       |
| **Medium**       | P3  | P2     | P2   | P1       |
| **High**         | P2  | P2     | P1   | P0       |
| **Critical**     | P1  | P1     | P0   | P0       |

### Business Value vs. Effort Matrix

| Business Value \ Effort | Low | Medium | High | Very High |
| ----------------------- | --- | ------ | ---- | --------- |
| **Low**                 | P3  | P3     | P3   | P3        |
| **Medium**              | P2  | P2     | P2   | P3        |
| **High**                | P1  | P1     | P2   | P2        |
| **Critical**            | P0  | P0     | P1   | P1        |

---

## Priority in Sprint Context

| Priority | Sprint planning             | Backlog position | Capacity allocation |
| -------- | --------------------------- | ---------------- | ------------------- |
| P0       | Must be in current sprint   | Top of backlog   | 100% if needed      |
| P1       | High priority for inclusion | Top after P0     | 50–80%              |
| P2       | Normal sprint candidate     | Middle           | 20–50%              |
| P3       | Include if capacity allows  | Bottom           | 0–20%               |

---

## Communication by Priority

| Priority | Team                   | Stakeholders                  | Customers      |
| -------- | ---------------------- | ----------------------------- | -------------- |
| P0       | Immediate notification | Hourly updates until resolved | If user-facing |
| P1       | Daily standup focus    | Daily updates                 | If user-facing |
| P2       | Sprint planning        | Weekly updates                | Not required   |
| P3       | Backlog grooming       | Monthly                       | Not required   |

---

## Priority Assignment Template

```
Issue: {title}
Reported by: {name}
Date: {YYYY-MM-DD}

Assessment:
- Business impact: Low / Medium / High / Critical
- User impact: Low / Medium / High / Critical
- Urgency: Low / Medium / High / Critical
- Effort: Low / Medium / High / Very High

Priority: P0 / P1 / P2 / P3
Rationale: {reason for assignment}
Expected resolution: {timeframe}
Escalation trigger: {when to escalate}

Stakeholder notification:
[ ] Immediate  [ ] Daily  [ ] Weekly  [ ] Monthly
```

---

## Review Cadence

- **P0/P1:** Review daily until resolved
- **P2:** Review weekly in backlog grooming
- **P3:** Review monthly
- **Priority changes:** Document reason for any re-prioritization

---

## Common Mistakes

- Marking everything P0 or P1 (priority inflation) — be honest about actual impact
- Setting priority and never reviewing it
- Skipping escalation when items miss their resolution window
- Assigning priority without understanding the full context
