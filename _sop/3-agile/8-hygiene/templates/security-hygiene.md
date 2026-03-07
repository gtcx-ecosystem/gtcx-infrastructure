# Security Hygiene

## Purpose

Managing secrets, credentials, and access tokens safely across all environments. This checklist ensures that sensitive material never leaks into source control, all credentials are properly scoped and rotated, and incident response procedures are in place.

## Standards

1. **No secrets in code, commits, or environment files checked into git.** All `.env` files must be in `.gitignore`. Only `.env.example` (with placeholder values) is committed.
2. **All secrets stored in a secrets manager.** Use GCP Secret Manager, HashiCorp Vault, AWS Secrets Manager, or equivalent. No secrets in plaintext config files.
3. **API keys scoped to minimum required permissions.** Each key should have the narrowest access scope necessary for its function.
4. **Rotation schedule for all credentials.** Every secret, token, and key must have a defined rotation period and an owner responsible for rotation.
5. **Service accounts over personal accounts for CI/CD.** Automated pipelines must use dedicated service accounts, never individual developer credentials.
6. **Git history clean.** If a secret was ever committed, it must be rotated immediately. The commit history should be scrubbed or the secret treated as compromised.

## Checklist

### Secrets Management

- [ ] No hardcoded secrets in source code (API keys, passwords, tokens, connection strings)
- [ ] `.env` is listed in `.gitignore` for every project
- [ ] `.env.example` is committed with placeholder values for all required variables
- [ ] Secrets manager configured and accessible by application runtime
- [ ] Git history audited for past secret commits (`gitleaks`, `truffleHog`, `git-secrets`)
- [ ] Pre-commit hook installed to block secret commits (`gitleaks --pre-commit`)

### API Keys

- [ ] Each API key is scoped to minimum required permissions
- [ ] Separate keys per environment (development, staging, production)
- [ ] Key rotation schedule defined and documented (see Rotation Schedule below)
- [ ] Unused or deprecated keys revoked
- [ ] Key usage monitored for anomalies

### Auth Tokens

- [ ] JWT expiry configured to a reasonable duration ({expiry-duration})
- [ ] Refresh token rotation implemented (one-time use refresh tokens)
- [ ] Token revocation capability in place (blocklist or short-lived tokens)
- [ ] Tokens transmitted only over HTTPS
- [ ] Token payloads do not contain sensitive data (passwords, full PII)

### Environment Variables

- [ ] `.env.example` is up to date with all required variables
- [ ] No default values for secrets in code (fail loudly if unset)
- [ ] Environment variable validation runs on application startup
- [ ] Sensitive variables not logged or included in error reports
- [ ] Environment-specific overrides documented

### CI/CD Pipeline Security

- [ ] Secrets injected via pipeline variables or secrets manager (never committed to code)
- [ ] Secrets never printed in build logs
- [ ] Secret values masked in CI/CD output
- [ ] Pipeline service accounts use dedicated credentials with minimum scope
- [ ] Pipeline configuration files do not contain inline secrets
- [ ] Artifacts and build caches do not contain secrets

### Access Control

- [ ] Two-factor authentication (2FA) enabled on all service accounts
- [ ] Principle of least privilege applied to all access grants
- [ ] Quarterly access review conducted — stale accounts removed
- [ ] Shared credentials eliminated (each person/service has their own)
- [ ] Admin access restricted and requires approval workflow
- [ ] Offboarding process includes credential revocation

## Rotation Schedule

| Secret / Token        | Location               | Rotation Period | Last Rotated | Next Rotation | Owner        |
| --------------------- | ---------------------- | --------------- | ------------ | ------------- | ------------ |
| {secret-name}         | {secrets-manager-path} | {30d/90d/180d}  | {YYYY-MM-DD} | {YYYY-MM-DD}  | {owner-name} |
| {api-key-name}        | {secrets-manager-path} | {30d/90d/180d}  | {YYYY-MM-DD} | {YYYY-MM-DD}  | {owner-name} |
| {database-password}   | {secrets-manager-path} | {30d/90d/180d}  | {YYYY-MM-DD} | {YYYY-MM-DD}  | {owner-name} |
| {service-account-key} | {secrets-manager-path} | {30d/90d/180d}  | {YYYY-MM-DD} | {YYYY-MM-DD}  | {owner-name} |

## Incident Response — Secret Exposure

If a secret is exposed (committed to git, logged, shared insecurely, or otherwise leaked), take these steps immediately:

### Immediate Actions (within 1 hour)

- [ ] **Rotate the exposed secret.** Generate a new credential and deploy it to all services that depend on it.
- [ ] **Revoke the old secret.** Disable or delete the compromised credential so it can no longer be used.
- [ ] **Audit access logs.** Check whether the exposed secret was used by an unauthorized party during the exposure window.
- [ ] **Notify the security team.** File an incident report with details of what was exposed, where, and for how long.

### Follow-up Actions (within 24 hours)

- [ ] **Scrub git history** if the secret was committed (use `git filter-repo` or `BFG Repo-Cleaner`). Force-push only with team coordination.
- [ ] **Review blast radius.** Determine what systems, data, or users could have been affected.
- [ ] **Update monitoring.** Add alerts for the exposed credential type to prevent recurrence.
- [ ] **Conduct a brief retrospective.** Document root cause, impact, and preventive measures.
- [ ] **Update this checklist** if the exposure revealed a gap in the current process.
