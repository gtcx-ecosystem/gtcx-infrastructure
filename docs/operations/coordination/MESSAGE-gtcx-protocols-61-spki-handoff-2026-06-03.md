---
title: 'MESSAGE — gtcx-protocols issue #61 SPKI handoff (XR-402 complete)'
status: sent
date: 2026-06-03
owner: gtcx-infrastructure
to: gtcx-protocols
issue: 'https://github.com/gtcx-ecosystem/gtcx-protocols/issues/61'
---

# Copy/paste — gtcx-protocols issue #61 (XR-402 complete)

````markdown
## XR-402 complete — gh-bog pilot (AI-native ceremony)

- **ceremony_id:** `INF-86-H02-GHBOG-2026`
- **kms_alias:** `alias/gtcx-production-sovereign-gh-bog`
- **algorithm:** `ECC_NIST_P256` / `ECDSA_SHA_256`
- **key_id:** `d44106a0-cb37-4225-b84d-bb8105eaaca5`
- **spki_sha256:** `86c66f12d0df81839d28ef1f2a1cce7a8c466e155ee0e2801edf5b28dfcdf1a0`
- **evidence_package:** `gtcx-infrastructure/docs/audit/evidence/inf-86/gh-bog-2026-06-03/`
- **approved_by:** `agent://gtcx-agentic/security-engineer-xr401` + `agent://gtcx-agentic/platform-architect-xr401` + `agent://gtcx-agentic/infrastructure-custodian-a-xr401b` + `agent://gtcx-agentic/infrastructure-custodian-b-xr401b` + witness

### SPKI handoff

DER file ready for secure transfer. Protocols to run:

```bash
pnpm coordination:xr-403-checklist --ceremony-id=ceremony:INF-86-H02-GHBOG-2026
```
````

Then: `kms-public-key-to-jwk.mjs` + `apply-production-authority-key.mjs --confirm`

### Infra tracker

[`gtcx-infrastructure/docs/audit/inf-86-ceremony-tracker.md`](https://github.com/gtcx-ecosystem/gtcx-infrastructure/blob/main/docs/audit/inf-86-ceremony-tracker.md)

```

---

*Posted 2026-06-03T13:51+02:00*
```
