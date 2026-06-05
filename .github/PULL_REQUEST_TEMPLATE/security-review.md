## Security Review

> Required for any PR touching: authentication, cryptography, API endpoints, data storage, infrastructure-as-code, or network configuration.

### Change Summary

**What does this PR change?**

<!-- Brief description of the security-relevant change -->

**Components affected:**

<!-- List services, modules, or infrastructure components -->

---

### STRIDE Assessment

Complete the checklist below. For each applicable threat, describe the mitigation in the notes column. If a full threat model is required, link it.

| Category                                      | Applicable?      | Mitigation / Notes |
| --------------------------------------------- | ---------------- | ------------------ |
| **S** — Spoofing (identity forgery)           | [ ] Yes / [ ] No | <!-- describe -->  |
| **T** — Tampering (data modification)         | [ ] Yes / [ ] No | <!-- describe -->  |
| **R** — Repudiation (deniability)             | [ ] Yes / [ ] No | <!-- describe -->  |
| **I** — Information Disclosure (data leak)    | [ ] Yes / [ ] No | <!-- describe -->  |
| **D** — Denial of Service (availability)      | [ ] Yes / [ ] No | <!-- describe -->  |
| **E** — Elevation of Privilege (authz bypass) | [ ] Yes / [ ] No | <!-- describe -->  |

**Full threat model required?** [ ] Yes — link: \***\*\_\*\*** / [ ] No — change is low risk

---

### Security Checklist

- [ ] No secrets, credentials, or API keys in this diff
- [ ] Input validation applied to all new user-controlled inputs
- [ ] Error responses do not leak internal state or stack traces
- [ ] New dependencies have been reviewed for known vulnerabilities
- [ ] Database queries use parameterized statements (no string concatenation)
- [ ] New API endpoints have authentication and authorization checks
- [ ] Logging does not include PII or sensitive data
- [ ] If IaC: least-privilege IAM, no wildcard permissions
- [ ] If crypto: uses approved algorithms (see `01-docs/09-security/security-architecture.md`)

---

### Trust Boundary Changes

Does this PR introduce, modify, or remove a trust boundary?

- [ ] No trust boundary changes
- [ ] Yes — describe below:

<!-- If yes: what boundary changed, what authentication/authorization governs it, and has the threat model been updated? -->

---

### Sign-off

- [ ] **Security champion review** — @\***\*\_\*\*** has reviewed the STRIDE assessment and security checklist

**Reviewer notes:**

<!-- Security champion adds notes here during review -->
