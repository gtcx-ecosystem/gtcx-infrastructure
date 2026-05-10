# Definition of Ready

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

Criteria that must be met before a user story can enter a sprint. Stories that do not meet these criteria should be refined first.

---

## Core Criteria

### 1. Story structure and clarity

- [ ] Written in standard format: "As a {user type}, I want {functionality}, so that {benefit}"
- [ ] Unique ID assigned
- [ ] Clear, concise title
- [ ] Epic assignment confirmed
- [ ] Priority level set (P0, P1, P2, or P3)
- [ ] Story points estimated (Fibonacci: 1, 2, 3, 5, 8, 13, 21)

### 2. Acceptance criteria

- [ ] At least 3–5 specific, testable criteria defined
- [ ] Success can be objectively measured
- [ ] Business value is clearly identified
- [ ] Edge cases and error scenarios considered

### 3. Technical requirements

- [ ] Fits within existing architecture
- [ ] API endpoints and data models identified (if applicable)
- [ ] Database changes identified (if applicable)
- [ ] Performance requirements defined (if applicable)
- [ ] Dependencies on other systems identified

### 4. Design and UX requirements

- [ ] Wireframes or mockups available (if UI work)
- [ ] Compliant with design system
- [ ] User flow documented
- [ ] Error states and empty states defined

### 5. Testing requirements

- [ ] Testing approach defined (unit, integration, E2E, manual)
- [ ] High-level test scenarios identified
- [ ] Test data requirements specified
- [ ] Automation scope agreed

### 6. Dependencies and constraints

- [ ] Internal dependencies identified and resolved (or mitigation planned)
- [ ] External dependencies identified
- [ ] Blocking issues documented with resolution plan
- [ ] Risk assessment complete

### 7. Documentation requirements

- [ ] Documentation scope agreed (API docs, user docs, release notes)
- [ ] No open questions blocking development start

---

## Validation Process

Before sprint planning, each candidate story should be reviewed by:

| Reviewer      | Validates                                         |
| ------------- | ------------------------------------------------- |
| Product owner | Business requirements, acceptance criteria, value |
| Tech lead     | Technical feasibility, architecture alignment     |
| QA lead       | Testability, test requirements                    |
| Design lead   | UX requirements, design completeness              |

---

## DoR Checklist (Per Story)

```
Story ID: {US-XXX}
Story title: {title}
Review date: {YYYY-MM-DD}
Reviewer: {name}

Criteria status:
- [ ] Story structure and clarity
- [ ] Acceptance criteria
- [ ] Technical requirements
- [ ] Design and UX requirements
- [ ] Testing requirements
- [ ] Dependencies and constraints
- [ ] Documentation requirements

Overall status: Ready / Not Ready
Blocking issues: {list}
Next review date: {date}
```

---

## Exceptions

When DoR cannot be met before a sprint:

1. **Research required** — create a spike story (timebox: max {n} days) and schedule the main story for the following sprint
2. **Dependency unresolved** — document the blocker, assign an owner, reschedule to the sprint when the dependency is resolved
3. **Resource unavailable** — reschedule; do not pull in a story without the skills to complete it

---

## Success Targets

- > 90% of sprint-committed stories meet DoR at planning time
- Reduces mid-sprint scope changes
- Reduces sprint carryover from unclear requirements
