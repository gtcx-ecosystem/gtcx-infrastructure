---
title: 'QA Test Plan — {Feature / Sprint / Release}'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'informational'
tags: ['security', 'infrastructure', 'testing', 'frontend', 'devops']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# QA Test Plan — {Feature / Sprint / Release}

**QA Lead:** {name}
**Test team:** {members}
**Version:** {version}
**Date:** {YYYY-MM-DD}

---

## Test Objectives

### Goals

- {goal 1}
- {goal 2}

### Success criteria

- {criterion 1}
- {criterion 2}

---

## Test Scope

### In scope

- {feature or component}
- {feature or component}

### Out of scope

- {item and reason}

---

## Test Strategy

**Methodology:** {Agile / Sprint-based / Risk-based}
**Test levels:** Unit | Integration | System | Acceptance
**Test types:** Functional | Performance | Security | Accessibility | Regression

### Risk-based focus

| Risk level | Testing focus       | Effort        |
| ---------- | ------------------- | ------------- |
| High       | {high-risk areas}   | {% of effort} |
| Medium     | {medium-risk areas} | {% of effort} |
| Low        | {low-risk areas}    | {% of effort} |

---

## Test Environments

| Environment | Purpose   | URL   | Access               |
| ----------- | --------- | ----- | -------------------- |
| Development | {purpose} | {url} | {credentials/method} |
| Staging     | {purpose} | {url} | {credentials/method} |

**Test data:** {sources, privacy handling, refresh cadence}

---

## Test Coverage Matrix

| Feature     | Unit | Integration | System | UAT |
| ----------- | ---- | ----------- | ------ | --- |
| {feature 1} | {%}  | {%}         | {%}    | {%} |
| {feature 2} | {%}  | {%}         | {%}    | {%} |

---

## Test Schedule

| Phase          | Duration   | Deliverables              |
| -------------- | ---------- | ------------------------- |
| Test planning  | {duration} | Test plan (this document) |
| Test design    | {duration} | Test cases                |
| Test execution | {duration} | Execution results         |
| Test closure   | {duration} | Summary report            |

---

## Test Case Template

```
Test Case ID: TC-{NNN}
Name: {descriptive name}
Feature: {feature under test}
Priority: High / Medium / Low
Type: Functional / Performance / Security / Accessibility

Preconditions:
- {condition}

Steps:
1. {step}
2. {step}
3. {step}

Expected result:
- {expected outcome}

Test data: {required data}
Environment: {environment}
```

---

## Defect Management

### Defect lifecycle

New → Assigned → In Progress → Fixed → Verified → Closed

### Severity levels

| Severity | Definition                              |
| -------- | --------------------------------------- |
| Critical | System unusable; no workaround          |
| High     | Major feature broken; workaround exists |
| Medium   | Feature degraded; workaround acceptable |
| Low      | Minor issue; cosmetic or edge case      |

### Defect report template

```
Defect ID: DEF-{NNN}
Title: {clear, concise title}
Severity: Critical / High / Medium / Low
Environment: {where found}
Browser / device: {details}

Description: {what is broken}

Steps to reproduce:
1. {step}
2. {step}

Expected: {what should happen}
Actual: {what actually happens}

Screenshots: {attach}
```

---

## Test Metrics

| Metric                | Target                |
| --------------------- | --------------------- |
| Tests executed        | {n} / {total planned} |
| Pass rate             | ≥ {n}%                |
| Critical defects open | 0 at exit             |
| Test coverage         | ≥ {n}%                |

---

## Exit Criteria

- [ ] All planned test cases executed
- [ ] All critical and high defects resolved
- [ ] Test coverage targets met
- [ ] Performance benchmarks met
- [ ] Go/No-Go decision documented

**Go criteria:** {criteria for proceeding to production}
**No-Go criteria:** {criteria for blocking release}

---

## Deliverables

- [ ] Test plan (this document)
- [ ] Test cases
- [ ] Execution results
- [ ] Defect reports
- [ ] Test summary report

---

## Testing Risks

| Risk   | Probability         | Impact              | Mitigation   |
| ------ | ------------------- | ------------------- | ------------ |
| {risk} | High / Medium / Low | High / Medium / Low | {mitigation} |
