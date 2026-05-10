# GTCX Bug Bounty Program Policy

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

## Program Overview

GTCX operates a vulnerability disclosure and bug bounty program to incentivize responsible security research across our platform. We value the security community's contributions and commit to working collaboratively with researchers who report vulnerabilities in good faith.

## Scope

### In Scope

| Asset                        | Type                 | Description                                        |
| ---------------------------- | -------------------- | -------------------------------------------------- |
| replay-guard API             | API                  | Replay protection service and all public endpoints |
| AGX Platform                 | Web Application      | Africa Gold Exchange trading platform              |
| GTCX Mobile App              | Mobile (iOS/Android) | Mobile trading and verification application        |
| Infrastructure               | Cloud/K8s            | Public-facing infrastructure, ingress, APIs        |
| Authentication/Authorization | Service              | SSO, MFA, token issuance, session management       |
| Verification Protocols       | API                  | TradePass, GeoTag, GCI, VaultMark, PvP, PANX       |

### Out of Scope

- Social engineering attacks against GTCX employees or contractors
- Denial of service (DoS/DDoS) attacks
- Physical attacks against GTCX offices, data centers, or personnel
- Attacks against third-party services or vendors not owned by GTCX
- Automated scanning that degrades service performance (coordinate with security@gtcx.io first)
- Findings from automated tools without demonstrated exploitability
- Vulnerabilities in out-of-date browsers or platforms
- Reports of missing security headers without demonstrated impact
- SPF/DKIM/DMARC configuration issues without demonstrated exploit chain

## Severity and Rewards

| Severity | CVSS Range | Reward           | Examples                                                                                                                                              |
| -------- | ---------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | 9.0 - 10.0 | $5,000 - $10,000 | RCE, authentication bypass, SQL injection leading to data exfiltration, private key exposure, unauthorized fund transfer                              |
| High     | 7.0 - 8.9  | $2,000 - $5,000  | Privilege escalation, IDOR with sensitive data access, stored XSS on authenticated pages, SSRF to internal services                                   |
| Medium   | 4.0 - 6.9  | $500 - $2,000    | CSRF on state-changing actions, reflected XSS, information disclosure of internal architecture, insecure direct object references with limited impact |
| Low      | 0.1 - 3.9  | $100 - $500      | Verbose error messages, minor information leakage, missing rate limiting on non-critical endpoints                                                    |

Reward amounts within each tier are determined based on:

- Impact to user data, funds, or platform integrity
- Quality of the report and proof of concept
- Novelty of the attack vector

## Triage SLA

| Stage                    | SLA      |
| ------------------------ | -------- |
| Acknowledgment of report | 24 hours |
| Severity assignment      | 48 hours |
| Critical fix deployed    | 30 days  |
| High fix deployed        | 60 days  |
| Medium/Low fix deployed  | 90 days  |

If a fix requires more time, GTCX will communicate the revised timeline and rationale to the researcher.

## Responsible Disclosure Policy

- Researchers must allow GTCX 90 days from the date of severity assignment to remediate the vulnerability before any public disclosure.
- GTCX will coordinate disclosure timing with the researcher and credit them (unless anonymity is requested).
- If GTCX fails to remediate within 90 days without communicating a revised timeline, the researcher may disclose at their discretion.
- Partial mitigations count toward the timeline only if they materially reduce risk.

## Safe Harbor

GTCX will not initiate legal action against researchers who:

- Act in good faith and follow this policy
- Avoid accessing, modifying, or deleting data belonging to other users
- Do not degrade the availability of GTCX services
- Report vulnerabilities exclusively to security@gtcx.io (or the designated platform)
- Do not publicly disclose vulnerability details before the agreed disclosure date
- Do not use discovered vulnerabilities for personal gain beyond the bounty reward

GTCX considers security research conducted under this policy to be authorized and will not pursue civil or criminal action. If legal action is initiated by a third party, GTCX will take steps to make it known that the researcher's activities were conducted in compliance with this policy.

## Submission Process

1. Submit findings via the designated platform (see Platform section below) or email security@gtcx.io
2. Include a clear description of the vulnerability, affected asset, and reproduction steps
3. Provide proof of concept (screenshots, HTTP requests, scripts) demonstrating exploitability
4. Do not include sensitive data (passwords, PII) in reports -- redact appropriately
5. One vulnerability per report unless chaining is required to demonstrate impact

## Platform Options

### Option A: HackerOne

- Managed triage available (HackerOne triage team handles initial validation)
- Established researcher community (800K+ registered hackers)
- Structured signal and reputation system reduces noise
- Estimated platform cost: $15K-$25K/year (managed triage tier)

### Option B: Bugcrowd

- CrowdMatch researcher matching based on asset type
- Integrated with common vulnerability scanners
- Vulnerability rating taxonomy (VRT) for consistent severity assessment
- Estimated platform cost: $12K-$20K/year (standard tier)

**Recommendation:** HackerOne managed triage for initial launch to reduce internal triage burden during program ramp-up. Re-evaluate after 12 months based on report volume and quality.

## Annual Budget

| Line Item             | Estimated Cost         |
| --------------------- | ---------------------- |
| Bounty payouts        | $30,000 - $60,000      |
| Platform fees         | $15,000 - $25,000      |
| Internal triage labor | $5,000 - $15,000       |
| **Total**             | **$50,000 - $100,000** |

Budget is reviewed quarterly based on report volume and payout trends. Unused bounty allocation rolls forward to the next quarter.

## Hall of Fame

Researchers who submit valid, unique vulnerabilities are recognized in the GTCX Security Hall of Fame (published on the program page) unless they request anonymity. Recognition includes:

- Name and optional affiliation
- Severity tier of the finding
- Date of discovery
- Custom GTCX security researcher badge (for critical/high findings)

## Contact

- Primary: security@gtcx.io
- PGP key: Published on the program platform page and at https://gtcx.io/.well-known/security.txt
- Response hours: Monday-Friday, 09:00-18:00 EAT (UTC+3)
- Emergency (critical severity): Monitored 24/7 via PagerDuty escalation
