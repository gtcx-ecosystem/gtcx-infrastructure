# Incident Report — {incident-id}

> Fill this in DURING the incident. Keep entries brief. Details go in the post-mortem.

| Field            | Value             |
| ---------------- | ----------------- |
| **Incident ID**  | {incident-id}     |
| **Reported By**  | {reporter}        |
| **Reported At**  | {date} {time} UTC |
| **Resolved At**  | {date} {time} UTC |
| **Duration**     | {duration}        |
| **On-Call Lead** | {on-call-lead}    |

---

## Severity

- [ ] **SEV1** — Critical: Complete service outage or data loss affecting all users
- [ ] **SEV2** — Major: Significant degradation affecting a large subset of users
- [ ] **SEV3** — Minor: Partial degradation with workaround available
- [ ] **SEV4** — Low: Cosmetic or minor issue with negligible user impact

## Status

- [ ] **Investigating** — Incident detected, root cause unknown
- [ ] **Identified** — Root cause identified, working on fix
- [ ] **Monitoring** — Fix deployed, monitoring for stability
- [ ] **Resolved** — Incident fully resolved and stable

---

## Timeline

| Time (UTC) | Event               | Action Taken | By     |
| ---------- | ------------------- | ------------ | ------ |
| {time}     | {event-description} | {action}     | {name} |
| {time}     | {event-description} | {action}     | {name} |
| {time}     | {event-description} | {action}     | {name} |

---

## Impact

**Services affected:** {services}

**User impact:** {description-of-user-facing-impact}

**Data impact:** {any-data-loss-or-corruption}

**Estimated users affected:** {count-or-percentage}

---

## Root Cause

{brief-description-of-root-cause}

> Full root cause analysis will be documented in the post-mortem.

---

## Resolution

**What fixed it:** {description-of-fix}

**Deployed at:** {time} UTC

**Verified by:** {name}

---

## Communication

| Channel            | Updated? | By     | At (UTC) |
| ------------------ | -------- | ------ | -------- |
| Status page        | Yes / No | {name} | {time}   |
| Internal Slack     | Yes / No | {name} | {time}   |
| Customer email     | Yes / No | {name} | {time}   |
| Stakeholder update | Yes / No | {name} | {time}   |

---

## Follow-up

- [ ] Post-mortem scheduled — Date: {date}
- [ ] Post-mortem document: {link-to-post-mortem}
- [ ] Remediation tickets created: {ticket-links}
- [ ] Monitoring/alerting improvements identified
