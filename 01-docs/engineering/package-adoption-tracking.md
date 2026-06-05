---
title: 'Cross-Repo Package Adoption Tracking'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'platform-engineer'
tier: 'critical'
tags: ['ecosystem', 'packages', 'tracking', 'm3']
review_cycle: 'weekly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Cross-Repo Package Adoption Tracking

**Date:** 2026-05-12  
**Target:** 80% adoption (≥12 of 15 active repos) by Q3 2026  
**Current:** 1 of 15 (6.7%)

---

## Active Repos (15)

| #   | Repo                | Status     | PR Open | Merged | Blocker              | Owner           |
| --- | ------------------- | ---------- | ------- | ------ | -------------------- | --------------- |
| 1   | `gtcx-protocols`    | ✅ Adopted | —       | ✅     | —                    | —               |
| 2   | `gtcx-platforms`    | ⏳ Ready   | —       | —      | M3 completion        | Platform Team   |
| 3   | `gtcx-core`         | ⏳ Ready   | —       | —      | Monorepo restructure | Platform Team   |
| 4   | `gtcx-intelligence` | ⏳ Ready   | —       | —      | CI onboarding        | ML Team         |
| 5   | `gtcx-markets`      | ⏳ Ready   | —       | —      | Schema alignment     | Markets Team    |
| 6   | `gtcx-mobile`       | ⏳ Ready   | —       | —      | React Native compat  | Mobile Team     |
| 7   | `gtcx-agentic`      | ⏳ Ready   | —       | —      | Eval pipeline merge  | ML Team         |
| 8   | `gtcx-agile`        | ⏳ Ready   | —       | —      | No blockers          | Agile Team      |
| 9   | `gtcx-hardware`     | ⏳ Ready   | —       | —      | Embedded constraints | Hardware Team   |
| 10  | `baseline-os`       | ⏳ Ready   | —       | —      | No blockers          | Infra Team      |
| 11  | `compliance-os`     | ⏳ Ready   | —       | —      | No blockers          | Compliance Team |
| 12  | `exploration-os`    | ⏳ Ready   | —       | —      | No blockers          | Research Team   |
| 13  | `griot-ai`          | ⏳ Ready   | —       | —      | No blockers          | AI Team         |
| 14  | `terra-os`          | ⏳ Ready   | —       | —      | No blockers          | Infra Team      |
| 15  | `veritas`           | ⏳ Ready   | —       | —      | No blockers          | Security Team   |

---

## Deprecated / Archived Repos (Excluded)

| Repo          | Status                | Reason                                         |
| ------------- | --------------------- | ---------------------------------------------- |
| `gtcx-core12` | ❌ Deleted 2026-06-01 | Superseded by `compliance-os/services/core12/` |
| `gtcx-amis`   | ❌ Deleted 2026-06-01 | Superseded by `sensei-ai` + infra templates    |

---

## Adoption Checklist per Repo

```markdown
- [ ] Add `.npmrc` with GitHub Packages registry
- [ ] Add `@gtcx/protocols-crypto` dependency
- [ ] Add `@gtcx/protocols-schemas` dependency
- [ ] Add `@gtcx/protocols-domain` dependency
- [ ] Replace local crypto with `@gtcx/protocols-crypto`
- [ ] Replace local schemas with `@gtcx/protocols-schemas`
- [ ] Replace local types with `@gtcx/protocols-domain`
- [ ] CI passes with shared packages
- [ ] Tag Platform Engineering for review
```

---

## Weekly Tracking

| Week          | Target Repos | Actual | Cumulative   | Score Impact       |
| ------------- | ------------ | ------ | ------------ | ------------------ |
| W1 (May 12)   | 3            | 1      | 1 (6.7%)     | —                  |
| W2 (May 19)   | 3            | —      | —            | —                  |
| W3 (May 26)   | 3            | —      | —            | —                  |
| W4 (Jun 2)    | 3            | —      | —            | —                  |
| W5 (Jun 9)    | 3            | —      | —            | —                  |
| **Q3 Target** | **12**       | —      | **12 (80%)** | **Ecosystem +0.5** |

---

## PR Template

```markdown
## Package Adoption: `@gtcx/*` Shared Packages

**Repo:** <repo-name>
**Packages Added:** `@gtcx/protocols-crypto`, `@gtcx/protocols-schemas`, `@gtcx/protocols-domain`

### Changes

- Added `.npmrc` for GitHub Packages
- Replaced local implementations with shared packages
- Updated imports

### Verification

- [ ] `pnpm install` passes
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes
- [ ] No duplicate crypto implementations remain

### Reviewers

- [ ] @platform-engineering
- [ ] @security-team (for crypto changes)
```

---

## Related Documents

- `01-docs/engineering/package-adoption-guide.md` — Full adoption pattern
- `01-docs/05-audit/archive/10-10-roadmap-2026-05-12.md` — M3 Ecosystem Integration targets
- `01-docs/05-audit/ecosystem-repo-review-2026-05-12.md` — Initial repo survey
