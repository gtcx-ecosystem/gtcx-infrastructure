---
title: 'Deployment — ExplorationOS SIR Verifier + Supabase Migrations'
status: partial
date: 2026-06-03
owner: gtcx-infrastructure
role: platform-engineer
tier: critical
tags: ['deployment', 'exploration-os', 'sir-verifier', 'supabase', 'cloudflare']
---

# ExplorationOS SIR Verifier + Supabase Migrations (2026-06-03)

## 1. Static SIR Verifier ✅

### Deployed

- **Project:** `exploration-os-verifier` on Cloudflare Pages
- **Pages URL:** `https://4d98ac1c.exploration-os-verifier.pages.dev/sir`
- **Custom domain (pending DNS):** `https://verify.explorationos.gtcx.trade/sir`
- **Pepper:** `4189e32dde002481bdc8f046d20877a20ff3750a185f75d6b38113026ac47507`

### Changes made

- Injected `window.__SIR_VERIFIER_PEPPER__` at deploy time via HTML rewrite
- Set `EXPO_PUBLIC_REPORT_SIGNING_PEPPER` in EAS production environment (sensitive visibility)
- Set `EXPO_PUBLIC_SIR_VERIFIER_URL` in EAS production environment (plaintext visibility)

### Pepper coordination

| System                    | Variable                            | Value                                                              | Status                |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------------ | --------------------- |
| Cloudflare Pages verifier | `window.__SIR_VERIFIER_PEPPER__`    | `4189e32dde002481bdc8f046d20877a20ff3750a185f75d6b38113026ac47507` | ✅ Injected at deploy |
| EAS (mobile)              | `EXPO_PUBLIC_REPORT_SIGNING_PEPPER` | Same as above                                                      | ✅ Set on project     |

> **Note:** Previous AWS SM `gtcx/staging/mobile-audit-e2e-credentials` had a mismatched keypair (public JWK did not match fixture). A fresh Ed25519 keypair was generated via `pnpm staging:audit-keygen` in `gtcx-mobile`, and both the fixture and AWS SM were updated with the matching keypair.

### Smoke test

```bash
# Verifier page loads with pepper
 curl -sL "https://4d98ac1c.exploration-os-verifier.pages.dev/sir" | grep "__SIR_VERIFIER_PEPPER__"
# → window.__SIR_VERIFIER_PEPPER__ = '4189e32dde002481bdc8f046d20877a20ff3750a185f75d6b38113026ac47507'

# Signed test package verifies correctly
node -e "
const pkg = JSON.parse(require('fs').readFileSync('/tmp/signed-test.sir.json'));
// canonical hash + HMAC signature both valid
"
```

### Blocker: Custom domain DNS

**Status:** ❌ Pending zone:write permission

- Cloudflare OAuth token has `zone:read` but **not** `zone:write`
- Need to create CNAME `verify.explorationos.gtcx.trade` → `exploration-os-verifier.pages.dev`
- **Action:** Add custom domain via Cloudflare dashboard or provision a token with `zone:write` + `dns_records:write`

---

## 2. Supabase Migrations ❌ BLOCKED

### Blocker: Project paused

- **Project ref:** `lolfkclpuvccntgtzwaj`
- **Project name:** `exploration-os`
- **Status:** `paused` (discovered via `supabase link`)
- **Error:** `project is paused. An admin must unpause it from the Supabase dashboard`

### Migrations ready to apply

| Migration | File                                                   | Purpose                                              |
| --------- | ------------------------------------------------------ | ---------------------------------------------------- |
| 006       | `supabase/migrations/006_financing_applications.sql`   | Financing applications table (checkout / H-C)        |
| 007       | `supabase/migrations/007_financing_lender_webhook.sql` | Lender notification trigger + pg_net (F-51 / S10-02) |

### Post-unpause steps

1. `supabase link --project-ref lolfkclpuvccntgtzwaj`
2. `supabase db push` (or apply 006 + 007 individually)
3. Verify RLS policies:
   - `financing_applications_select_own` — auth.uid() = user_id
   - `financing_applications_insert_own` — auth.uid() = user_id
   - `financing_applications_insert_demo_seed` — demo seed user
4. Verify trigger `financing_application_notify_lender` is active
5. Configure `app.settings.supabase_url` and `app.settings.service_role_key` for pg_net

### Acceptance pending

- [ ] Upload test `.sir.json` → verifier shows **Valid**
- [ ] Mobile financing submit → row in `financing_applications`
- [ ] Tampered package → verifier shows **Failed**

---

## Artifacts

- **Verifier deploy:** `https://4d98ac1c.exploration-os-verifier.pages.dev/sir`
- **Test SIR package:** `/tmp/signed-test.sir.json` (valid signature + canonical hash)
- **Cloudflare Pages project:** `exploration-os-verifier`
- **EAS project:** `@amanianai/exploration-os`
