---
title: 'Terraform Registry Submission — terraform-aws-compliance-db'
status: 'draft'
date: '2026-05-27'
owner: 'devops-lead'
tier: 'standard'
tags: ['external', 'terraform-registry', 'distribution']
review_cycle: 'on-change'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Terraform Registry Submission — `terraform-aws-compliance-db`

Submission package + verification checklist for listing the module on `registry.terraform.io`.

## Source repository

- **GitHub:** https://github.com/amani-amina-anai/terraform-aws-compliance-db
- **Latest commit:** verify before submission with `gh repo view amani-amina-anai/terraform-aws-compliance-db --json defaultBranchRef`
- **MIT license:** ✅ confirmed

## Registry requirements (per registry.terraform.io/docs/registry/modules/publish)

| #   | Requirement                                     | Status        | Evidence                                                                                |
| --- | ----------------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| 1   | Repo name format: `terraform-<PROVIDER>-<NAME>` | ✅            | `terraform-aws-compliance-db` matches                                                   |
| 2   | Description in repo About                       | ⚠️ verify     | Should be "Compliance-ready dual-database infrastructure for regulated African fintech" |
| 3   | Standard module structure                       | ⚠️ verify     | Must have `main.tf`, `variables.tf`, `outputs.tf` at root                               |
| 4   | README.md with usage                            | ⚠️ verify     | Must include `## Usage`, `## Inputs`, `## Outputs`, `## Resources`                      |
| 5   | Semver Git tag                                  | ⚠️ tag needed | Tag `v0.1.0` (or `0.1.0`) must exist on the default branch                              |
| 6   | No private dependencies                         | ✅            | Module only depends on `hashicorp/aws`                                                  |
| 7   | `terraform fmt -check -recursive` passes        | ⚠️ verify     | Run on the standalone repo before tagging                                               |
| 8   | `terraform validate` passes                     | ⚠️ verify     | Run on the standalone repo before tagging                                               |

## Pre-submission verification commands

Run these against the standalone repo (`github.com/amani-amina-anai/terraform-aws-compliance-db`):

```bash
# Clone fresh
git clone https://github.com/amani-amina-anai/terraform-aws-compliance-db.git
cd terraform-aws-compliance-db

# 1. Format
terraform fmt -check -recursive
# Expected: empty output (clean)

# 2. Validate
terraform init -backend=false
terraform validate
# Expected: "Success! The configuration is valid."

# 3. README structure
grep -c "^## Usage" README.md      # expected: 1
grep -c "^## Inputs" README.md     # expected: 1
grep -c "^## Outputs" README.md    # expected: 1
grep -c "^## Resources" README.md  # expected: 1

# 4. Repo metadata
gh repo view --json description,licenseInfo,defaultBranchRef
# Expected: description present, license MIT, default branch main

# 5. No private deps
grep -rE "source\s*=\s*\"[^\"]*://[^\"]*\"" *.tf
# Expected: only public sources (registry.terraform.io/...)
```

## Submission steps

Once the verification commands all pass:

1. **Tag the release** on the standalone repo:

   ```bash
   git tag -a v0.1.0 -m "Initial Terraform Registry release"
   git push origin v0.1.0
   ```

2. **Sign in to Terraform Registry** at https://registry.terraform.io/ via GitHub OAuth.

3. **Add module** → "Publish Module" → select `terraform-aws-compliance-db` from the GitHub repo list.

4. **Registry processes the tag** automatically (usually < 60s). Listing appears at:

   ```
   https://registry.terraform.io/modules/amani-amina-anai/compliance-db/aws/latest
   ```

5. **Verify install** from a clean directory:
   ```bash
   mkdir test && cd test
   cat > main.tf <<EOF
   module "compliance_db" {
     source       = "amani-amina-anai/compliance-db/aws"
     version      = "~> 0.1.0"
     jurisdiction = "zimbabwe"
     environment  = "dev"
     # plus required networking inputs
   }
   EOF
   terraform init
   # Expected: "Initializing modules... - compliance_db in .terraform/modules/compliance_db"
   ```

## Gap analysis (standalone repo vs Registry requirements)

This subsection captures the deltas between the current state of the standalone repo and the Registry's strict requirements. Each gap requires a small PR before submission.

| Gap                                                            | Required action                                                        | Owner  | Estimated effort |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- | ------ | ---------------- |
| README.md may lack `## Resources` section                      | Add a Resources table listing all `aws_*` resources the module creates | DevOps | 30 min           |
| `terraform fmt -check` may report drift on the standalone repo | Run `terraform fmt -recursive` and commit                              | DevOps | 5 min            |
| No semver tag exists yet                                       | Tag `v0.1.0` after fmt + README updates land                           | DevOps | 5 min            |
| Module description in GitHub About is generic                  | Update repo description to match registry positioning                  | DevOps | 5 min            |

**Total effort to submission-ready:** ~45 minutes.

## Post-submission monitoring

After listing, capture:

- First-week downloads via `https://registry.terraform.io/v1/modules/amani-amina-anai/compliance-db/aws/<version>/downloads`
- GitHub stars / forks on the standalone repo
- Any opened issues from external users

Surfaced via the `distribution-snapshot.mjs` script (INT-C-4) for daily comparison.

## References

- Terraform Registry publishing docs: https://developer.hashicorp.com/terraform/registry/modules/publish
- Module versioning: https://developer.hashicorp.com/terraform/registry/modules/publish#releasing-new-versions
- README conventions: https://developer.hashicorp.com/terraform/language/modules/develop/structure
