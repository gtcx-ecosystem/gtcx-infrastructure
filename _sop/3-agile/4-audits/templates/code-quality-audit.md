# Code Quality Audit — {repo-name}

## Audit Info

| Field      | Value          |
| ---------- | -------------- |
| Date       | {audit-date}   |
| Auditor    | {auditor-name} |
| Repo       | {repo-url}     |
| Branch     | {branch}       |
| Commit     | {commit-sha}   |
| Tools Used | {tools-list}   |

**Tools configuration:** {eslint-config}, {prettier-config}, {sonarqube-profile}, {other-tool-configs}

## Executive Summary

**Overall Grade: {A/B/C/D/F}**

| Metric                        |     Value     |
| ----------------------------- | :-----------: |
| Total violations              |    {count}    |
| Critical/blocker violations   |    {count}    |
| Code duplication              | {percentage}% |
| Average cyclomatic complexity |    {value}    |
| Test coverage (lines)         | {percentage}% |
| Type coverage                 | {percentage}% |

{executive-summary-paragraph}

### Grading Scale

| Grade | Criteria                                                                      |
| :---: | ----------------------------------------------------------------------------- |
|   A   | No critical issues, < 10 total violations, coverage > 80%, duplication < 3%   |
|   B   | No critical issues, < 25 total violations, coverage > 70%, duplication < 5%   |
|   C   | < 5 critical issues, < 50 total violations, coverage > 50%, duplication < 10% |
|   D   | < 10 critical issues, < 100 total violations, coverage > 30%                  |
|   F   | 10+ critical issues, or 100+ total violations, or coverage < 30%              |

---

## Static Analysis

Results from automated linting and static analysis tools.

### Violation Summary

| Rule / Check | Violations | Severity                    |      Trend       |
| ------------ | :--------: | --------------------------- | :--------------: |
| {rule-name}  |  {count}   | {Critical/Major/Minor/Info} | {up/down/stable} |
| {rule-name}  |  {count}   | {Critical/Major/Minor/Info} | {up/down/stable} |
| {rule-name}  |  {count}   | {Critical/Major/Minor/Info} | {up/down/stable} |
| {rule-name}  |  {count}   | {Critical/Major/Minor/Info} | {up/down/stable} |
| {rule-name}  |  {count}   | {Critical/Major/Minor/Info} | {up/down/stable} |

### Violations by Severity

| Severity  |    Count    | Change from Last Audit |
| --------- | :---------: | :--------------------: |
| Critical  |   {count}   |        {delta}         |
| Major     |   {count}   |        {delta}         |
| Minor     |   {count}   |        {delta}         |
| Info      |   {count}   |        {delta}         |
| **Total** | **{count}** |      **{delta}**       |

### Disabled Rules

Rules intentionally disabled in the project configuration. Each must have a documented justification.

| Rule        | Reason          | Approved By |
| ----------- | --------------- | ----------- |
| {rule-name} | {justification} | {approver}  |

---

## Code Metrics

Quantitative measurements of code health.

| Metric                      |  Value   | Target |   Status    |
| --------------------------- | :------: | :----: | :---------: |
| Cyclomatic complexity (avg) | {value}  |  < 10  | {pass-fail} |
| Cyclomatic complexity (max) | {value}  |  < 20  | {pass-fail} |
| Code duplication %          | {value}% |  < 5%  | {pass-fail} |
| Lines of code (total)       | {value}  |   —    |      —      |
| Lines of code (production)  | {value}  |   —    |      —      |
| Lines of code (test)        | {value}  |   —    |      —      |
| Test-to-production ratio    | {value}  | > 0.8  | {pass-fail} |
| Function length (avg lines) | {value}  |  < 30  | {pass-fail} |
| Function length (max lines) | {value}  | < 100  | {pass-fail} |
| File count                  | {value}  |   —    |      —      |
| Avg file length (lines)     | {value}  | < 300  | {pass-fail} |
| Max file length (lines)     | {value}  | < 500  | {pass-fail} |
| Type coverage               | {value}% | > 90%  | {pass-fail} |
| `any` type usage            | {count}  |   0    | {pass-fail} |

