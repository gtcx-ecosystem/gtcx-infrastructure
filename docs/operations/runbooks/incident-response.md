# Guide: Incident Response

## Severity Levels

| Severity          | Description                                                 | Examples                                                      | Response SLA |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------------------------- | ------------ |
| **P1 — Critical** | Active exploitation, data breach, or key compromise         | HSM key compromise, audit chain tampering, auth bypass        | 15 minutes   |
| **P2 — High**     | Vulnerability with exploit potential or service degradation | Privilege escalation, brute-force detected, rate limit bypass | 1 hour       |
| **P3 — Medium**   | Non-exploitable vulnerability or policy violation           | Failed auth spike, configuration drift, cert expiry warning   | 4 hours      |
| **P4 — Low**      | Informational or minor policy deviation                     | New dependency vulnerability (no exploit), log anomaly        | 24 hours     |

When in doubt, escalate to the higher severity. It is easier to downgrade than to explain why you waited.

## Step 1: Detect

Monitor these signals for incident indicators:

- **Audit log:** `PersistentAuditLog.query()` — spike in `outcome='denied'`
- **Auth metrics:** `MetricsExporter` counters — auth failures above threshold per minute
- **Hash chain integrity:** `PersistentAuditLog.verify()` — scheduled integrity checks
- **Rate limit exhaustion:** `PluggableRateLimiter` exhaustion events
- **Replay cache:** `gtcx_pvp_replay_check_total{result=rejected}` spike

**First responder action:** Acknowledge the incident within the response SLA. Confirm you are looking at it. Do not wait until you have answers.

## Step 2: Triage

1. Assess severity using the table above. When in doubt, go higher.
2. Assign an incident commander. This person owns the incident until resolution.
3. Open an incident channel. All communication about this incident happens in one place.
4. Log the start time and post the initial communication template (see below).

## Step 3: Communicate

Silence is worse than bad news. Communicate early, communicate often.

**Initial notification:**

```
INCIDENT: [Brief description]
SEVERITY: P[1-4]
DETECTED: [Time] UTC
STATUS: Investigating
IMPACT: [Affected protocols/services]
NEXT UPDATE: [Time] UTC

Incident commander: [Name]
```

**Status update (every 30 min for P1, every hour for P2):**

```
INCIDENT UPDATE: [Brief description]
STATUS: [Investigating / Contained / Remediating]
SUMMARY: [What we know and what we are doing]
NEXT UPDATE: [Time] UTC
```

**Resolution:**

```
INCIDENT RESOLVED: [Brief description]
SEVERITY: P[1-4]
DETECTED: [Time] UTC
RESOLVED: [Time] UTC
ROOT CAUSE: [One-sentence summary]
FOLLOW-UP: Post-mortem scheduled for [date]
```

**External notification:** SOC 2 CC7.3 requires breach notification within 72 hours of a confirmed breach.

## Step 4: Contain

Act on the smallest scope that stops the bleeding:

| Incident              | Containment Action                                                         |
| --------------------- | -------------------------------------------------------------------------- |
| Key compromise        | `HsmProvider.keyLifecycle.revoke(keyId)` immediately, then `rotate(keyId)` |
| Auth breach           | `AccountLockoutManager.recordFailure()` to lock affected accounts          |
| Rate limit escalation | Reduce `RateLimitConfig.maxRequests` dynamically                           |
| Session compromise    | Rotate HMAC token signing secret                                           |
| Replay attack         | Flush `BoundedReplayCache` — upgrade to Redis replay cache if not already  |

## Step 5: Investigate

Work methodically. Document everything in the incident record as you go.

1. Check recent deployments — was anything deployed in the last few hours?
2. Export the audit trail for the incident window:

```typescript
const entries = await auditLog.query({ fromTimestamp, toTimestamp });
const valid = await auditLog.verify();
```

3. Check metrics for when the anomaly started.
4. Correlate the timeline — when did it start? What changed around that time?

Before making any changes, preserve evidence:

```typescript
// Create audit checkpoint before remediation
await auditLog.checkpoint(signer);
```

All incident response actions must be logged to the audit trail with `actor='incident-response'`.

## Step 6: Resolve

Once the incident is contained:

1. Confirm the mitigation is holding. Monitor for at least 30 minutes after the fix.
2. Apply the permanent fix — or schedule it if the containment is stable.
3. Verify the fix — run tests, check metrics, confirm original symptoms are gone.

## Step 7: Post-Mortem

Conduct a post-mortem within 48 hours (P1) or 72 hours (P2):

- **Blameless.** Focus on systems, processes, and gaps — not individuals.
- Document: timeline from audit log, attack vector, controls that failed, controls that detected, remediation taken, preventive measures.
- Update the STRIDE threat model for the affected protocol.
- Update `docs/operations/compliance/controls-matrix.md` with new detection rules.

## Escalation Matrix

| Severity | First Responder   | Escalate To                          | Executive Notify |
| -------- | ----------------- | ------------------------------------ | ---------------- |
| **P1**   | On-call engineer  | Security Lead + Engineering Lead     | Immediately      |
| **P2**   | On-call engineer  | Engineering Lead                     | Within 1 hour    |
| **P3**   | Assigned engineer | Team lead (if unresolved in 4 hours) | Not required     |
| **P4**   | Assigned engineer | Not required                         | Not required     |

## Review Schedule

| Activity          | Frequency     |
| ----------------- | ------------- |
| Plan review       | Quarterly     |
| Tabletop exercise | Semi-annually |

## Reference

- [disaster-recovery.md](disaster-recovery.md)
- [monitoring.md](monitoring.md)
- [compliance/controls-matrix.md](../compliance/controls-matrix.md)
- [\docs/engineering/security/cryptographic-inventory.md](../../3-engineering/security/cryptographic-inventory.md)
