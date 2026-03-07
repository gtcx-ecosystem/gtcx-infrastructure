# PRD — [Feature / Product Name]

**Owner**: [Product Manager]
**Status**: Draft | In Review | Approved | Shipped
**Last Updated**: {date}
**Target Release**: {version or quarter}

---

## One-Line Summary

[One sentence: what this is, who it's for, and what problem it solves.]

---

## Problem

### User Problem

[What is the user trying to do? What is failing or missing? Describe the experience from the user's perspective, not the solution.]

### Business Problem

[Why does this matter to the business? What metric does it move? What risk does it reduce?]

### Evidence

[Attach or link supporting evidence: user research, support tickets, analytics, competitive signals.]

---

## Goals

| Goal             | Metric        | Target         | Measurement Method |
| ---------------- | ------------- | -------------- | ------------------ |
| [Primary goal]   | [Metric name] | [Target value] | [How measured]     |
| [Secondary goal] | [Metric name] | [Target value] | [How measured]     |

### Non-Goals

Explicitly out of scope for this release:

- [Thing we are deliberately not doing]
- [Thing we are deferring to a later release]

---

## Market Context

**Target market**: [TAM description and size estimate]

**Key competitors**:
| Competitor | Strengths | Weaknesses | Our differentiation |
|------------|-----------|------------|---------------------|
| [Competitor 1] | [strengths] | [weaknesses] | [how we differ] |
| [Competitor 2] | [strengths] | [weaknesses] | [how we differ] |

**Market trends**: [Relevant trends driving demand for this]

---

## Users

### Primary Persona

**[Persona Name]** — [1-sentence description]

- **Context**: [Where they are when they use this]
- **Goal**: [What they are trying to accomplish]
- **Pain**: [What currently fails them]

### Secondary Persona (if applicable)

**[Persona Name]** — [1-sentence description]

---

## Requirements

### Must Have (P0 — blocks release)

- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

### Should Have (P1 — strong preference)

- [ ] [Requirement 1]
- [ ] [Requirement 2]

### Nice to Have (P2 — if time allows)

- [ ] [Requirement 1]

---

## User Stories

### [Story Group Name]

**As a** [persona], **I want to** [action], **so that** [benefit].

**Acceptance Criteria:**

- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]

---

## Design

**Figma / design file**: [Link]

**Key screens**: [Brief description or embedded images]

**Edge cases and empty states**: [How does this behave when there's no data, an error, or an unexpected input?]

---

## Technical Considerations

**Dependencies**: [What other systems, APIs, or teams does this depend on?]

**Data requirements**: [What data does this read/write? Any new schema changes?]

**Performance requirements**: [Latency targets, throughput requirements]

**Security / privacy**: [Any PII handling, authentication requirements, or security review triggers?]

**Feature flag**: [ ] Required — flag name: `{flag-name}`

---

## Rollout Plan

| Phase                | Audience      | Duration | Success Signal    |
| -------------------- | ------------- | -------- | ----------------- |
| Internal             | Team only     | {n} days | No P0 bugs        |
| Canary               | {n}% of users | {n} days | Error rate < {n}% |
| General availability | All users     | —        | —                 |

**Rollback trigger**: [What condition triggers an immediate rollback?]

---

## Success Metrics

Measured {n} days after GA:

| Metric             | Baseline        | Target         | Owner  |
| ------------------ | --------------- | -------------- | ------ |
| [Primary metric]   | [Current value] | [Target value] | [Name] |
| [Secondary metric] | [Current value] | [Target value] | [Name] |

---

## Open Questions

| Question   | Owner  | Due    | Resolution |
| ---------- | ------ | ------ | ---------- |
| [Question] | [Name] | {date} |            |

---

## Stakeholder Sign-Off

| Role               | Name | Date | Status                     |
| ------------------ | ---- | ---- | -------------------------- |
| Product Manager    |      |      | [ ] Approved               |
| Engineering Lead   |      |      | [ ] Approved               |
| Design Lead        |      |      | [ ] Approved               |
| Legal / Compliance |      |      | [ ] Approved (if required) |
