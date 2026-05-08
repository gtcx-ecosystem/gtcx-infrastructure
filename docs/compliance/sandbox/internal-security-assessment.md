# GTCX Platform Internal Security Assessment

---

| Field              | Value                                               |
| ------------------ | --------------------------------------------------- |
| **Document Title** | GTCX Platform Internal Security Assessment          |
| **Version**        | 1.0                                                 |
| **Date**           | [YYYY-MM-DD]                                        |
| **Classification** | **CONFIDENTIAL**                                    |
| **Lead Assessor**  | [Full Name], [Role — e.g. Senior Platform Engineer] |
| **Peer Reviewer**  | [Full Name], [Role — e.g. Backend Engineer]         |
| **Distribution**   | Internal, Regulatory (sandbox application only)     |

---

## 1. Executive Summary

This report documents the findings of an internal security assessment conducted against the GTCX platform in preparation for regulatory sandbox participation. The assessment covered [N] systems across API, mobile, container, and infrastructure layers using a combination of automated scanning (DAST, SAST, SCA, container scanning) and manual testing aligned with the OWASP Testing Guide v4.2. Over a [2]-day assessment period, [N] findings were identified: [N] Critical, [N] High, [N] Medium, [N] Low, and [N] Informational. [N] findings have been remediated; [N] remain open with documented mitigation plans and target resolution dates. The overall security posture of the platform is [STRONG / ADEQUATE / REQUIRES IMPROVEMENT] for sandbox-stage operation.

---

## 2. Methodology

The assessment follows a structured methodology combining automated tooling with manual expert review, aligned to industry-recognized standards.

### 2.1 Standards and Frameworks

- **OWASP Testing Guide v4.2** — primary testing checklist and methodology
- **OWASP Top 10 (2021)** — risk-based prioritization of web application vulnerabilities
- **CWE/SANS Top 25** — supplementary classification of software weaknesses
- **CVSS v3.1** — severity scoring for all identified findings

### 2.2 Automated Tooling

| Tool      | Type                                        | Purpose                                                                                                 |
| --------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| OWASP ZAP | DAST (Dynamic Application Security Testing) | Automated crawling and active scanning of HTTP APIs and web endpoints                                   |
| Trivy     | Container & SCA                             | Container image vulnerability scanning, filesystem scanning, and SBOM generation (CycloneDX format)     |
| CodeQL    | SAST (Static Application Security Analysis) | Semantic code analysis with custom queries for cryptographic operations, injection paths, and data flow |
| npm audit | SCA (Software Composition Analysis)         | Dependency vulnerability scanning against the GitHub Advisory Database                                  |

### 2.3 Manual Testing

Two engineers performed cross-review manual testing over a 2-day period:

- Each engineer independently tested assigned OWASP categories
- Findings were cross-validated by the second engineer
- All manual tests followed the OWASP Testing Guide v4.2 procedures
- Business logic and cryptographic implementation tests were performed manually, as automated tools cannot reliably assess these areas

### 2.4 Environment

| Parameter          | Value                                          |
| ------------------ | ---------------------------------------------- |
| Target environment | [Staging / Pre-production]                     |
| Assessment dates   | [YYYY-MM-DD] to [YYYY-MM-DD]                   |
| Network position   | [Internal / External / Both]                   |
| Authentication     | [Authenticated and unauthenticated testing]    |
| Data               | [Synthetic test data — no production PII used] |

---

## 3. Scope

### 3.1 In Scope

| System                   | Type                 | Endpoints / Targets                                               |
| ------------------------ | -------------------- | ----------------------------------------------------------------- |
| Replay-Guard API         | REST API             | `/api/v1/replay/*` — nonce verification, envelope validation      |
| AGX Platform API         | REST API             | `/api/v1/agx/*` — trade operations, settlement endpoints          |
| Mobile App Endpoints     | REST API + WebSocket | Mobile-facing API gateway, push notification endpoints            |
| Kubernetes Cluster       | Infrastructure       | Pod security policies, RBAC, network policies, secrets management |
| Terraform Infrastructure | IaC                  | AWS/GCP resource configurations, IAM policies, security groups    |
| Container Images         | Runtime              | All production Docker images (base image CVEs, layer analysis)    |
| Dependencies             | Supply Chain         | npm dependency tree across all workspaces                         |

