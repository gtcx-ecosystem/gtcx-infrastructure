---
title: 'Red Team Playbook — GTCX Infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Red Team Playbook — GTCX Infrastructure

**Version:** 1.0
**Classification:** Confidential
**Date:** 2026-05-08
**Owner:** Infrastructure Security Team

---

## Engagement Rules

### Scope

All GTCX infrastructure, applications, and supporting systems are in scope unless explicitly excluded. Exclusions are documented per engagement in the Rules of Engagement (RoE) agreement signed before each exercise.

### Standing exclusions

- Physical attacks on data centers or offices
- Social engineering of customers (employees and contractors only)
- Denial-of-service attacks against production systems (simulated in staging only)
- Attacks against third-party SaaS providers not owned by GTCX

### Engagement model: Assumed Breach

Every red team exercise starts from an assumed breach position. The red team is given:

- A valid but low-privilege user credential (simulating credential compromise)
- Network access equivalent to a compromised developer workstation
- No prior knowledge of internal architecture beyond what is publicly observable

This model tests detection and containment, not just prevention.

### Purple Team Debrief

Every exercise concludes with a purple team debrief where red and blue teams review findings together:

1. Red team presents attack path, tools used, and timeline
2. Blue team presents detection timeline, alerts triggered, and response actions
3. Both teams identify detection gaps and propose improvements
4. Findings are logged in the risk register (see Debrief Template below)

---

## Annual Cadence

Each year runs four exercises. One major scenario per year, with three focused mini-exercises.

| Year | Q1 (Major)                        | Q2 (Mini)                         | Q3 (Mini)        | Q4 (Mini)             |
| ---- | --------------------------------- | --------------------------------- | ---------------- | --------------------- |
| 2026 | Compromised developer credentials | Supply chain attack               | Lateral movement | Data exfiltration     |
| 2027 | Insider threat                    | Cloud misconfiguration            | API abuse        | Ransomware simulation |
| 2028 | Supply chain attack               | Compromised developer credentials | Insider threat   | Lateral movement      |

Major exercises: 2-week engagement, full purple team debrief, board briefing.
Mini exercises: 3-day engagement, team debrief, risk register update.

---

## Attack Scenarios

### Scenario 1: Compromised Developer Credentials

**Premise:** An attacker has obtained a developer's GitHub personal access token and AWS SSO session cookie through a phishing attack.

**Objectives:**

1. Enumerate accessible repositories and identify secrets in code/history
2. Pivot from GitHub access to CI/CD pipeline execution
3. Inject malicious code into a build artifact
4. Attempt to reach production systems via the CI/CD trust chain
5. Exfiltrate data from accessible databases

**Attack steps:**

| Phase                | Action                                              | Detection Expected                                              |
| -------------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| Reconnaissance       | Enumerate repos, branches, CI configs               | GitHub audit log: unusual repo access pattern                   |
| Initial access       | Clone sensitive repos; search for hardcoded secrets | GitHub audit log: bulk clone activity                           |
| Persistence          | Create a GitHub deploy key or personal access token | GitHub audit log: new credential created                        |
| Lateral movement     | Trigger CI workflow with modified build script      | CI alert: unexpected workflow trigger from unknown IP           |
| Privilege escalation | Use CI OIDC token to assume AWS role                | CloudTrail: unusual AssumeRoleWithWebIdentity                   |
| Impact               | Access database via CI-role permissions             | Database audit log: query from CI role outside expected pattern |

**Success criteria:**

| Metric                               | Target                                  |
| ------------------------------------ | --------------------------------------- |
| Time to detect initial access        | < 30 minutes                            |
| Time to contain (revoke credentials) | < 2 hours                               |
| Data exfiltrated before containment  | 0 records                               |
| CI pipeline compromised              | No — detected before artifact published |

---

### Scenario 2: Supply Chain Attack

**Premise:** A commonly used npm dependency has been compromised with a postinstall script that exfiltrates environment variables.

