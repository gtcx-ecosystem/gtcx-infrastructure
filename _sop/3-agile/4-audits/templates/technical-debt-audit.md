# Technical Debt Audit — {repo-name}

## Audit Info

| Field        | Value          |
| ------------ | -------------- |
| Date         | {audit-date}   |
| Auditor      | {auditor-name} |
| Repo         | {repo-url}     |
| Branch       | {branch}       |
| Commit       | {commit-sha}   |
| Language(s)  | {languages}    |
| Framework(s) | {frameworks}   |

## Executive Summary

**Overall Debt Level: {Low/Medium/High/Critical}**

| Metric                                    |       Value        |
| ----------------------------------------- | :----------------: |
| Total debt items                          |      {count}       |
| Critical items                            |  {critical-count}  |
| Estimated remediation effort              | {days} person-days |
| Debt ratio (debt effort / feature effort) |      {ratio}%      |

{executive-summary-paragraph}

---

## Debt Inventory

### Architecture Debt

Design decisions that constrain future development or degrade system qualities.

| #   | Description   | Location         | Impact               |   Effort   |   Priority    |
| --- | ------------- | ---------------- | -------------------- | :--------: | :-----------: |
| A1  | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |
| A2  | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |

### Code Debt

Implementation shortcuts, code smells, and violations of coding standards.

| #   | Description   | Location         | Impact               |   Effort   |   Priority    |
| --- | ------------- | ---------------- | -------------------- | :--------: | :-----------: |
| C1  | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |
| C2  | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |

### Test Debt

Missing tests, poor test quality, or inadequate coverage.

| #   | Description   | Location         | Impact               |   Effort   |   Priority    |
| --- | ------------- | ---------------- | -------------------- | :--------: | :-----------: |
| T1  | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |
| T2  | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |

### Dependency Debt

Outdated, deprecated, or vulnerable dependencies.

| #   | Description   | Location         | Impact               |   Effort   |   Priority    |
| --- | ------------- | ---------------- | -------------------- | :--------: | :-----------: |
| D1  | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |
| D2  | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |

### Documentation Debt

Missing, incomplete, or outdated documentation.

| #    | Description   | Location         | Impact               |   Effort   |   Priority    |
| ---- | ------------- | ---------------- | -------------------- | :--------: | :-----------: |
| DOC1 | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |
| DOC2 | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |

### Infrastructure Debt

CI/CD, deployment, monitoring, and operational shortcomings.

| #   | Description   | Location         | Impact               |   Effort   |   Priority    |
| --- | ------------- | ---------------- | -------------------- | :--------: | :-----------: |
| I1  | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |
| I2  | {description} | {file-or-module} | {impact-description} | {S/M/L/XL} | {P1/P2/P3/P4} |

### Effort & Priority Key

| Effort | Meaning                         |
| ------ | ------------------------------- |
| S      | Small — less than 1 day         |
| M      | Medium — 1 to 3 days            |
| L      | Large — 3 to 10 days            |
| XL     | Extra Large — more than 10 days |

| Priority | Meaning                                               |
| -------- | ----------------------------------------------------- |
| P1       | Critical — blocking or high-risk, address immediately |
| P2       | High — significant impact, schedule this sprint       |
| P3       | Medium — moderate impact, schedule within 2 sprints   |
| P4       | Low — minimal impact, add to backlog                  |

---

## Dependency Health

Outdated or vulnerable dependencies identified via `npm outdated`, `cargo audit`, `pip-audit`, or equivalent.

| Package        |      Current      |      Latest      |       Behind        | Risk               |
| -------------- | :---------------: | :--------------: | :-----------------: | ------------------ |
| {package-name} | {current-version} | {latest-version} | {major/minor/patch} | {risk-description} |
| {package-name} | {current-version} | {latest-version} | {major/minor/patch} | {risk-description} |
| {package-name} | {current-version} | {latest-version} | {major/minor/patch} | {risk-description} |

### Vulnerability Summary

| Severity |  Count  |
| -------- | :-----: |
| Critical | {count} |
| High     | {count} |
| Medium   | {count} |
| Low      | {count} |

**Tool used:** {tool-name-and-version}

---

## Test Coverage

### Coverage by Area