### Hotspot Files

Files with the highest complexity, most violations, or frequent changes that warrant refactoring.

| File        | Complexity | Violations | Churn (commits) | Action   |
| ----------- | :--------: | :--------: | :-------------: | -------- |
| {file-path} |  {value}   |  {count}   |     {churn}     | {action} |
| {file-path} |  {value}   |  {count}   |     {churn}     | {action} |
| {file-path} |  {value}   |  {count}   |     {churn}     | {action} |

---

## Architecture Compliance

Assessment of whether the codebase follows its intended architectural patterns.

### Pattern Adherence

| Pattern        | Expected            | Actual            | Compliant? | Notes   |
| -------------- | ------------------- | ----------------- | :--------: | ------- |
| {pattern-name} | {expected-behavior} | {actual-behavior} |  {yes-no}  | {notes} |
| {pattern-name} | {expected-behavior} | {actual-behavior} |  {yes-no}  | {notes} |

### Module Boundary Violations

| Source Module | Target Module | Violation Type                      | File        |
| ------------- | ------------- | ----------------------------------- | ----------- |
| {module-a}    | {module-b}    | {direct-import/circular/layer-skip} | {file-path} |

### Dependency Direction

- [ ] Dependencies flow inward (domain has no external dependencies)
- [ ] No circular dependencies between modules
- [ ] Shared utilities are in designated shared packages
- [ ] No direct database access outside repository/data layer
- [ ] External API calls isolated to adapter/client layer

---

## Naming & Conventions

### File Naming

| Convention      | Expected                       |  Compliance   | Violations |
| --------------- | ------------------------------ | :-----------: | :--------: |
| Component files | PascalCase (`.tsx`)            | {percentage}% |  {count}   |
| Utility files   | camelCase (`.ts`)              | {percentage}% |  {count}   |
| Test files      | `*.test.ts` / `*.spec.ts`      | {percentage}% |  {count}   |
| Style files     | `*.module.css` / `*.styles.ts` | {percentage}% |  {count}   |
| Constants       | UPPER_SNAKE_CASE or camelCase  | {percentage}% |  {count}   |

### Variable & Function Naming

- [ ] Boolean variables prefixed with `is`, `has`, `should`, `can`
- [ ] Event handlers prefixed with `handle` or `on`
- [ ] Async functions clearly named (e.g., `fetchUser`, `loadData`)
- [ ] No single-letter variables outside loop iterators
- [ ] Abbreviations consistent and documented

### Export Patterns

- [ ] Barrel exports (`index.ts`) used consistently
- [ ] Default exports avoided (named exports preferred)
- [ ] Public API surface explicitly defined per module
- [ ] Internal modules not re-exported

### Folder Structure

- [ ] Follows documented folder structure convention
- [ ] Feature folders contain all related files (component, test, styles, types)
- [ ] No orphaned files outside expected directories
- [ ] Depth does not exceed {max-depth} levels

---

## Security

### OWASP Top 10 Checks

| #   | Risk                                     |     Status     | Finding   |
| --- | ---------------------------------------- | :------------: | --------- |
| A01 | Broken Access Control                    | {pass-fail-na} | {finding} |
| A02 | Cryptographic Failures                   | {pass-fail-na} | {finding} |
| A03 | Injection                                | {pass-fail-na} | {finding} |
| A04 | Insecure Design                          | {pass-fail-na} | {finding} |
| A05 | Security Misconfiguration                | {pass-fail-na} | {finding} |
| A06 | Vulnerable & Outdated Components         | {pass-fail-na} | {finding} |
| A07 | Identification & Authentication Failures | {pass-fail-na} | {finding} |
| A08 | Software & Data Integrity Failures       | {pass-fail-na} | {finding} |
| A09 | Security Logging & Monitoring Failures   | {pass-fail-na} | {finding} |
| A10 | Server-Side Request Forgery (SSRF)       | {pass-fail-na} | {finding} |

### Dependency Vulnerabilities

