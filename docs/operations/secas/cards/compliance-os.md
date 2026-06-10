# SECaaS card — compliance-os

**Friction:** `SEC-IRSA-01` · **DaaS overlap:** `F2` (GHCR imagePullSecrets)

## Stack security actions (gtcx-infrastructure)

1. Review IRSA roles for `compliance-os-staging` service accounts
2. Confirm `compliance-os-ghcr-pull` ExternalSecret synced
3. Patch all GHCR deployments with `imagePullSecrets` (DAAS-S3-01 / F2)

## Product handoff

When app-level control changes: `compliance-os/docs/operations/to-gtcx-infrastructure-{topic}-YYYY-MM-DD.md`

## Re-probe

After `from-gtcx-infrastructure-*` seal **delivered** — re-run compliance staging smoke.
