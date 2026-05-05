# Critical Workflows

> The workflows that must function correctly for [Organization Name] to deliver its core value proposition. These are the acceptance criteria for "the product works."

---

## Definition

A critical workflow is one where:

- Failure blocks a user from completing a core job-to-be-done
- Degradation significantly impacts user trust or retention
- The workflow is in the critical path for revenue (signup, subscribe, publish)

---

## Workflow 1: [Workflow Name]

**Persona**: [Primary persona]
**Frequency**: [How often this is performed]
**Revenue impact**: [Direct / Indirect / None]

### Steps

| Step | Actor  | System   | Success Criteria       |
| ---- | ------ | -------- | ---------------------- |
| 1    | [User] | —        | [What the user does]   |
| 2    | —      | [System] | [What the system does] |
| 3    | [User] | —        | [What the user does]   |
| 4    | —      | [System] | [Outcome confirmed]    |

### Acceptance Criteria

- [ ] User can complete all steps without assistance
- [ ] Completion time < [N] seconds under normal conditions
- [ ] Error states are recoverable — no dead ends
- [ ] Works on [devices / browsers / connectivity profiles]
- [ ] [Additional criterion]

### Failure Modes

| Failure          | Impact           | Mitigation                   |
| ---------------- | ---------------- | ---------------------------- |
| [System failure] | [Impact on user] | [How it degrades gracefully] |
| [User error]     | [Impact]         | [How system helps recovery]  |

---

## Workflow 2: [Workflow Name]

**Persona**: [Primary persona]
**Frequency**: [Frequency]
**Revenue impact**: [Impact level]

### Steps

| Step | Actor  | System   | Success Criteria |
| ---- | ------ | -------- | ---------------- |
| 1    | [User] | —        | [Action]         |
| 2    | —      | [System] | [Action]         |
| 3    | [User] | —        | [Action]         |

### Acceptance Criteria

- [ ] [Criterion]
- [ ] [Criterion]
- [ ] [Criterion]

### Failure Modes

| Failure   | Impact   | Mitigation   |
| --------- | -------- | ------------ |
| [Failure] | [Impact] | [Mitigation] |

---

## Workflow 3: [Workflow Name]

**Persona**: [Primary persona]
**Frequency**: [Frequency]
**Revenue impact**: [Impact level]

### Steps

| Step | Actor  | System   | Success Criteria |
| ---- | ------ | -------- | ---------------- |
| 1    | [User] | —        | [Action]         |
| 2    | —      | [System] | [Action]         |

### Acceptance Criteria

- [ ] [Criterion]
- [ ] [Criterion]

---

## Workflow Quality Gates

Before any release, all critical workflows must be verified:

| Workflow     | Manual Test | Automated E2E | Accessibility | Last Verified |
| ------------ | ----------- | ------------- | ------------- | ------------- |
| [Workflow 1] | [ ]         | [ ]           | [ ]           | {YYYY-MM-DD}  |
| [Workflow 2] | [ ]         | [ ]           | [ ]           | {YYYY-MM-DD}  |
| [Workflow 3] | [ ]         | [ ]           | [ ]           | {YYYY-MM-DD}  |

---

## Performance Requirements per Workflow

| Workflow     | Max Completion Time | Network Condition  |
| ------------ | ------------------- | ------------------ |
| [Workflow 1] | [N] seconds         | Standard (4G/WiFi) |
| [Workflow 1] | [N] seconds         | Degraded (3G)      |
| [Workflow 2] | [N] seconds         | Standard           |

---

_Critical workflows are the product's non-negotiables. If any of these fail, the product has failed. Last reviewed: {YYYY-MM-DD}._
