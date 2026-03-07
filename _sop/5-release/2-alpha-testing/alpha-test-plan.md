# Alpha Test Plan — [Product / Feature Name]

**Version**: {version}
**Alpha Start**: {date}
**Alpha End**: {date}
**Owner**: {product-owner}

---

## Objectives

1. Validate core user flows work end-to-end under real usage conditions
2. Identify critical bugs before beta rollout
3. Confirm performance targets are met under simulated load
4. Gather structured feedback from alpha participants

---

## Scope

### In scope

- [Feature / workflow A]
- [Feature / workflow B]
- [Feature / workflow C]

### Out of scope

- [Feature deferred to beta]
- [Edge case / platform not covered in alpha]

---

## Alpha Cohort

| Segment                         | Count | Selection Criteria |
| ------------------------------- | ----- | ------------------ |
| [Internal team / beta partners] | {n}   | [How selected]     |
| [External testers]              | {n}   | [How selected]     |

**Onboarding**: [How participants access the alpha — invite link, build, environment URL]

---

## Test Scenarios

### Critical Path Tests

| ID    | Scenario      | Steps               | Expected Result    | Pass Criteria          |
| ----- | ------------- | ------------------- | ------------------ | ---------------------- |
| CP-01 | [Core action] | 1. [Step] 2. [Step] | [Expected outcome] | [Measurable criterion] |
| CP-02 | [Core action] | 1. [Step] 2. [Step] | [Expected outcome] | [Measurable criterion] |
| CP-03 | [Core action] | 1. [Step] 2. [Step] | [Expected outcome] | [Measurable criterion] |

### Edge Case Tests

| ID    | Scenario    | Condition              | Expected Behavior            |
| ----- | ----------- | ---------------------- | ---------------------------- |
| EC-01 | [Edge case] | [Triggering condition] | [Expected graceful handling] |
| EC-02 | [Edge case] | [Triggering condition] | [Expected graceful handling] |

---

## Acceptance Criteria

All of the following must be met before alpha → beta promotion:

- [ ] CP-01 through CP-{n}: 100% pass rate
- [ ] No P0 (crash / data loss) bugs open
- [ ] P95 latency < {target}ms on critical paths
- [ ] {n} alpha participants have completed the core flow
- [ ] NPS or structured feedback collected from ≥ {n} participants
- [ ] Security review completed with no critical findings

---

## Feedback Collection

**Method**: [In-app widget / survey / structured interview / Slack channel]

**Feedback form**: [Link or template]

**Review cadence**: [Daily standup / weekly review]

---

## Bug Triage

| Severity | Definition                               | SLA                        |
| -------- | ---------------------------------------- | -------------------------- |
| P0       | Crash, data loss, security vulnerability | Fix before alpha continues |
| P1       | Core flow broken, no workaround          | Fix within {n} days        |
| P2       | Significant UX issue, workaround exists  | Fix before beta            |
| P3       | Minor issue                              | Backlog                    |

**Bug tracker**: [Link to issue board / label convention]

---

## Sign-Off

| Role             | Name | Date | Status       |
| ---------------- | ---- | ---- | ------------ |
| Product Owner    |      |      | [ ] Approved |
| Engineering Lead |      |      | [ ] Approved |
| QA Lead          |      |      | [ ] Approved |

---

_Alpha complete when all acceptance criteria are met and sign-offs obtained._