### 3.2 Out of Scope

The following areas were explicitly excluded from this assessment:

| Exclusion              | Rationale                                                              |
| ---------------------- | ---------------------------------------------------------------------- |
| Physical security      | Not applicable to cloud-hosted sandbox infrastructure                  |
| Social engineering     | Out of scope for technical security assessment                         |
| DDoS / availability    | Requires dedicated load testing infrastructure; planned separately     |
| Third-party SaaS       | Vendor security is assessed via vendor questionnaires, not pen-testing |
| Production environment | Assessment performed against staging; production is not yet deployed   |

---

## 4. Findings

### 4.1 Findings Summary

| Severity      | Count   | Fixed   | Open    | Accepted Risk |
| ------------- | ------- | ------- | ------- | ------------- |
| Critical      | [0]     | [0]     | [0]     | [0]           |
| High          | [0]     | [0]     | [0]     | [0]           |
| Medium        | [0]     | [0]     | [0]     | [0]           |
| Low           | [0]     | [0]     | [0]     | [0]           |
| Informational | [3]     | [0]     | [0]     | [3]           |
| **Total**     | **[3]** | **[0]** | **[0]** | **[3]**       |

### 4.2 Detailed Findings

| ID        | Title                                     | Severity      | CVSS  | Description                                                                                                                                                                                  | Affected Component | Remediation                                                                   | Status   | Evidence Ref                   |
| --------- | ----------------------------------------- | ------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- | -------- | ------------------------------ |
| SEC-001   | Missing `X-Content-Type-Options` header   | Informational | 0.0   | The API response does not include the `X-Content-Type-Options: nosniff` header. While API responses are JSON and not rendered in browsers, adding this header is a defense-in-depth measure. | AGX Platform API   | Add `X-Content-Type-Options: nosniff` to all API responses via middleware.    | Accepted | Appendix A, ZAP Alert ID 10021 |
| SEC-002   | Server version disclosure in HTTP headers | Informational | 0.0   | The `Server` response header discloses the web server software and version, which may assist an attacker in fingerprinting the technology stack.                                             | API Gateway        | Configure the reverse proxy to suppress or genericize the `Server` header.    | Accepted | Appendix A, ZAP Alert ID 10036 |
| SEC-003   | Missing `Cache-Control` on API responses  | Informational | 0.0   | Certain API responses do not set explicit `Cache-Control` headers. Sensitive responses could be cached by intermediate proxies.                                                              | Replay-Guard API   | Add `Cache-Control: no-store` to all API responses containing sensitive data. | Accepted | Manual Test OTG-SESS-005       |
| [SEC-004] | [Title]                                   | [Severity]    | [X.X] | [Description of the vulnerability, how it was discovered, and potential impact.]                                                                                                             | [Component]        | [Specific remediation steps with timeline.]                                   | [Status] | [Reference]                    |

---

## 5. Automated Scan Results Summary

### 5.1 OWASP ZAP — Dynamic Application Security Testing

| Severity | Alerts | False Positives | Confirmed |
| -------- | ------ | --------------- | --------- |
| High     | [0]    | [0]             | [0]       |
| Medium   | [0]    | [0]             | [0]       |
| Low      | [0]    | [0]             | [0]       |
| Info     | [0]    | [0]             | [0]       |

- **Scan mode:** [Active scan with authentication]
- **Spider coverage:** [N] URLs discovered, [N]% of known endpoints reached
- **Full report:** See Appendix A

### 5.2 Trivy — Container & Dependency Scanning

