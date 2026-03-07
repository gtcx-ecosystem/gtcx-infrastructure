# Hallucination Audit — {content-type}

## Audit Info

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Date           | {audit-date}                            |
| Auditor        | {auditor-name}                          |
| Content Scope  | {content-scope}                         |
| Agent(s)       | {agent-names}                           |
| Model Version  | {model-version}                         |
| Content Volume | {word-count} words / {page-count} pages |
| Review Method  | {manual/semi-automated/automated}       |

## Executive Summary

**Accuracy Score: {percentage}%**

| Metric               |     Value     |
| -------------------- | :-----------: |
| Total claims checked |    {count}    |
| Confirmed accurate   |    {count}    |
| Unverifiable         |    {count}    |
| Inaccurate           |    {count}    |
| Fabricated           |    {count}    |
| Hallucination rate   | {percentage}% |

{executive-summary-paragraph}

---

## Methodology

### Verification Approach

{methodology-description}

### Verification Sources

1. **Primary sources** — {description-of-primary-sources}
2. **Cross-referencing** — {description-of-cross-reference-approach}
3. **Expert review** — {description-of-expert-review-process}
4. **Tool-assisted** — {tools-used-for-verification}

### Scope Limitations

- {limitation-1}
- {limitation-2}

---

## Claim Verification

Detailed verification of individual claims made in the audited content.

| #   | Claim        | Source                    |   Verified   | Finding              | Severity               |
| --- | ------------ | ------------------------- | :----------: | -------------------- | ---------------------- |
| 1   | {claim-text} | {cited-or-implied-source} |  Confirmed   | {verification-notes} | —                      |
| 2   | {claim-text} | {cited-or-implied-source} | Unverifiable | {verification-notes} | Low                    |
| 3   | {claim-text} | {cited-or-implied-source} |  Inaccurate  | {verification-notes} | {Medium/High/Critical} |
| 4   | {claim-text} | {cited-or-implied-source} |  Fabricated  | {verification-notes} | {High/Critical}        |
| 5   | {claim-text} | {cited-or-implied-source} |   {status}   | {verification-notes} | {severity}             |

### Verification Status Definitions

| Status           | Definition                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Confirmed**    | Claim verified against a reliable source.                                                                             |
| **Unverifiable** | Claim cannot be confirmed or denied with available sources.                                                           |
| **Inaccurate**   | Claim contains errors — wrong numbers, dates, or characterizations. The underlying fact exists but is misrepresented. |
| **Fabricated**   | Claim has no basis in reality. The source, entity, statistic, or relationship was invented by the model.              |

### Severity Definitions

| Severity     | Definition                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------- |
| **Critical** | Fabrication that could cause material harm, legal liability, or policy failure if published. |
| **High**     | Significant inaccuracy that undermines credibility or could mislead decision-makers.         |
| **Medium**   | Moderate error that is factually wrong but unlikely to cause direct harm.                    |
| **Low**      | Minor or unverifiable claim with limited downstream impact.                                  |

---

## Hallucination Categories

Breakdown of hallucination types identified.

| Category                       |    Count    | Examples         |
| ------------------------------ | :---------: | ---------------- |
| Factual errors                 |   {count}   | {brief-examples} |
| Fabricated sources / citations |   {count}   | {brief-examples} |
| Outdated information           |   {count}   | {brief-examples} |
| Misattributed data             |   {count}   | {brief-examples} |
| Invented statistics            |   {count}   | {brief-examples} |
| False entity relationships     |   {count}   | {brief-examples} |
| Temporal errors (wrong dates)  |   {count}   | {brief-examples} |
| **Total**                      | **{total}** |                  |

### Most Common Category: {category-name}

{analysis-of-why-this-category-is-most-prevalent}

---

## Source Quality

Assessment of how claims map to different source types and their verification rates.