| Area / Module | Statements |  Branches  | Functions  |   Lines    |    Target     |     Status      |
| ------------- | :--------: | :--------: | :--------: | :--------: | :-----------: | :-------------: |
| {area-1}      |   {pct}%   |   {pct}%   |   {pct}%   |   {pct}%   |   {target}%   |   {pass-fail}   |
| {area-2}      |   {pct}%   |   {pct}%   |   {pct}%   |   {pct}%   |   {target}%   |   {pass-fail}   |
| {area-3}      |   {pct}%   |   {pct}%   |   {pct}%   |   {pct}%   |   {target}%   |   {pass-fail}   |
| **Overall**   | **{pct}%** | **{pct}%** | **{pct}%** | **{pct}%** | **{target}%** | **{pass-fail}** |

### Uncovered Critical Paths

These are high-risk code paths with no test coverage that should be prioritized.

1. **{critical-path-1}** — {description-and-risk}
2. **{critical-path-2}** — {description-and-risk}
3. **{critical-path-3}** — {description-and-risk}

---

## Documentation Gaps

| Document                      | Status                             | Impact   | Notes   |
| ----------------------------- | ---------------------------------- | -------- | ------- |
| API reference                 | {Missing/Stale/Incomplete/Current} | {impact} | {notes} |
| Architecture decision records | {Missing/Stale/Incomplete/Current} | {impact} | {notes} |
| Onboarding / setup guide      | {Missing/Stale/Incomplete/Current} | {impact} | {notes} |
| Deployment runbook            | {Missing/Stale/Incomplete/Current} | {impact} | {notes} |
| Incident response playbook    | {Missing/Stale/Incomplete/Current} | {impact} | {notes} |
| CHANGELOG                     | {Missing/Stale/Incomplete/Current} | {impact} | {notes} |
| Contributing guide            | {Missing/Stale/Incomplete/Current} | {impact} | {notes} |

---

## Remediation Plan

Phased approach to paying down technical debt, prioritizing quick wins and high-risk items.

| Phase                        | Items      |   Effort    | Target Date | Owner   |
| ---------------------------- | ---------- | :---------: | :---------: | ------- |
| Phase 1 — Quick Wins         | {item-ids} | {days} days |   {date}    | {owner} |
| Phase 2 — Critical Risk      | {item-ids} | {days} days |   {date}    | {owner} |
| Phase 3 — Systematic Cleanup | {item-ids} | {days} days |   {date}    | {owner} |
| Phase 4 — Strategic Refactor | {item-ids} | {days} days |   {date}    | {owner} |

### Phase 1 — Quick Wins (< 1 day each)

Items that can be resolved quickly with outsized impact on developer experience or stability.

1. {item-id}: {brief-description}
2. {item-id}: {brief-description}

### Phase 2 — Critical Risk

Items that pose a security, data integrity, or availability risk if left unaddressed.

1. {item-id}: {brief-description}
2. {item-id}: {brief-description}

### Phase 3 — Systematic Cleanup

Batch refactoring and standardization efforts.

1. {item-id}: {brief-description}
2. {item-id}: {brief-description}

### Phase 4 — Strategic Refactor

Larger architectural changes to enable future scalability.

1. {item-id}: {brief-description}
2. {item-id}: {brief-description}

---

## Risk Assessment

What happens if this technical debt is not addressed.

| Timeframe   | Risk               |    Likelihood     |      Impact       |
| ----------- | ------------------ | :---------------: | :---------------: |
| 1-3 months  | {risk-description} | {High/Medium/Low} | {High/Medium/Low} |
| 3-6 months  | {risk-description} | {High/Medium/Low} | {High/Medium/Low} |
| 6-12 months | {risk-description} | {High/Medium/Low} | {High/Medium/Low} |

### Key Risks

1. **{risk-1-title}** — {risk-1-description}. Mitigated by: {item-ids}.
2. **{risk-2-title}** — {risk-2-description}. Mitigated by: {item-ids}.
3. **{risk-3-title}** — {risk-3-description}. Mitigated by: {item-ids}.

---

Total debt items: {count} | Estimated effort: {days} days

_Audit conducted under the [Organization Name] Quality Framework. Next review scheduled: {next-review-date}_