| Severity | Image Vulns | Filesystem Vulns | Fixed Available |
| -------- | ----------- | ---------------- | --------------- |
| Critical | [0]         | [0]              | [0]             |
| High     | [0]         | [0]              | [0]             |
| Medium   | [0]         | [0]              | [0]             |
| Low      | [0]         | [0]              | [0]             |

- **Images scanned:** [List images, e.g. `gtcx/replay-guard:latest`, `gtcx/agx-api:latest`]
- **SBOM generated:** CycloneDX format (see Appendix E)
- **Full report:** See Appendix B

### 5.3 CodeQL — Static Application Security Analysis

| Severity | Findings | False Positives | Confirmed |
| -------- | -------- | --------------- | --------- |
| Error    | [0]      | [0]             | [0]       |
| Warning  | [0]      | [0]             | [0]       |
| Note     | [0]      | [0]             | [0]       |

- **Languages analyzed:** [TypeScript, JavaScript]
- **Custom queries:** Cryptographic key handling, Ed25519 verification paths, nonce reuse detection
- **Full report:** See Appendix C

### 5.4 npm audit — Dependency Vulnerability Scanning

| Severity | Vulnerabilities | Direct Deps | Transitive Deps |
| -------- | --------------- | ----------- | --------------- |
| Critical | [0]             | [0]         | [0]             |
| High     | [0]             | [0]         | [0]             |
| Moderate | [0]             | [0]         | [0]             |
| Low      | [0]             | [0]         | [0]             |

- **Total packages audited:** [N]
- **Full report:** See Appendix D

---

## 6. OWASP Testing Guide v4.2 Checklist

| #   | Category                     | Tests Performed                                                                                                                                                                          | Result      | Notes   |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------- |
| 1   | **Information Gathering**    | OTG-INFO-001 through OTG-INFO-010: search engine discovery, web server fingerprinting, application entry point enumeration, application architecture mapping                             | [Pass/Fail] | [Notes] |
| 2   | **Configuration Management** | OTG-CONFIG-001 through OTG-CONFIG-008: TLS configuration, file extension handling, HTTP methods, security headers, cloud configuration review                                            | [Pass/Fail] | [Notes] |
| 3   | **Identity Management**      | OTG-IDENT-001 through OTG-IDENT-005: role definitions, user registration, account provisioning, account enumeration                                                                      | [Pass/Fail] | [Notes] |
| 4   | **Authentication**           | OTG-AUTHN-001 through OTG-AUTHN-010: credential transport, default credentials, lockout mechanisms, authentication bypass, JWT validation, DID-based auth                                | [Pass/Fail] | [Notes] |
| 5   | **Authorization**            | OTG-AUTHZ-001 through OTG-AUTHZ-004: directory traversal, privilege escalation (horizontal and vertical), IDOR testing                                                                   | [Pass/Fail] | [Notes] |
| 6   | **Session Management**       | OTG-SESS-001 through OTG-SESS-008: session token analysis, cookie attributes, session fixation, CSRF, session timeout, session puzzling                                                  | [Pass/Fail] | [Notes] |
| 7   | **Input Validation**         | OTG-INPVAL-001 through OTG-INPVAL-016: reflected/stored/DOM XSS, SQL injection, NoSQL injection, command injection, path traversal, SSRF, HTTP parameter pollution                       | [Pass/Fail] | [Notes] |
| 8   | **Error Handling**           | OTG-ERR-001 through OTG-ERR-004: error code analysis, stack trace disclosure, custom error page verification                                                                             | [Pass/Fail] | [Notes] |
| 9   | **Cryptography**             | OTG-CRYPST-001 through OTG-CRYPST-004: TLS cipher review, padding oracle, sensitive data in transit/at rest, Ed25519 signature verification, nonce entropy, replay protection mechanisms | [Pass/Fail] | [Notes] |
| 10  | **Business Logic**           | OTG-BUSLOGIC-001 through OTG-BUSLOGIC-009: data validation, request forgery, transaction integrity, rate limiting, workflow circumvention, replay attacks against trade operations       | [Pass/Fail] | [Notes] |
| 11  | **Client-Side**              | OTG-CLIENT-001 through OTG-CLIENT-012: DOM-based attacks, JavaScript execution, HTML injection, CSS injection, client-side resource manipulation, WebSocket security                     | [Pass/Fail] | [Notes] |
| 12  | **API Testing**              | OTG-API-001 through OTG-API-005: REST API testing, GraphQL testing (if applicable), rate limiting, input fuzzing, API versioning and deprecation handling                                | [Pass/Fail] | [Notes] |

