---
title: 'Tenant Onboarding Runbook'
status: 'current'
date: '2026-05-27'
owner: 'platform-engineering'
review_cycle: 'monthly'
tags: ['operations', 'tenancy', 'compliance-gateway']
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
tier: 'standard'
---

# Tenant Onboarding — Compliance Gateway

This runbook brings a new tenant (pilot bank, cooperative, regulator desk) onto the gateway. Target: every step automated; manual time per tenant ≤ 2 hours including the customer call.

## Prerequisites

- The tenant's legal entity is signed up (separate sales workflow).
- A tenant code has been agreed (e.g., `rbz-pilot`, `gcb-corp`). Format: lowercase, hyphenated.
- The customer has nominated 2 contacts: one for breakglass, one for routine ops.

## 1. Allocate tenant code

```bash
TENANT_ID=rbz-pilot   # update per onboarding
test "$TENANT_ID" = "$(printf '%s' "$TENANT_ID" | tr -c 'a-z0-9-' '_')" || {
  echo 'tenantId must match [a-z0-9-]+' >&2; exit 1; }
```

The same code becomes:

- the principal `tenantId` in auth tokens
- the JetStream subject suffix: `gtcx.audit.compliance-gateway.${TENANT_ID}`
- the WORM bucket prefix: `tenant=${TENANT_ID}/`
- the Grafana variable for the tenant trust dashboard

## 2. Mint tenant tokens

Two tokens per tenant — one read-only operator, one approval signer. There is no `gtcx-ctl token mint` subcommand today; operators generate tokens directly and patch the gateway's `COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON` config (per `tools/compliance-gateway/src/auth.mjs`).

```bash
OPS_TOKEN=$(openssl rand -base64 48 | tr -d '=+/' | head -c 48)
APPROVER_TOKEN=$(openssl rand -base64 48 | tr -d '=+/' | head -c 48)

cat <<JSON > new-token-entries.json
[
  {
    "token": "${OPS_TOKEN}",
    "subject": "${TENANT_ID}-ops",
    "permissions": ["query:read", "tools:read", "providers:read"],
    "label": "${TENANT_ID} operator",
    "tenantId": "${TENANT_ID}"
  },
  {
    "token": "${APPROVER_TOKEN}",
    "subject": "${TENANT_ID}-approver",
    "permissions": ["query:read", "query:mutate", "tools:read", "providers:read", "audit:read"],
    "label": "${TENANT_ID} approval signer",
    "tenantId": "${TENANT_ID}"
  }
]
JSON

# Merge into the existing auth-tokens secret (kubectl example; for prod
# use sealed-secrets / external-secrets per your env's pattern).
CURRENT=$(kubectl -n gtcx get secret compliance-gateway-auth -o jsonpath='{.data.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON}' | base64 -d)
MERGED=$(jq -s 'add' <(echo "$CURRENT") new-token-entries.json)
kubectl -n gtcx create secret generic compliance-gateway-auth \
  --from-literal=COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON="$MERGED" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n gtcx rollout restart deploy/compliance-gateway
```

Tokens are visible only at generation. Store in the tenant's vault and the customer's password manager — never in chat, never in the runbook output. Shred `new-token-entries.json` after the apply.

A real `pnpm ctl token mint/rotate/revoke` CLI subcommand is on the roadmap (see Sprint 4); until then this manual procedure is the source of truth.

## 3. Configure budget overrides (optional)

Default is 10 QPS / $5 daily. Pilot banks routinely need higher caps:

```bash
# Pilot tier override
echo "$GTCX_PRINCIPAL_BUDGETS_JSON" | jq \
  --arg t "$TENANT_ID" \
  '. + { ("tenant:" + $t): { qps: 50, dailyUsd: 100 } }' \
  > new-budgets.json
```

Patch the gateway Deployment's env or the sealed secret:

```bash
kubectl -n gtcx set env deploy/compliance-gateway \
  GTCX_PRINCIPAL_BUDGETS_JSON="$(cat new-budgets.json)"
```

## 4. Provision NATS subject + WORM prefix

JetStream subjects under `gtcx.audit.compliance-gateway.>` are auto-routed. The WORM flush sidecar writes per-tenant prefixes automatically once it sees the first record.

Verify after the first request:

```bash
aws s3 ls s3://gtcx-worm-audit-production-af-south-1/tenant=${TENANT_ID}/ --recursive | head
```

## 5. Smoke test from the tenant network

Have the tenant run from their environment:

```bash
curl -sS -X POST https://gateway.gtcx.example/v1/query \
  -H "Authorization: Bearer $TENANT_OPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"What KYC retention applies for cross-border export?","jurisdiction":"zimbabwe"}'
```

Expected: 200 with a `routing.provider` field, no cross-tenant leakage.

## 6. Subscribe to per-tenant trust dashboard

Open Grafana → dashboard `audit-trust-tenant` → set `tenantId=${TENANT_ID}`. Confirm:

- Signing posture: SIGNING.
- Records signed rate: > 0 after the smoke test.
- Cost USD total: > 0 (small).
- Chain depth: bounded under the configured maximum.

## 7. Operational handover

- Add `${TENANT_ID}` to the on-call rotation's tenant list.
- Open a Linear `OPS-${TENANT_ID}` workspace for tenant-specific tickets.
- File the customer's break-glass contact in `docs/security/break-glass-procedure.md` under "Tenants".

## 8. Decommissioning (when a pilot ends)

Strip the tenant's token entries from the auth secret and roll the deployment:

```bash
CURRENT=$(kubectl -n gtcx get secret compliance-gateway-auth -o jsonpath='{.data.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON}' | base64 -d)
FILTERED=$(echo "$CURRENT" | jq --arg t "$TENANT_ID" 'map(select(.tenantId != $t))')
kubectl -n gtcx create secret generic compliance-gateway-auth \
  --from-literal=COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON="$FILTERED" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n gtcx rollout restart deploy/compliance-gateway
```

Tenant audit records remain in the WORM bucket for the FATF 7-year retention window. The chain is preserved; only the active tokens are revoked.

---

## SLA

- Onboarding: ≤ 2 hours of platform-engineering time, including the smoke-test call.
- Token rotation: ≤ 30 minutes per tenant.
- Decommissioning: ≤ 10 minutes (revoke + chain preservation).

## Related

- [`docs/audit/score-evidence-ledger.json`](../../audit/score-evidence-ledger.json) — link each onboarded tenant's first signed record.
- [`docs/security/break-glass-procedure.md`](../../security/break-glass-procedure.md) — tenant escalation paths.
- [`infra/kubernetes/base/services/compliance-gateway.yaml`](../../../infra/kubernetes/base/services/compliance-gateway.yaml) — env vars consumed.
