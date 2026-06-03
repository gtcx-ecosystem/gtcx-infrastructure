# Cross-Repo Dependencies

> Last updated: 2026-06-03

## Hard Dependencies (Blocking)

| Needs | From Repo | Status | ETA | Blocking Epic |
|-------|-----------|--------|-----|---------------|
| XR-403 bog.json PR | gtcx-protocols | blocked | TBD (protocols ready) | INF-86 H-03 |
| CF `zone:write` token | Cloudflare admin (external) | blocked | TBD | XR-507 |
| Supabase project unpause | ops / Supabase dashboard | blocked | TBD | XR-508 |
| NPM_TOKEN | human / npm admin | blocked | TBD | XR-303 / XR-510 |

## Soft Dependencies (Nice to have / standing offers)

| Needs | From Repo | Status | ETA |
|-------|-----------|--------|-----|
| `COMPLIANCE_OS_INTAKE_API_KEY` sealed | compliance-os inbound ticket | ready | when asked |
| Platforms image digest | gtcx-platforms | ready | when pushed |

## Downstream Consumers

| Repo | What They Need | Status |
|------|---------------|--------|
| gtcx-protocols | SPKI DER + SHA-256 hash for XR-403 | ✅ delivered 2026-06-03 |
| gtcx-platforms | KMS alias + algorithm spec for XR-405 | ✅ ready, waiting XR-403 merge |
| exploration-os | `bog.json` production for contract regression | ✅ ready, waiting XR-403 merge |
| gtcx-intelligence | `intelligence-orchestrator` manifest template | ✅ deployed 2026-06-03 |

## Closed This Session

| ID | Date | What | Evidence |
|----|------|------|----------|
| XR-201 | 2026-06-03 | Intelligence auth gate deployed | `deployment-smoke-2026-06-03T06-42-43-281Z.json` |
| XR-202 | 2026-06-03 | INT-S3-08 re-smoke | intelligence evidence committed |
| XR-301/302 | 2026-06-03 | Platforms staging rollout unblocked | both `/api/health` → 200 |
| XR-401/402 | 2026-06-03 | INF-86 ceremony + SPKI export | `docs/audit/evidence/inf-86/gh-bog-2026-06-03/` |
| XR-516 | 2026-06-03 | P22/P26/P27 CI smoke | `.github/workflows/ci.yml` |

---