| Package   | Vulnerability | Severity                   | CVE      | Fix Available? |
| --------- | ------------- | -------------------------- | -------- | :------------: |
| {package} | {description} | {Critical/High/Medium/Low} | {cve-id} |    {yes-no}    |

### Secrets Scanning

- [ ] No hardcoded API keys, tokens, or passwords in source
- [ ] `.env` files excluded from version control
- [ ] Secrets scanning tool active in CI: {tool-name}
- [ ] No secrets detected in git history (checked with {tool-name})

---

## Test Quality

### Coverage

| Area        | Statements |  Branches  | Functions  |   Lines    |
| ----------- | :--------: | :--------: | :--------: | :--------: |
| {area-1}    |   {pct}%   |   {pct}%   |   {pct}%   |   {pct}%   |
| {area-2}    |   {pct}%   |   {pct}%   |   {pct}%   |   {pct}%   |
| **Overall** | **{pct}%** | **{pct}%** | **{pct}%** | **{pct}%** |

### Test Quality Assessment

| Dimension                 | Rating (1-5) | Notes   |
| ------------------------- | :----------: | ------- |
| Test naming clarity       |   {score}    | {notes} |
| Assertion specificity     |   {score}    | {notes} |
| Mock/stub appropriateness |   {score}    | {notes} |
| Test isolation            |   {score}    | {notes} |
| Edge case coverage        |   {score}    | {notes} |
| Error path coverage       |   {score}    | {notes} |
| Test data management      |   {score}    | {notes} |

### Flaky Tests

| Test        | File        | Failure Rate | Root Cause | Status       |
| ----------- | ----------- | :----------: | ---------- | ------------ |
| {test-name} | {file-path} |   {rate}%    | {cause}    | {open-fixed} |

### Missing Edge Cases

1. {description-of-missing-test-1}
2. {description-of-missing-test-2}
3. {description-of-missing-test-3}

---

## Issues

All code quality issues identified during the audit.

| #   | Issue               | Category                                     | Severity                   | File(s)      | Recommendation   |
| --- | ------------------- | -------------------------------------------- | -------------------------- | ------------ | ---------------- |
| 1   | {issue-description} | {Architecture/Code/Test/Security/Convention} | {Critical/High/Medium/Low} | {file-paths} | {recommendation} |
| 2   | {issue-description} | {Architecture/Code/Test/Security/Convention} | {Critical/High/Medium/Low} | {file-paths} | {recommendation} |
| 3   | {issue-description} | {Architecture/Code/Test/Security/Convention} | {Critical/High/Medium/Low} | {file-paths} | {recommendation} |
| 4   | {issue-description} | {Architecture/Code/Test/Security/Convention} | {Critical/High/Medium/Low} | {file-paths} | {recommendation} |
| 5   | {issue-description} | {Architecture/Code/Test/Security/Convention} | {Critical/High/Medium/Low} | {file-paths} | {recommendation} |

---

## Action Items

Prioritized fixes with ownership and target dates.

| #   | Action               | Category   | Severity                   | Owner   | Deadline |         Status          |
| --- | -------------------- | ---------- | -------------------------- | ------- | :------: | :---------------------: |
| 1   | {action-description} | {category} | {Critical/High/Medium/Low} | {owner} |  {date}  | {open-in-progress-done} |
| 2   | {action-description} | {category} | {Critical/High/Medium/Low} | {owner} |  {date}  | {open-in-progress-done} |
| 3   | {action-description} | {category} | {Critical/High/Medium/Low} | {owner} |  {date}  | {open-in-progress-done} |
| 4   | {action-description} | {category} | {Critical/High/Medium/Low} | {owner} |  {date}  | {open-in-progress-done} |
| 5   | {action-description} | {category} | {Critical/High/Medium/Low} | {owner} |  {date}  | {open-in-progress-done} |

### Quick Wins (< 1 hour each)

1. {action-description}
2. {action-description}

### Requires Planning

1. {action-description} — estimated {effort}
2. {action-description} — estimated {effort}

---

_Audit conducted under the [Organization Name] Quality Framework. Next review scheduled: {next-review-date}_