| Source Type                                     |   Claims    |  Verified   | Verification Rate |
| ----------------------------------------------- | :---------: | :---------: | :---------------: |
| Primary sources (official documents, databases) |   {count}   |   {count}   |   {percentage}%   |
| Government / regulatory                         |   {count}   |   {count}   |   {percentage}%   |
| Industry reports                                |   {count}   |   {count}   |   {percentage}%   |
| Academic / peer-reviewed                        |   {count}   |   {count}   |   {percentage}%   |
| News media                                      |   {count}   |   {count}   |   {percentage}%   |
| AI-generated (no external source)               |   {count}   |   {count}   |   {percentage}%   |
| **Total**                                       | **{count}** | **{count}** | **{percentage}%** |

### Observations

- {source-quality-observation-1}
- {source-quality-observation-2}

---

## Agent Performance

If multiple [AI System] agents (hats) contributed to the audited content, accuracy is broken down by agent.

| Agent / Hat    |   Claims    |  Accurate   | Inaccurate  | Fabricated  |   Accuracy Rate   |
| -------------- | :---------: | :---------: | :---------: | :---------: | :---------------: |
| {agent-name-1} |   {count}   |   {count}   |   {count}   |   {count}   |   {percentage}%   |
| {agent-name-2} |   {count}   |   {count}   |   {count}   |   {count}   |   {percentage}%   |
| {agent-name-3} |   {count}   |   {count}   |   {count}   |   {count}   |   {percentage}%   |
| **All agents** | **{count}** | **{count}** | **{count}** | **{count}** | **{percentage}%** |

### Agent-Specific Notes

- **{agent-name-1}**: {performance-notes}
- **{agent-name-2}**: {performance-notes}

---

## Patterns

Recurring hallucination patterns observed across the audited content.

### Pattern 1: {pattern-name}

- **Description**: {pattern-description}
- **Frequency**: {count} occurrences
- **Root cause**: {likely-root-cause}
- **Example**: {specific-example}

### Pattern 2: {pattern-name}

- **Description**: {pattern-description}
- **Frequency**: {count} occurrences
- **Root cause**: {likely-root-cause}
- **Example**: {specific-example}

### Pattern 3: {pattern-name}

- **Description**: {pattern-description}
- **Frequency**: {count} occurrences
- **Root cause**: {likely-root-cause}
- **Example**: {specific-example}

---

## Guardrail Recommendations

Suggested measures to prevent recurrence of identified hallucination patterns.

### Prompt Engineering

1. **{recommendation-title}** — {description}
2. **{recommendation-title}** — {description}
3. **{recommendation-title}** — {description}

### Validation Rules

1. **{rule-title}** — {description}. Trigger: {when-to-apply}. Action: {what-happens}.
2. **{rule-title}** — {description}. Trigger: {when-to-apply}. Action: {what-happens}.

### Human Gates

| Gate        | Trigger          | Reviewer        |        SLA        |
| ----------- | ---------------- | --------------- | :---------------: |
| {gate-name} | {when-triggered} | {reviewer-role} | {turnaround-time} |
| {gate-name} | {when-triggered} | {reviewer-role} | {turnaround-time} |

### Automated Checks

| Check        | Implementation    | Coverage          |      Status       |
| ------------ | ----------------- | ----------------- | :---------------: |
| {check-name} | {how-implemented} | {what-it-catches} | {active-proposed} |
| {check-name} | {how-implemented} | {what-it-catches} | {active-proposed} |

### Data Pipeline Improvements

1. {improvement-description}
2. {improvement-description}

---

## Verdict

### {PASS / CONDITIONAL PASS / FAIL}

| Verdict              | Criteria                                                                            |
| -------------------- | ----------------------------------------------------------------------------------- |
| **PASS**             | Accuracy >= 95%, zero fabrications, zero critical severity items                    |
| **CONDITIONAL PASS** | Accuracy >= 85%, zero critical fabrications, all issues have documented corrections |
| **FAIL**             | Accuracy < 85%, or any critical fabrication, or systemic pattern without mitigation |

### Conditions (if CONDITIONAL PASS)

1. {condition-1-that-must-be-met}
2. {condition-2-that-must-be-met}

### Rationale

{verdict-rationale-paragraph}

### Required Actions Before Publication

1. {required-action-1}
2. {required-action-2}
3. {required-action-3}

---

Claims checked: {count} | Accuracy: {percentage}% | Auditor: {name}

_Audit conducted under the [Organization Name] Quality Framework. Next review scheduled: {next-review-date}_
