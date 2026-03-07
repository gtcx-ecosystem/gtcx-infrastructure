# Post-Mortem — {incident-id}: {title}

> This is a blameless post-mortem. Focus on systems and processes, not individuals.

| Field                | Value              |
| -------------------- | ------------------ |
| **Incident ID**      | {incident-id}      |
| **Date**             | {date}             |
| **Duration**         | {duration}         |
| **Severity**         | {severity}         |
| **Author**           | {author}           |
| **Post-Mortem Date** | {post-mortem-date} |

---

## Incident Summary

**What happened:** {summary-of-what-occurred}

**Services affected:** {services}

**Customer impact:** {description-of-customer-facing-impact}

**Duration:** {start-time} UTC to {end-time} UTC ({total-duration})

**Severity:** {SEV1/SEV2/SEV3/SEV4}

---

## Timeline

| Time (UTC) | Event                            |
| ---------- | -------------------------------- |
| {time}     | {first-sign-of-issue}            |
| {time}     | {alert-fired-or-report-received} |
| {time}     | {investigation-began}            |
| {time}     | {root-cause-identified}          |
| {time}     | {fix-deployed}                   |
| {time}     | {service-restored}               |
| {time}     | {monitoring-confirmed-stable}    |

---

## Root Cause Analysis

{detailed-description-of-what-caused-the-incident}

> For complex root causes, link to a separate RCA document: {link-to-rca}

---

## Contributing Factors

{factors-that-made-the-incident-worse-or-delayed-detection-and-resolution}

- {factor-1}
- {factor-2}
- {factor-3}

---

## What Went Well

- {positive-aspect-of-incident-response}
- {positive-aspect-of-incident-response}
- {positive-aspect-of-incident-response}

---

## What Went Poorly

- {area-for-improvement}
- {area-for-improvement}
- {area-for-improvement}

---

## Lessons Learned

1. {key-takeaway}
2. {key-takeaway}
3. {key-takeaway}

---

## Action Items

| #   | Action        | Owner   | Priority     | Due    | Status |
| --- | ------------- | ------- | ------------ | ------ | ------ |
| 1   | {action-item} | {owner} | P0 / P1 / P2 | {date} | Open   |
| 2   | {action-item} | {owner} | P0 / P1 / P2 | {date} | Open   |
| 3   | {action-item} | {owner} | P0 / P1 / P2 | {date} | Open   |

---

## Detection

**How was it detected?** {alert-name / customer-report / manual-observation}

**Time to detect:** {duration-from-start-to-detection}

**How could we detect it faster?**

- {improvement-to-monitoring-or-alerting}
- {improvement-to-monitoring-or-alerting}

---

## Prevention

**What changes would prevent recurrence?**

- {preventive-measure}
- {preventive-measure}
- {preventive-measure}

**Are there similar risks elsewhere in the system?** {yes-no-with-details}
