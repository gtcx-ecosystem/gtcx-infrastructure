---
status: current
date: 2026-06-02
owner: gtcx-infrastructure
---

## Infrastructure staging deploy — audit bundle (#50–#52)

Base: `https://api.staging.gtcx.trade`
Evidence: `pnpm staging:readiness`
Gate (overall): **PASS**

### Endpoint presence checks

- **/audit/bundles** — PASS (400, 196ms): `https://api.staging.gtcx.trade/audit/bundles`
  - 400 confirms endpoint is deployed and rejecting unauthenticated requests (not 404)
- **/audit/query** — PASS (401, 173ms): `https://api.staging.gtcx.trade/audit/query`
  - 401 confirms endpoint is deployed and enforcing Bearer auth (not 404)

### Deployed components

- `compliance-gateway-staging-7cdd7586c7-mzflr` — Running
- `redis-staging-865ffcffb8-kq5xj` — Running (nonce store)
- Image: `348389439381.dkr.ecr.af-south-1.amazonaws.com/compliance-gateway:d5a311ef` (amd64)

### Notes

- This smoke catches **404 (endpoint not deployed)** and **5xx (server errors)** early.
- 400/401 responses are expected at this stage; auth correctness is verified by downstream integration tests.
- ALB target group manually synced after secret patch (drained stale IP `10.3.77.238`, registered new pod IP).
