---
title: 'Signed Git Commits Policy'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Signed Git Commits Policy

**Purpose:** Ensure all code changes are cryptographically attributable to verified developers.
**Compliance:** SOC 2 CC6.1 (Logical Access), ISO 27001 A.9.4.2, FFIEC Change Management
**Effective date:** TBD (enforce after all maintainers enrolled)

---

## Requirements

1. **All commits to `main` must be signed** (GPG or SSH signature)
2. **All tags must be signed** (annotated tags with GPG signature)
3. **Branch protection enforces signature verification** on `main` and `release/*`
4. **Hardware-backed keys recommended** (YubiKey, Titan Security Key)

---

## Setup Instructions

### Option A: SSH Signing (Recommended)

```bash
# 1. Generate SSH signing key (or use existing)
ssh-keygen -t ed25519 -C "developer@gtcx.io" -f ~/.ssh/gtcx_signing

# 2. Configure Git to use SSH signing
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/gtcx_signing.pub
git config --global commit.gpgsign true
git config --global tag.gpgsign true

# 3. Upload public key to GitHub
#    Settings → SSH and GPG keys → New SSH key → Signing Key
```

### Option B: GPG Signing (YubiKey)

```bash
# 1. Generate GPG key on YubiKey
gpg --card-edit
# 2. Configure Git
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true
git config --global tag.gpgsign true

# 3. Upload public key to GitHub
gpg --armor --export <KEY_ID> | pbcopy
# Settings → SSH and GPG keys → New GPG key
```

---

## GitHub Branch Protection Rules

Apply to `main` and `release/*`:

```json
{
  "required_signatures": true,
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci"]
  },
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "enforce_admins": true
}
```

### Implementation via GitHub CLI

```bash
gh api repos/gtcx-ecosystem/gtcx-infrastructure/branches/main/protection \
  --method PUT \
  --field required_signatures=true \
  --field enforce_admins=true
```

---

## Key Management

| Requirement  | Policy                                                   |
| ------------ | -------------------------------------------------------- |
| Key type     | Ed25519 (SSH) or RSA-4096 (GPG)                          |
| Key storage  | Hardware key preferred; encrypted disk minimum           |
| Key rotation | Annual or on compromise                                  |
| Revocation   | Remove from GitHub immediately; notify team              |
| Recovery     | New key generated; old commits retain original signature |

---

## Enforcement Timeline

| Phase               | Timeline | Action                                     |
| ------------------- | -------- | ------------------------------------------ |
| 1. Education        | Week 1-2 | All developers set up signing keys         |
| 2. Soft enforcement | Week 3-4 | CI warns on unsigned commits               |
| 3. Hard enforcement | Week 5+  | Branch protection rejects unsigned commits |

---

## Verification

```bash
# Verify a commit signature
git log --show-signature -1

# Verify all commits on a branch
git log --show-signature main..HEAD

# CI verification (add to .github/workflows/ci.yml)
# - name: Verify commit signatures
#   run: |
#     UNSIGNED=$(git log --format='%H %G?' origin/main..HEAD | grep -v ' G$' | grep -v ' U$')
#     if [ -n "$UNSIGNED" ]; then
#       echo "Unsigned commits found:" && echo "$UNSIGNED" && exit 1
#     fi
```

---

_Last updated: 2026-05-08_
