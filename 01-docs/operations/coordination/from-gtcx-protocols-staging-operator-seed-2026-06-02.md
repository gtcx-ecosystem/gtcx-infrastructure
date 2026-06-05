---
title: 'Coordination — Infra staging operator DID deploy (DONE)'
status: done
date: 2026-06-02
updated: 2026-06-03
owner: gtcx-infrastructure
role: platform-engineer
tier: critical
tags: ['coordination', 'infrastructure', 'staging', 'tradepass', 'did']
review_cycle: on-change
related:
  - ../../../gtm/handoffs/staging-audit-e2e-credentials-2026-06-02.md
---

# Coordination — Infra staging operator DID deploy (DONE)

**From:** gtcx-protocols  
**To:** gtcx-infrastructure  
**Subject:** Staging deploy — operator DID seed + `publicKeyJwk` GET (protocols `6ef3b423`)

## Status

✅ **COMPLETE** — native protocols image deployed; static DID resolver bridge retired from `/v1/tradepass` path.

## What was deployed

1. **Image:** `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-protocols:v0.4.6` (commit `0dceb8b6`, includes `6ef3b423` + JWK handoff fix)
2. **Boot seed env:**
   - `GTCX_STAGING_TRADEPASS_SEED=1`
   - `GTCX_STAGING_TRADEPASS_FIXTURES_PATH=server/fixtures/staging-tradepass-operators.json`
3. **API key:** K8s secret `gtcx-protocols-api-key-staging` wired as `GTCX_API_KEY`
   - Scopes: `admin:audit,protocol:read,protocol:write`
4. **Ingress:** `/v1/tradepass` now routes to `gtcx-protocols-staging:8300` (was `did-resolver-staging:8080`)

## Smoke verification

```bash
export API=https://api.staging.gtcx.trade
export GTCX_API_KEY='<from gtcx-protocols-api-key-staging>'
export DID=did:gtcx:tp_staging_e2e_001

curl -sS -A "Mozilla/5.0" -H "Authorization: Bearer $GTCX_API_KEY" \
  "$API/v1/tradepass/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$DID', safe=''))")" \
  | jq '.verificationMethod[0].publicKeyJwk'
```

**Result:** `HTTP 200`, `verificationMethod[0]` includes:

- `id`: `did:gtcx:tp_staging_e2e_001#k-1`
- `publicKeyJwk.x`: `OP743wqD8AUD2Vl05YGJ17fnNWUDIkQ1NRHrWTo4OuI`
- `kty`: `OKP`, `crv`: `Ed25519`

## Handoff to mobile

- AWS SM secret `gtcx/staging/mobile-audit-e2e-credentials` updated with the **current** private JWK matching the deployed fixture.
- `gtcx-mobile/staging-audit-keygen-handoff.json` synchronized.

## Files modified in infra

- `04-ship/kubernetes/overlays/staging/kustomization.yaml` — image tag `v0.4.6`
- `04-ship/kubernetes/overlays/staging/patches/protocols-staging-env.yaml` — seed + API key env vars
- `04-ship/kubernetes/overlays/staging/ingress.yaml` — `/v1/tradepass` → `gtcx-protocols-staging`
- `01-docs/08-gtm/handoffs/staging-audit-e2e-credentials-2026-06-02.md` — updated

## Notes

- `POST /v1/admin/tradepass/register-operator` returns HTML `403 Forbidden` — likely WAF/Cloudflare upstream block on `/v1/admin/*` (not the pod). Needs WAF rule tuning if admin registration from external clients is required.
- `did-resolver-staging` deployment still exists but no longer receives `/v1/tradepass` traffic.
