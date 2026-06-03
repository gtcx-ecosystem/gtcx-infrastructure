---
status: current
date: 2026-06-02
owner: gtcx-infrastructure
---

# INF-86 Execution Plan — Sovereign HSM Production Keys

> **Tracker:** gtcx-infrastructure#86  
> **Blocked by:** Leadership approval for `GTCX-KEY-CEREMONY`  
> **Blocks:** gtcx-protocols#61 (key_status: production)  
> **Date:** 2026-06-02  
> **Agent:** gtcx-infrastructure

---

## 1. Goal

Provision HSM-backed asymmetric signing keys for all 43 sovereign authority DIDs so that `gtcx.key_status` can flip from `"placeholder"` to `"production"` (protocols #61).

---

## 2. Architecture Decision — Algorithm

| Option          | Algorithm     | HSM Backing                   | Cost                  | Impact                                                       |
| --------------- | ------------- | ----------------------------- | --------------------- | ------------------------------------------------------------ |
| **A (default)** | ECC_NIST_P256 | AWS KMS (FIPS 140-2 L2)       | $0 incremental        | Requires updating DID docs from Ed25519 → ECDSA (cross-repo) |
| **B**           | Ed25519       | AWS CloudHSM (FIPS 140-2 L3)  | ~$2,100/month HA pair | No DID doc changes; highest security                         |
| **C**           | Ed25519       | Software (K8s Secrets + IRSA) | $0                    | Not acceptable for production sovereign claims               |

**Recommendation:** Start with **Option A** (KMS + ECDSA) for pilot authorities, then migrate to CloudHSM Ed25519 if regulator engagement requires L3. The `kms-sovereign-signing` module supports either via `key_spec` variable.

**Decision owner:** CISO + platform-lead (human approval required).

---

## 3. Terraform Infrastructure — Status

### New Module: `infra/terraform/modules/kms-sovereign-signing/`

- Multi-key KMS signing module using `for_each`
- Per-authority: key, alias, IAM policy, CloudWatch alarm, SSM parameters
- Least-privilege key policies
- Deletion protection + rotation tracking tags

### Production Configuration

Added to `infra/terraform/environments/production/main.tf`:

```hcl
module "kms_sovereign_signing" {
  source = "../../modules/kms-sovereign-signing"
  authorities = {
    "gh-bog" = {
      label             = "Ghana Bogoso"
      key_spec          = "ECC_NIST_P256"
      signing_algorithm = "ECDSA_SHA_256"
      signing_role_arns = [module.irsa_platform.platforms_role_arn]
    }
    # ... expand to 43 authorities after pilot
  }
}
```

**Validation:** `terraform validate` passes for the new module.

---

## 4. Ceremony Procedure

### Prerequisites

- [ ] CISO + platform-lead approve algorithm choice (§2)
- [ ] Two authorized key custodians identified and available
- [ ] One independent witness (security officer or external auditor)
- [ ] Video recording equipment + tamper-evident S3 bucket
- [ ] AWS CloudTrail active in `af-south-1`
- [ ] Terraform plan reviewed and PR merged
- [ ] Incident response plan accessible

### Pilot Ceremony (1 authority — rehearsal)

```bash
# Step 1: Verify identities
cd infra/terraform/environments/production

# Step 2: Plan
terraform plan -target=module.kms_sovereign_signing -out=sovereign.tfplan

# Step 3: Custodian A applies
terraform apply sovereign.tfplan

# Step 4: Custodian B verifies
aws kms describe-key --key-id alias/gtcx-production-sovereign-gh-bog
aws kms get-key-policy --key-id alias/gtcx-production-sovereign-gh-bog

# Step 5: Export public key for DID document
aws kms get-public-key --key-id alias/gtcx-production-sovereign-gh-bog \
  --query 'PublicKey' --output text | base64 -d > gh-bog.pub.der
# Convert to JWK or publicKeyMultibase for protocols #61

# Step 6: All participants sign ceremony log
# Step 7: Upload video to s3://gtcx-production-ceremonies/YYYY-MM-DD/
```

### Full Ceremony (43 authorities)

Repeat pilot procedure for each authority, or batch by region:

- West Africa: gh-bog, gh-tar, ci-abj, sn-dkr, ml-bko, bf-oua, ng-abu, ng-lag
- East Africa: et-add, ke-nbo, tz-dar, ug-kla, rw-kgl, cd-fih
- Southern Africa: za-jnb, zm-lun, zw-hre, bw-gbe, na-wdh, mz-map
- DRC / Central: cd-fih, cg-bzv, ga-lbv, cm-yao, td-ndj, cf-bgf, ss-jub
- Others: br-bsb, pe-lim, co-bog, id-jkt, ph-mnl, in-bom, au-per

**Batch size:** Max 10 authorities per ceremony to limit blast radius.

---

## 5. DID Document Update (protocols #61)

After each ceremony, protocols team must:

1. Extract public key from KMS
2. Encode as `publicKeyMultibase` (or `publicKeyJwk` if schema changes)
3. Update `country-support-packages/<iso>/v1.0.0/authorities/<slug>.json`
4. Flip `gtcx.key_status` from `"placeholder"` to `"production"`
5. Commit with ceremony evidence (log, video hash, Terraform plan)

---

## 6. Rollback / Emergency Revocation

```bash
# Disable a compromised sovereign key
aws kms disable-key --key-id alias/gtcx-production-sovereign-<authority>

# Generate emergency replacement (expedited ceremony: single custodian + CISO)
# Update alias to replacement key
aws kms update-alias \
  --alias-name alias/gtcx-production-sovereign-<authority> \
  --target-key-id <replacement-key-id>

# Notify stakeholders per IRP SLAs
```

---

## 7. Evidence Package

Per ceremony, retain for 7 years:

1. Signed ceremony log
2. Video recording (tamper-evident S3)
3. CloudTrail events (`CreateKey`, `PutKeyPolicy`, `CreateAlias`)
4. Terraform plan output
5. Key metadata (`describe-key`)
6. Witness attestation
7. Public key export (for DID document provenance)

---

## 8. Next Steps

| Step                                | Owner                | ETA                                 |
| ----------------------------------- | -------------------- | ----------------------------------- |
| Algorithm decision (§2)             | CISO + platform-lead | 3–5 days                            |
| Identify custodians + witness       | Compliance lead      | 1 week                              |
| Schedule pilot ceremony             | Infra + compliance   | 2 weeks                             |
| Execute pilot (gh-bog)              | Custodians           | 1 day                               |
| Protocols updates DID + key_status  | gtcx-protocols       | 3–5 days after pilot                |
| Schedule full 43-authority ceremony | Infra + compliance   | 4–8 weeks                           |
| Close infra #86                     | Infra                | After full ceremony evidence posted |
| Close protocols #61                 | Protocols            | After all 43 DIDs updated           |

---

## 9. Risks

| Risk                           | Likelihood | Impact | Mitigation                                      |
| ------------------------------ | ---------- | ------ | ----------------------------------------------- |
| Ed25519 required, KMS rejected | Medium     | High   | Pre-approved CloudHSM budget; modular terraform |
| Custodian unavailability       | Medium     | Medium | Named alternates; batch scheduling              |
| Region outage during ceremony  | Low        | High   | Multi-AZ; ceremony can be rescheduled           |
| DID schema misalignment        | Medium     | High   | Confirm with protocols BEFORE pilot             |
| 43 keys = high KMS cost        | Low        | Low    | $1/key/month = $43/month; negligible            |
