---
title: 'QA Process'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'compliance', 'infrastructure', 'testing', 'api']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# QA Process

**Owner**: [QA Lead / Engineering Lead]
**Review Cycle**: Quarterly or after major process changes

---

## QA Philosophy

Quality is a shared responsibility, not a gate at the end. Engineers write tests. QA defines standards, owns the test strategy, and validates release readiness. No feature ships without meeting the exit criteria defined here.

---

## Test Coverage Requirements

| Layer             | Minimum Coverage                   | Enforcement                           |
| ----------------- | ---------------------------------- | ------------------------------------- |
| Unit tests        | ≥ {coverage-target}% line coverage | CI gate — blocks merge                |
| Integration tests | Critical paths covered             | CI gate — blocks merge                |
| End-to-end tests  | All core user flows covered        | CI gate on `main`                     |
| Accessibility     | axe-core zero violations           | CI gate — blocks merge                |
| Performance       | p95 latency within SLO             | Monitored; blocks release if breached |

---

## Environments and Promotion Gates

```
Feature branch → Review App
  ↓ (PR approved + CI green)
main → Staging
  ↓ (QA sign-off)
Staging → Production (canary)
  ↓ (canary metrics clean for {n} hours)
Production (full rollout)
```

### Staging Sign-Off Criteria

Before any release from staging to production:

- [ ] All automated tests passing (unit, integration, E2E)
- [ ] No open P0 or P1 bugs
- [ ] Smoke test suite run manually on staging
- [ ] Performance within SLO targets
- [ ] Accessibility checklist completed for new/changed UI
- [ ] QA lead has signed off

---

## UAT (User Acceptance Testing)

### When Required

UAT is required for:

- New product surfaces or major feature launches
- Changes to payment, billing, or subscription flows
- Changes affecting user data or privacy
- Any feature that departs from existing patterns

### Process

1. **Define acceptance criteria** — Product owner documents criteria before development starts
2. **Prepare test scenarios** — QA creates UAT test cases from acceptance criteria
3. **Execute** — Internal team or beta users complete test scenarios
4. **Record results** — Pass/fail per scenario logged in [test management tool]
5. **Triage failures** — P0/P1 failures block release; P2/P3 go to backlog
6. **Sign off** — Product owner confirms acceptance

---

## Defect Classification

| Priority | Definition                                      | Response SLA      | Fix SLA                      |
| -------- | ----------------------------------------------- | ----------------- | ---------------------------- |
| P0       | Data loss, security vulnerability, service down | Immediate page    | Fix before any other release |
| P1       | Core flow broken, major feature unusable        | Within 2 hours    | Fix within {n} hours         |
| P2       | Significant degradation, workaround exists      | Next business day | Fix within current sprint    |
| P3       | Minor issue, cosmetic                           | Weekly triage     | Backlog                      |

---

## Release Readiness Checklist

Run before every production release:

### Code Quality

- [ ] All CI checks passing on the release commit
- [ ] No unresolved security advisories in dependencies
- [ ] Dependency audit run (`pnpm audit` or equivalent)
- [ ] No `TODO`/`FIXME` comments merged that are tagged as blocking

### Testing

- [ ] Unit test coverage at or above threshold
- [ ] E2E test suite passing in staging environment
- [ ] Smoke test run on staging within last 24 hours
- [ ] Any new/changed API endpoints covered by integration tests

### Performance

- [ ] Load test run for significant backend changes
- [ ] p95 API latency within SLO on staging
- [ ] No memory leak or connection leak indicators in staging logs

### Data & Migrations

- [ ] Database migrations tested on a production-size dataset copy
- [ ] Migration is reversible or rollback plan documented
- [ ] No destructive schema changes without a phased rollout plan

### Observability

- [ ] New features have logging and metrics instrumented
- [ ] New alert rules reviewed and thresholds set
- [ ] Dashboard updated to reflect new features

### Sign-Off

- [ ] QA lead: all test criteria met
- [ ] Engineering lead: code review complete, no outstanding concerns
- [ ] Product owner: acceptance criteria met
- [ ] On-call engineer: briefed on what is shipping and rollback procedure

---

## Known Issue Tracking

Open known issues are tracked in [issue tracker] with the label `known-issue`.

Each known issue must have:

- Severity classification
- Workaround documented (if any)
- Target fix version or explicit decision to defer
- Customer-facing impact assessment

Known issues are reviewed at each sprint planning and release gate.

---

## QA Metrics

Tracked monthly:

| Metric                                     | Target      | Current |
| ------------------------------------------ | ----------- | ------- |
| Escaped defects (bugs found in production) | < {n}/month |         |
| Mean time to detect (staging)              | < {n} hours |         |
| Test coverage (unit)                       | ≥ {n}%      |         |
| E2E pass rate on staging                   | ≥ 99%       |         |
| Release rollback rate                      | < {n}%      |         |
