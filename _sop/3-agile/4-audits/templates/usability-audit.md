# Usability Audit — {product-name}

## Audit Info

| Field         | Value              |
| ------------- | ------------------ |
| Date          | {audit-date}       |
| Auditor       | {auditor-name}     |
| Version/Build | {version-or-build} |
| Scope         | {audit-scope}      |
| Environment   | {environment}      |
| Device(s)     | {devices-tested}   |
| Duration      | {audit-duration}   |

## Executive Summary

**Overall Usability Score: {score}/10**

{executive-summary-paragraph}

### Top 3 Findings

1. **{finding-1-title}** — {finding-1-description}
2. **{finding-2-title}** — {finding-2-description}
3. **{finding-3-title}** — {finding-3-description}

---

## Heuristic Evaluation

Evaluation based on Jakob Nielsen's 10 Usability Heuristics for User Interface Design.

| #   | Heuristic                                               | Score (1-5) | Finding   | Severity   |
| --- | ------------------------------------------------------- | :---------: | --------- | ---------- |
| H1  | Visibility of system status                             |   {score}   | {finding} | {severity} |
| H2  | Match between system and real world                     |   {score}   | {finding} | {severity} |
| H3  | User control and freedom                                |   {score}   | {finding} | {severity} |
| H4  | Consistency and standards                               |   {score}   | {finding} | {severity} |
| H5  | Error prevention                                        |   {score}   | {finding} | {severity} |
| H6  | Recognition rather than recall                          |   {score}   | {finding} | {severity} |
| H7  | Flexibility and efficiency of use                       |   {score}   | {finding} | {severity} |
| H8  | Aesthetic and minimalist design                         |   {score}   | {finding} | {severity} |
| H9  | Help users recognize, diagnose, and recover from errors |   {score}   | {finding} | {severity} |
| H10 | Help and documentation                                  |   {score}   | {finding} | {severity} |

**Heuristic Average: {average}/5**

### Scoring Guide

- **5** — Excellent. No usability issues observed.
- **4** — Good. Minor cosmetic issues only.
- **3** — Fair. Some usability issues that cause occasional difficulty.
- **2** — Poor. Significant usability issues that frequently impede users.
- **1** — Failing. Critical issues that prevent task completion.

---

## Task Completion

Key user flows tested for completion rate, efficiency, and error frequency.

| Task     | Success Rate | Avg Time | Errors  | Notes   |
| -------- | :----------: | :------: | :-----: | ------- |
| {task-1} |   {rate}%    |  {time}  | {count} | {notes} |
| {task-2} |   {rate}%    |  {time}  | {count} | {notes} |
| {task-3} |   {rate}%    |  {time}  | {count} | {notes} |
| {task-4} |   {rate}%    |  {time}  | {count} | {notes} |
| {task-5} |   {rate}%    |  {time}  | {count} | {notes} |

**Overall Task Success Rate: {overall-rate}%**

### Observations

- {observation-1}
- {observation-2}
- {observation-3}

---

## Accessibility

WCAG 2.1 Level AA compliance checks.

### Color Contrast

| Element   | Foreground | Background |  Ratio  |     Required     |  Pass?   |
| --------- | ---------- | ---------- | :-----: | :--------------: | :------: |
| {element} | {fg-color} | {bg-color} | {ratio} | {required-ratio} | {yes-no} |
| {element} | {fg-color} | {bg-color} | {ratio} | {required-ratio} | {yes-no} |

### Keyboard Navigation

- [ ] All interactive elements reachable via Tab
- [ ] Focus order follows logical reading sequence
- [ ] No keyboard traps detected
- [ ] Custom components have appropriate key bindings
- [ ] Skip-to-content link present and functional

### Screen Reader

- [ ] Page landmarks properly defined (header, nav, main, footer)
- [ ] Headings follow hierarchical structure (h1 > h2 > h3)
- [ ] Form inputs have associated labels
- [ ] Dynamic content changes announced via ARIA live regions
- [ ] Tables have proper headers and captions

### Focus Indicators

