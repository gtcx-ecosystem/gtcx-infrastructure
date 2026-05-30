---
title: 'Bug Bounty Program — Activation Checklist'
status: 'draft'
date: '2026-05-27'
owner: 'infrastructure-security-team'
role: 'infrastructure-security-team'
tier: 'standard'
tags: ['security', 'compliance', 'operations']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Bug Bounty Program — Activation Checklist

**Classification:** Internal  
**Target Launch:** Post-SOC 2 Type 1  
**Budget:** $50,000–$100,000/year  
**Platform:** HackerOne (recommended) or Bugcrowd

---

## Pre-Launch Requirements

### 1. Policy Foundation

- [x] Vulnerability disclosure policy drafted (`docs/security/bug-bounty-policy.md`)
- [x] Safe Harbor language included (protects good-faith researchers from prosecution)
- [ ] Legal review complete (general counsel sign-off)
- [ ] Insurance confirmation (cyber liability covers bug bounty payouts)

### 2. Scope Definition

- [ ] In-scope assets documented with exact URLs, API endpoints, and mobile app versions
- [ ] Out-of-scope exclusions explicit (e.g., social engineering, physical attacks, third-party SaaS)
- [ ] Rate limits and testing boundaries defined (no automated vulnerability scanners without approval)
- [ ] Reward tiers defined:
  - Critical (RCE, authentication bypass, mass data exfiltration): $5,000–$15,000
  - High (SQL injection, XSS with session hijacking, IDOR): $2,000–$5,000
  - Medium (CSRF, information disclosure, DoS): $500–$2,000
  - Low (Missing security headers, verbose error messages): $100–$500

### 3. Triage Workflow

- [ ] Triage team assigned (2+ engineers with security clearance)
- [ ] Triage SLA defined:
  - First response: ≤48 hours
  - Severity assignment: ≤72 hours
  - Bounty decision: ≤14 days
  - Fix verification: ≤30 days
- [ ] Internal ticket template created (links to PagerDuty / Jira)
- [ ] Escalation path defined (when to engage on-call / legal / PR)

### 4. Technical Readiness

- [ ] Isolated bug bounty environment provisioned (staging replica with synthetic data)
- [ ] Network segmentation verified (researchers cannot pivot to production)
- [ ] Logging and monitoring enhanced for bounty activity (dedicated CloudWatch dashboard)
- [ ] Credential provisioning automated (time-limited test accounts via Vault dynamic secrets)
- [ ] Rollback procedure tested (can restore staging from clean snapshot in <15 minutes)

### 5. Platform Configuration

- [ ] HackerOne program profile created and reviewed
- [ ] Program visibility set (private launch → public after 90 days and 10 valid reports)
- [ ] Invitation-only researcher list curated (initial 50 researchers)
- [ ] Automated bounty payment pipeline configured (Stripe / PayPal integration)
- [ ] Disclosure policy set (coordinated disclosure, 90-day default)

### 6. Communications

- [ ] Launch blog post drafted (CEO + CISO approval)
- [ ] Internal all-hands briefing scheduled (engineering, support, legal)
- [ ] Customer communication plan ready (if a reported bug affects user data)
- [ ] Media response template prepared (for high-profile findings)

### 7. Governance

- [ ] Quarterly review cadence scheduled (CISO + Engineering Lead)
- [ ] Annual program health metrics defined:
  - Valid reports / total reports (target: ≥20%)
  - Mean time to bounty decision (target: ≤14 days)
  - Mean time to fix (target: ≤30 days for critical/high)
  - Cost per valid report (target: ≤$2,500)
- [ ] Board reporting template created (quarterly security committee update)

---

## Launch Sequence

| Phase | Timing     | Action                                                       | Owner                  |
| ----- | ---------- | ------------------------------------------------------------ | ---------------------- |
| 1     | T-30 days  | Legal review + insurance confirmation                        | Legal                  |
| 2     | T-21 days  | Platform configuration + researcher invites                  | Security               |
| 3     | T-14 days  | Internal briefing + staging environment hardening            | Platform Engineering   |
| 4     | T-7 days   | Dry-run triage exercise (simulate 3 reports)                 | Security + Engineering |
| 5     | T-0        | Private launch (50 invited researchers)                      | CISO                   |
| 6     | T+90 days  | Evaluate metrics; if ≥10 valid reports, transition to public | CISO                   |
| 7     | T+180 days | First quarterly review + program adjustments                 | Security               |

---

## Blockers

| Blocker                       | Impact                                       | Resolution Path                                                                |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| SOC 2 Type 1 not yet obtained | Cannot launch publicly (auditor requirement) | Track SOC 2 timeline; private launch may proceed earlier with legal approval   |
| Budget not yet approved       | Cannot pay bounties                          | Submit budget request for FY2027 security spend                                |
| No dedicated triage engineer  | SLA risk                                     | Hire or train internal engineer; consider HackerOne Managed Triage ($15K/year) |

---

## References

- Vulnerability Disclosure Policy: `docs/security/bug-bounty-policy.md`
- Data Classification Policy: `docs/compliance/data-classification-policy.md`
- Incident Response Playbook: `docs/security/security-architecture.md`
- Threat Model: `docs/security/threat-model.md`
