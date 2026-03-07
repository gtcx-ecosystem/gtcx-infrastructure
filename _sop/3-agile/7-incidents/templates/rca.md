# Root Cause Analysis — {incident-id}

| Field                   | Value                 |
| ----------------------- | --------------------- |
| **Incident ID**         | {incident-id}         |
| **Incident Date**       | {date}                |
| **RCA Author**          | {author}              |
| **RCA Date**            | {rca-date}            |
| **Related Post-Mortem** | {link-to-post-mortem} |

---

## Problem Statement

{precise-description-of-what-went-wrong — what was the observable failure, when did it start, and when was it resolved}

---

## Impact

| Metric             | Value                      |
| ------------------ | -------------------------- |
| **Users affected** | {count-or-percentage}      |
| **Duration**       | {duration}                 |
| **Revenue impact** | {estimated-amount-or-none} |
| **Data loss**      | {description-or-none}      |
| **SLA breach**     | Yes / No                   |

---

## Five Whys

**Why 1:** {immediate-cause — what directly triggered the failure}

**Why 2:** {why-did-that-happen}

**Why 3:** {why-did-that-happen}

**Why 4:** {why-did-that-happen}

**Why 5 (Root Cause):** {the-underlying-systemic-cause}

---

## Contributing Factors

| Factor   | Category  | Contribution         |
| -------- | --------- | -------------------- |
| {factor} | Technical | {how-it-contributed} |
| {factor} | Process   | {how-it-contributed} |
| {factor} | Human     | {how-it-contributed} |
| {factor} | External  | {how-it-contributed} |

Categories: **Technical** (code, infrastructure, architecture), **Process** (procedures, policies, workflows), **Human** (training, communication, staffing), **External** (vendor, network, third-party)

---

## Root Cause

{clear-statement-of-the-root-cause-identified-through-the-analysis-above}

---

## Corrective Actions

| #   | Action   | Type                  | Owner   | Due    |
| --- | -------- | --------------------- | ------- | ------ |
| 1   | {action} | Immediate fix         | {owner} | {date} |
| 2   | {action} | Short-term mitigation | {owner} | {date} |
| 3   | {action} | Long-term prevention  | {owner} | {date} |

Types:

- **Immediate fix** — Stops the bleeding right now
- **Short-term mitigation** — Reduces risk while a proper fix is built
- **Long-term prevention** — Eliminates the root cause

---

## Verification

**How will we confirm the root cause is fixed?**

- {verification-method — test, metric, alert, load-test}
- {verification-method}

**Success criteria:** {what-does-fixed-look-like}

---

## Related Incidents

| Incident ID   | Date   | Similarity       |
| ------------- | ------ | ---------------- |
| {incident-id} | {date} | {how-it-relates} |
| {incident-id} | {date} | {how-it-relates} |

If no related incidents: "No similar past incidents identified."
