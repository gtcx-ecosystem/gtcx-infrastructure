# Feature Backlog — {Project Name}

A structured breakdown of epics, features, and user stories with prioritization and estimation guidance.

---

## Epic Structure

Each epic follows this format:

```
## Epic [N]: [Epic Name]
Priority: P0 | P1 | P2 | P3
Estimated Effort: {timeframe}
Success Criteria: {measurable outcomes}

### Feature [N.N]: [Feature Name]
Story Points: {points}

#### User Stories:
[PREFIX]-US-[N]: As a {user type}, I want {goal} so that {benefit}
- Acceptance Criteria:
  - {criterion 1}
  - {criterion 2}
- Definition of Done: {completion criteria}
```

---

## Epic Priority Matrix

| Epic     | Priority | Effort      | Business Value      | Risk                | Dependencies   |
| -------- | -------- | ----------- | ------------------- | ------------------- | -------------- |
| {Epic 1} | P0–P3    | {timeframe} | High / Medium / Low | High / Medium / Low | {dependencies} |
| {Epic 2} | P0–P3    | {timeframe} | High / Medium / Low | High / Medium / Low | {dependencies} |
| {Epic 3} | P0–P3    | {timeframe} | High / Medium / Low | High / Medium / Low | {dependencies} |

---

## Story Point Distribution

| Epic      | Total Points | Features | Stories | Avg Points/Story |
| --------- | ------------ | -------- | ------- | ---------------- |
| {Epic 1}  | {points}     | {n}      | {n}     | {avg}            |
| {Epic 2}  | {points}     | {n}      | {n}     | {avg}            |
| **Total** | {total}      | {total}  | {total} | {overall avg}    |

---

## Epic Success Metrics

| Epic     | Primary Metric | Target   | Secondary Metric | Target   |
| -------- | -------------- | -------- | ---------------- | -------- |
| {Epic 1} | {metric}       | {target} | {metric}         | {target} |
| {Epic 2} | {metric}       | {target} | {metric}         | {target} |

---

## Story Point Estimation Guide

| Points | Effort       | Description                                |
| ------ | ------------ | ------------------------------------------ |
| 1      | Very small   | Simple change, a few hours                 |
| 2      | Small        | Simple feature, 1–2 days                   |
| 3      | Small–Medium | Standard feature, 3–5 days                 |
| 5      | Medium       | Moderate feature, ~1 week                  |
| 8      | Medium–Large | Complex feature, 1–2 weeks                 |
| 13     | Large        | Major component, 2–3 weeks                 |
| 21     | Extra Large  | Large system component, 3–4 weeks          |
| 34     | Huge         | Major epic, 1+ months — consider splitting |

**Sizing rule:** Features over 21 points should be broken down. Epics should target 4–12 weeks of effort.

---

## User Story Quality Checklist (INVEST)

- [ ] **Independent** — can be developed without being blocked by another story
- [ ] **Negotiable** — details can be discussed and refined
- [ ] **Valuable** — delivers clear user or business benefit
- [ ] **Estimable** — team can size it in story points
- [ ] **Small** — completable within a single sprint
- [ ] **Testable** — has specific, verifiable acceptance criteria

---

## Completion Checklist

- [ ] All epics defined with scope, priority, and success criteria
- [ ] Features broken down from epics (max 21 points each)
- [ ] User stories written in standard format with acceptance criteria
- [ ] Story points estimated for all stories
- [ ] Priority matrix complete
- [ ] Epic-level success metrics defined
- [ ] Dependencies identified across epics