**Objectives:**

1. Simulate malicious dependency update in a feature branch
2. Verify that CI dependency scanning detects the malicious package
3. Test whether the build environment leaks secrets to the package
4. Verify SLSA provenance detects tampered artifacts

**Attack steps:**

| Phase          | Action                                                    | Detection Expected                                                        |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| Preparation    | Create a private npm package mimicking a known dependency | N/A (setup)                                                               |
| Initial access | Submit PR with dependency update to malicious version     | Dependabot/Snyk alert: known vulnerability or unexpected publisher change |
| Execution      | Malicious postinstall script runs in CI                   | CI sandbox: outbound network call blocked; alert fires                    |
| Exfiltration   | Script attempts to send env vars to external endpoint     | Network policy: egress denied; WAF log: blocked outbound request          |
| Persistence    | Script attempts to modify build output                    | SLSA provenance: artifact hash mismatch detected                          |

**Success criteria:**

| Metric                                       | Target                        |
| -------------------------------------------- | ----------------------------- |
| Dependency scanner detects malicious package | Before merge                  |
| CI network egress blocked                    | 100% of exfiltration attempts |
| SLSA provenance catches tampered artifact    | Yes                           |
| Time from PR to alert                        | < 5 minutes                   |

---

### Scenario 3: Insider Threat

**Premise:** A disgruntled employee with legitimate access to internal systems attempts to exfiltrate customer data and sabotage infrastructure.

**Objectives:**

1. Access production database using legitimate credentials
2. Export customer data beyond normal access patterns
3. Attempt to modify Terraform state or Kubernetes configs
4. Attempt to delete audit logs

**Attack steps:**

| Phase          | Action                                    | Detection Expected                                           |
| -------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Reconnaissance | Query database schema and row counts      | Database audit log: DDL queries from application role        |
| Data staging   | Export large result sets to local machine | DLP/database alert: bulk data export exceeding threshold     |
| Exfiltration   | Upload data to personal cloud storage     | Network DLP: sensitive data pattern on egress                |
| Sabotage       | Modify Terraform state file               | Terraform state lock alert; S3 versioning prevents loss      |
| Cover tracks   | Attempt to delete audit logs              | `gtcx_audit` is append-only; DELETE denied at database level |

**Success criteria:**

| Metric                          | Target                                    |
| ------------------------------- | ----------------------------------------- |
| Time to detect bulk data access | < 15 minutes                              |
| Audit log deletion              | Impossible (append-only enforced)         |
| Terraform state corruption      | Prevented by state locking and versioning |
| Data exfiltrated                | 0 records (DLP blocks before egress)      |

---

### Scenario 4: Lateral Movement

**Premise:** An attacker has compromised a single low-privilege pod in the Kubernetes cluster (e.g., a monitoring sidecar) and attempts to reach high-value targets.

**Objectives:**

1. Enumerate services and network paths from the compromised pod
2. Attempt to reach Redis, PostgreSQL, and other data stores
3. Attempt to access the Kubernetes API server
4. Attempt to escalate to node-level access

**Attack steps:**

| Phase            | Action                                           | Detection Expected                                              |
| ---------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| Enumeration      | DNS queries for service discovery                | Network policy: DNS queries outside pod's allowed set logged    |
| Lateral movement | Attempt TCP connections to Redis, PostgreSQL     | NetworkPolicy: connection denied; Linkerd: mTLS handshake fails |
| API abuse        | Attempt to call K8s API with pod service account | RBAC: forbidden; K8s audit log: denied API call                 |
| Escape attempt   | Attempt container escape via known techniques    | Seccomp/AppArmor: syscall denied; Falco alert fires             |
| Persistence      | Attempt to deploy a new pod                      | RBAC: forbidden; admission controller rejects                   |

**Success criteria:**

