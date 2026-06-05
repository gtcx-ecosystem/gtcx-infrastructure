# `04-ship/kubernetes/`

Kubernetes manifests for GTCX staging and production environments.

## Structure

| Directory            | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| `base/`              | Base manifests ( Deployments, Services, ConfigMaps)            |
| `overlays/staging/`  | Staging overlay: image tags, env vars, patches                 |
| `overlays/pen-test/` | Pen-test environment overlay                                   |
| `base/services/`     | Per-service manifests (compliance-gateway, did-resolver, etc.) |

## Key services

- `compliance-gateway` — AI compliance query + audit bundle ingestion
- `gtcx-protocols` — DID resolver, TradePass, authority endpoints
- `gtcx-agx` — Platform AGX API
- `sovereign` — Sovereign Nest API
- `redis` — Nonce store and cache
- `intelligence-orchestrator` — AI SDK orchestrator (separate namespace)

## Apply

```bash
# Staging
kubectl apply -k 04-ship/kubernetes/overlays/staging/

# Specific service
kubectl rollout restart deployment/compliance-gateway-staging -n gtcx-staging
```

## Agent note

All changes go through kustomize. Never edit live resources directly.
Staging uses `nameSuffix: -staging` and namespace `gtcx-staging`.