---

## 7. Remediation Summary

| Severity      | Found | Fixed | Open | Accepted Risk | Target Date |
| ------------- | ----- | ----- | ---- | ------------- | ----------- |
| Critical      | [0]   | [0]   | [0]  | [0]           | [N/A]       |
| High          | [0]   | [0]   | [0]  | [0]           | [N/A]       |
| Medium        | [0]   | [0]   | [0]  | [0]           | [N/A]       |
| Low           | [0]   | [0]   | [0]  | [0]           | [N/A]       |
| Informational | [3]   | [0]   | [0]  | [3]           | [N/A]       |

All Critical and High severity findings, if any, must be remediated or have a documented mitigation plan with a defined target date before sandbox deployment. Medium severity findings should be addressed within 30 days of sandbox activation. Low and Informational findings are tracked for continuous improvement.

---

## 8. Conclusion and Recommendations

### 8.1 Overall Assessment

[One to two paragraphs summarizing the security posture. Address whether the platform is suitable for sandbox deployment. Note any systemic issues or architectural concerns. Highlight areas of strength, e.g. cryptographic implementation, replay protection design, container hardening.]

### 8.2 Recommendations

1. **[Recommendation Title]** — [Brief description of the recommendation and its priority.]
2. **[Recommendation Title]** — [Brief description of the recommendation and its priority.]
3. **[Recommendation Title]** — [Brief description of the recommendation and its priority.]
4. **Continuous security testing** — Integrate ZAP, Trivy, and CodeQL into the CI/CD pipeline to run on every pull request, ensuring that new vulnerabilities are detected before deployment.
5. **Periodic reassessment** — Conduct this assessment quarterly, or upon any significant architectural change, to maintain the security baseline required for sandbox operation.

---

## 9. Sign-off

| Role          | Name        | Signature          | Date         |
| ------------- | ----------- | ------------------ | ------------ |
| Lead Assessor | [Full Name] | ******\_\_\_****** | [YYYY-MM-DD] |
| Peer Reviewer | [Full Name] | ******\_\_\_****** | [YYYY-MM-DD] |
| CTO           | [Full Name] | ******\_\_\_****** | [YYYY-MM-DD] |

By signing, the Lead Assessor and Peer Reviewer confirm that the findings in this report are accurate and complete to the best of their knowledge. The CTO acknowledges the findings and approves the remediation plan.

---

## 10. Appendices

| Appendix | Title                      | Format    | Description                                                                                          |
| -------- | -------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| A        | OWASP ZAP Full Report      | HTML      | Complete ZAP scan report including all alerts, request/response evidence, and risk ratings           |
| B        | Trivy Scan Report          | SARIF     | Container image and filesystem vulnerability scan results in SARIF format for toolchain integration  |
| C        | CodeQL Analysis Report     | SARIF     | Static analysis findings including custom cryptographic queries, in SARIF format                     |
| D        | npm audit Report           | JSON      | Full dependency audit output (`npm audit --json`)                                                    |
| E        | Software Bill of Materials | CycloneDX | Complete SBOM in CycloneDX JSON format, generated by Trivy, covering all production container images |

---

_This document is classified CONFIDENTIAL and is intended solely for the use of GTCX internal security review and regulatory sandbox application. Distribution outside of these purposes requires written authorization from the CTO._