| Metric                         | Target                       |
| ------------------------------ | ---------------------------- |
| Lateral connections blocked    | 100% by NetworkPolicy        |
| K8s API access denied          | 100% by RBAC                 |
| Container escape prevented     | Yes (seccomp + read-only FS) |
| Time to detect compromised pod | < 10 minutes                 |

---

## Debrief Template

Use this template for every red team exercise debrief.

```markdown
# Red Team Debrief: {Scenario Name}

**Date:** {YYYY-MM-DD}
**Duration:** {n} days
**Red team lead:** {name}
**Blue team lead:** {name}

## Exercise Summary

{2-3 sentence summary of what was tested and the overall outcome}

## Attack Path

| Step | Action   | Outcome           | Detection? | Time to Detect |
| ---- | -------- | ----------------- | ---------- | -------------- |
| 1    | {action} | {success/blocked} | {yes/no}   | {duration}     |

## Findings

| #   | Finding       | Severity                       | Category                                    |
| --- | ------------- | ------------------------------ | ------------------------------------------- |
| F1  | {description} | Critical / High / Medium / Low | {detection gap / control gap / process gap} |

## Recommendations

| #   | Recommendation | Addresses Finding | Owner  | Target Date  |
| --- | -------------- | ----------------- | ------ | ------------ |
| R1  | {action}       | F1                | {team} | {YYYY-MM-DD} |

## Risk Register Updates

| Risk ID | Description   | Previous Rating | Updated Rating | Justification                |
| ------- | ------------- | --------------- | -------------- | ---------------------------- |
| {id}    | {description} | {H/M/L}         | {H/M/L}        | {based on exercise findings} |

## Metrics

| Metric            | Target   | Actual   | Pass?    |
| ----------------- | -------- | -------- | -------- |
| Time to detect    | {target} | {actual} | Yes / No |
| Time to contain   | {target} | {actual} | Yes / No |
| Data exfiltrated  | 0        | {actual} | Yes / No |
| Controls bypassed | 0        | {actual} | Yes / No |

## Blue Team Response Timeline

{Chronological narrative of detection, triage, and response actions}

## Lessons Learned

1. {lesson}
2. {lesson}
3. {lesson}
```

---

## Board Briefing Template

Use for the annual major exercise board briefing. Maximum 2 pages.

```markdown
# Security Exercise Board Briefing

**Exercise:** {Scenario Name}
**Date:** {YYYY-MM-DD}
**Classification:** Confidential

## Objective

{1 sentence: what threat was simulated and why}

## Key Findings

| #   | Finding   | Business Impact            | Status                              |
| --- | --------- | -------------------------- | ----------------------------------- |
| 1   | {finding} | {impact in business terms} | Remediated / In Progress / Accepted |

## Risk Posture Change

{1 paragraph: has organizational risk increased, decreased, or remained stable
since the last exercise? Reference specific controls that improved or degraded.}

## Investment Required

| Initiative   | Cost Estimate | Risk Reduced | Priority |
| ------------ | ------------- | ------------ | -------- |
| {initiative} | {estimate}    | {which risk} | {1/2/3}  |

## Comparison to Previous Exercise

| Metric            | Previous Exercise | This Exercise | Trend                          |
| ----------------- | ----------------- | ------------- | ------------------------------ |
| Time to detect    | {value}           | {value}       | Improving / Stable / Declining |
| Time to contain   | {value}           | {value}       | Improving / Stable / Declining |
| Controls bypassed | {value}           | {value}       | Improving / Stable / Declining |

## Recommendation

{1-2 sentences: what the board should approve or be aware of}
```

---

## References

- MITRE ATT&CK Framework: https://attack.mitre.org
- PTES (Penetration Testing Execution Standard): http://www.pentest-standard.org
- CISA Red Team Assessment: https://www.cisa.gov/red-team-assessments
- GTCX threat model: `01-docs/09-security/threat-model.md`
- GTCX incident response: `01-docs/09-security/security-architecture.md`
- GTCX zero trust assessment: `01-docs/09-security/zero-trust-assessment.md`