- [ ] Visible focus ring on all interactive elements
- [ ] Focus ring meets 3:1 contrast ratio against adjacent colors
- [ ] Custom focus styles do not reduce visibility

### Alt Text & Media

- [ ] All informative images have descriptive alt text
- [ ] Decorative images use empty alt (`alt=""`) or CSS background
- [ ] Video content has captions
- [ ] Audio content has transcripts

**Accessibility Score: {score}/5**

---

## Global South Considerations

These checks ensure the product serves users in resource-constrained environments effectively.

### Offline Experience

- [ ] Core functionality available offline
- [ ] Graceful degradation when connectivity drops mid-task
- [ ] Local data sync when connection restores
- [ ] Offline state clearly communicated to user
- Notes: {offline-notes}

### Low-Bandwidth Performance

| Metric                 |  Value  |  Target   |  Pass?   |
| ---------------------- | :-----: | :-------: | :------: |
| Initial page load (3G) | {value} |   < 3s    | {yes-no} |
| Total page weight      | {value} |  < 500KB  | {yes-no} |
| API payload size (avg) | {value} |  < 50KB   | {yes-no} |
| Image optimization     | {value} | WebP/AVIF | {yes-no} |

### Multi-Language Support

- [ ] UI fully translated for target locales: {locales}
- [ ] RTL layout supported where applicable
- [ ] Date, number, and currency formats localized
- [ ] No hardcoded strings in source code
- [ ] Translation completeness: {percentage}%

### SMS/USSD Fallback

- [ ] Critical workflows accessible via SMS
- [ ] USSD menu structure tested and documented
- [ ] Character limits respected in all message templates
- [ ] Fallback pathway documented for users without smartphones
- Notes: {sms-ussd-notes}

---

## Issues

All usability issues identified during the audit.

| #   | Issue               | Severity                   | Location            | Recommendation   |
| --- | ------------------- | -------------------------- | ------------------- | ---------------- |
| 1   | {issue-description} | {Critical/High/Medium/Low} | {page-or-component} | {recommendation} |
| 2   | {issue-description} | {Critical/High/Medium/Low} | {page-or-component} | {recommendation} |
| 3   | {issue-description} | {Critical/High/Medium/Low} | {page-or-component} | {recommendation} |

### Severity Definitions

- **Critical** — Prevents task completion. Must fix before release.
- **High** — Causes significant user frustration or data loss risk. Fix in current sprint.
- **Medium** — Noticeable friction but workaround exists. Schedule for next sprint.
- **Low** — Minor cosmetic or polish issue. Add to backlog.

---

## Recommendations

Prioritized list of improvements, ordered by impact and feasibility.

### Immediate (This Sprint)

1. {recommendation-1}
2. {recommendation-2}

### Short-Term (Next 2 Sprints)

1. {recommendation-3}
2. {recommendation-4}

### Long-Term (Roadmap)

1. {recommendation-5}
2. {recommendation-6}

---

## Score Summary

| Category               |     Score     |  Weight  |    Weighted Score    |
| ---------------------- | :-----------: | :------: | :------------------: |
| Heuristic Evaluation   |   {score}/5   |   30%    |      {weighted}      |
| Task Completion        |   {score}/5   |   25%    |      {weighted}      |
| Accessibility          |   {score}/5   |   20%    |      {weighted}      |
| Global South Readiness |   {score}/5   |   15%    |      {weighted}      |
| Visual Design & Polish |   {score}/5   |   10%    |      {weighted}      |
| **Overall**            | **{total}/5** | **100%** | **{weighted-total}** |

### Overall Rating

| Range     | Rating                                                |
| --------- | ----------------------------------------------------- |
| 4.5 - 5.0 | Excellent — Ship with confidence                      |
| 3.5 - 4.4 | Good — Minor issues to address                        |
| 2.5 - 3.4 | Fair — Significant improvements needed before release |
| 1.5 - 2.4 | Poor — Major rework required                          |
| 1.0 - 1.4 | Failing — Do not release                              |

**This product scores {total}/5 — {rating}**

---

_Audit conducted under the [Organization Name] Quality Framework. Next review scheduled: {next-review-date}_
