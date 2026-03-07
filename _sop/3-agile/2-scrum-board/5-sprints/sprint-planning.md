# [Product Name] — Sprint Planning and User Stories

> **Document ID:** [SPRINT-001]
> **Version:** [1.0]
> **Date:** [YYYY-MM-DD]
> **Status:** [Planning / Active / Complete]

---

## Team Configuration

| Role              | Count | Names / Handles        |
| ----------------- | ----- | ---------------------- |
| Engineering Lead  | [X]   | [Name or "Unassigned"] |
| Backend Engineer  | [X]   | [Name or "Unassigned"] |
| Frontend Engineer | [X]   | [Name or "Unassigned"] |
| DevOps / SRE      | [X]   | [Name or "Unassigned"] |
| QA Engineer       | [X]   | [Name or "Unassigned"] |
| Product Manager   | [X]   | [Name or "Unassigned"] |

### Capacity Model

- Sprint duration: [X] weeks ([X] working days)
- Productive hours per day: [X] (accounting for meetings, code review, admin)
- Team capacity: [X] engineers × [X] days × [X] hours = [X] hours
- Target velocity: [X]–[X] story points per sprint
- Point scale: Fibonacci (1, 2, 3, 5, 8, 13, 21)

---

## Definition of Ready (DoR)

A story is ready for sprint commitment when:

- User story follows "As a [persona], I want [action], so that [outcome]" format
- Acceptance criteria are specific, measurable, and testable
- Technical approach has been discussed and agreed by the engineering lead
- Dependencies have been identified and are either resolved or have mitigation plans
- API contracts (request / response schemas) are defined for any new endpoints
- Test data requirements are documented
- Security requirements are identified (authentication, authorization, data handling)
- Story has been estimated by at least two engineers

---

## Definition of Done (DoD)

A story is done when:

- All acceptance criteria are met and verified
- Code has been reviewed and approved by at least one other engineer
- Unit tests written with >[X]% line coverage for new code
- Integration tests passing for all new endpoints
- Linting and type checks pass with zero errors
- API documentation updated (OpenAPI spec or equivalent)
- Database migrations tested (up and rollback)
- Performance meets stated SLA (latency, throughput)
- Security review passed (no secrets in code, proper auth checks)
- Deployed to staging environment and smoke-tested
- Product owner has accepted the implementation

### Sprint is Done When:

- All committed stories meet DoD
- Sprint goal achieved
- Demo conducted for stakeholders
- Retrospective held and action items documented
- Metrics updated (velocity, quality, incidents)
- Next sprint backlog refined

---

## Sprint 1: [Sprint Name] (Weeks 1–2)

**Sprint Goal:** [One sentence — what is delivered and why it matters.]

**Committed Stories:** [X] story points

---

### [STORY-001]: [Story Name]

**Priority:** [P0 / P1 / P2] | **Points:** [X] | **Assignee:** [Team / Name]

#### User Story

**As a** [persona]
**I want** [action]
**So that** [outcome]

#### Acceptance Criteria

- [Criterion 1]
- [Criterion 2]
- [Criterion 3]
- [Criterion 4]

#### Technical Notes

[Optional: architecture notes, interface definitions, or implementation guidance. Remove if not needed.]

#### Dependencies

- [Dependency 1]
- [Dependency 2]

#### Test Scenarios

1. [Test scenario 1]
2. [Test scenario 2]
3. [Test scenario 3]

---

### [STORY-002]: [Story Name]

**Priority:** [P0 / P1 / P2] | **Points:** [X] | **Assignee:** [Team / Name]

#### User Story

**As a** [persona]
**I want** [action]
**So that** [outcome]

#### Acceptance Criteria

- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

#### Dependencies

- [Dependency 1]

#### Test Scenarios

1. [Test scenario 1]
2. [Test scenario 2]

---

## Sprint 2: [Sprint Name] (Weeks 3–4)

**Sprint Goal:** [One sentence.]

**Committed Stories:** [X] story points

---

### [STORY-003]: [Story Name]

**Priority:** [P0 / P1 / P2] | **Points:** [X] | **Assignee:** [Team / Name]

#### User Story

**As a** [persona]
**I want** [action]
**So that** [outcome]

#### Acceptance Criteria

- [Criterion 1]
- [Criterion 2]

#### Dependencies

- [Dependency 1]

#### Test Scenarios

1. [Test scenario 1]
2. [Test scenario 2]

---

## Sprint Backlog (Future Sprints)

### Sprint [N]: [Sprint Name] (Weeks [X]–[X])

| ID          | Story               | Priority       | Points |
| ----------- | ------------------- | -------------- | ------ |
| [STORY-00X] | [Story description] | [P0 / P1 / P2] | [X]    |
| [STORY-00X] | [Story description] | [P0 / P1 / P2] | [X]    |
| [STORY-00X] | [Story description] | [P0 / P1 / P2] | [X]    |

### Sprint [N+1]: [Sprint Name] (Weeks [X]–[X])

| ID          | Story               | Priority       | Points |
| ----------- | ------------------- | -------------- | ------ |
| [STORY-00X] | [Story description] | [P0 / P1 / P2] | [X]    |
| [STORY-00X] | [Story description] | [P0 / P1 / P2] | [X]    |

---

## Velocity Tracking

| Sprint   | Planned (pts) | Completed (pts) | Velocity | Notes         |
| -------- | ------------- | --------------- | -------- | ------------- |
| Sprint 1 | [X]           | —               | —        | [Sprint name] |
| Sprint 2 | [X]           | —               | —        | [Sprint name] |
| Sprint 3 | [X]           | —               | —        | [Sprint name] |

---

## Risk Register

| Risk     | Impact              | Probability         | Mitigation   | Owner   |
| -------- | ------------------- | ------------------- | ------------ | ------- |
| [Risk 1] | High / Medium / Low | High / Medium / Low | [Mitigation] | [Owner] |
| [Risk 2] | High / Medium / Low | High / Medium / Low | [Mitigation] | [Owner] |
| [Risk 3] | High / Medium / Low | High / Medium / Low | [Mitigation] | [Owner] |

---

## Sprint Ceremonies

| Ceremony             | Schedule          | Duration   | Participants                |
| -------------------- | ----------------- | ---------- | --------------------------- |
| Sprint Planning      | Monday, Week 1    | 2 hours    | Full team                   |
| Daily Standup        | Daily, [time]     | 15 minutes | Full team                   |
| Backlog Refinement   | Wednesday, Week 1 | 1 hour     | PM + Eng Lead + 2 engineers |
| Sprint Review        | Friday, Week 2    | 1 hour     | Full team + stakeholders    |
| Sprint Retrospective | Friday, Week 2    | 45 minutes | Full team                   |

### Daily Standup Template

```
Date: [Date]
Attendees: [Team members]

Yesterday:
- [Completed work]

Today:
- [Planned work]

Blockers:
- [Impediments requiring resolution]

Metrics:
- Stories completed: X/Y
- Points completed: X/Y
- On track: Yes / No
```

---

## Backlog Refinement Checklist

- [ ] Review story details and acceptance criteria
- [ ] Clarify technical approach with engineering lead
- [ ] Identify dependencies and confirm availability
- [ ] Confirm API contracts (request / response schemas)
- [ ] Identify security requirements
- [ ] Estimate story points (at least two engineers)
- [ ] Prioritize against sprint goal

---

## Sprint Retrospective Template

### What Went Well

- _(Fill at sprint end)_

### What Could Be Improved

- _(Fill at sprint end)_

### Action Items

- _(Fill at sprint end)_

---

**Sprint Status:** [Planning / Active / Complete]
**Next Sprint Planning:** [Date]
**Product Owner:** [Name]
**Scrum Master:** [Name]
