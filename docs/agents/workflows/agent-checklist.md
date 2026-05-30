---
title: 'Agent Checklist'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'testing']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Agent Checklist

Pre-flight and validation checklists for AI agents and developers.

---

## Pre-Flight: Before Starting Any Task

### Environment check

- [ ] Correct project directory? (`pwd` to verify)
- [ ] Latest code pulled? (`git pull`)
- [ ] All dependencies installed? (`pnpm install`)
- [ ] Tests passing?
- [ ] No uncommitted changes? (`git status`)

### Context understanding

- [ ] Read project README?
- [ ] Checked current priorities (P0–P3)?
- [ ] Found relevant user story?
- [ ] Understood acceptance criteria?
- [ ] Reviewed Definition of Done?

### Safety verification

- [ ] No production credentials in code?
- [ ] No hardcoded secrets or keys?
- [ ] Following naming conventions?
- [ ] Using established patterns?
- [ ] No unauthorized deletions planned?

---

## Development: During Work

### Code quality

- [ ] Following TypeScript strict mode?
- [ ] No `any` types without justification?
- [ ] Error handling implemented?
- [ ] Input validation added?
- [ ] Logging statements appropriate?

### Pattern compliance

- [ ] Using project's established patterns?
- [ ] Following file structure conventions?
- [ ] Consistent with existing code style?
- [ ] API patterns followed?
- [ ] Security patterns implemented?

### Documentation

- [ ] Inline comments for complex logic?
- [ ] JSDoc for public methods?
- [ ] README updated if needed?
- [ ] API documentation current?

### Testing

- [ ] Unit tests written?
- [ ] Integration tests added?
- [ ] Edge cases covered?
- [ ] Error scenarios tested?
- [ ] Test coverage maintained or improved?

---

## Pre-Commit: Before Committing

### Code validation

- [ ] All tests passing?
- [ ] No linting errors?
- [ ] Build successful?
- [ ] No `console.log` statements?
- [ ] No commented-out code?

### Git hygiene

- [ ] Changes reviewed? (`git diff`)
- [ ] Only intended files staged? (`git status`)
- [ ] Commit message follows format?
- [ ] Commit is atomic (one purpose)?
- [ ] No sensitive data included?

### Documentation status

- [ ] User story updated?
- [ ] Technical docs updated?
- [ ] API docs current?
- [ ] Breaking changes documented?

---

## Feature Completion

### Functional requirements

- [ ] All acceptance criteria met?
- [ ] Feature works as specified?
- [ ] Edge cases handled?
- [ ] Error states managed?
- [ ] Performance acceptable?

### Quality requirements

- [ ] Code reviewed (self-review)?
- [ ] Tests comprehensive?
- [ ] Documentation complete?
- [ ] Security validated?
- [ ] Accessibility checked?

### Definition of Done

- [ ] Feature complete and working?
- [ ] Unit tests passing (>80% coverage)?
- [ ] Integration tests passing?
- [ ] Documentation updated?
- [ ] Code reviewed and approved?
- [ ] Deployed to staging?
- [ ] Stakeholder acceptance?

---

## Bug Fix

### Before fixing

- [ ] Bug reproduced locally?
- [ ] Root cause identified?
- [ ] Priority level determined (P0–P3)?
- [ ] Impact assessed?
- [ ] Related issues checked?

### During fix

- [ ] Minimal change approach?
- [ ] No unrelated changes?
- [ ] Regression test written?
- [ ] Fix validates the test?
- [ ] Side effects considered?

### After fix

- [ ] Original bug resolved?
- [ ] No new bugs introduced?
- [ ] Tests updated?
- [ ] Documentation updated?
- [ ] Fix documented in changelog?

---

## Documentation

### Code documentation

- [ ] Complex logic explained?
- [ ] Public APIs documented?
- [ ] Parameters described?
- [ ] Return values specified?
- [ ] Exceptions documented?

### User documentation

- [ ] User guides updated?
- [ ] FAQs current?
- [ ] Troubleshooting guides updated?
- [ ] Examples provided?

### Technical documentation

- [ ] Architecture diagrams current?
- [ ] API specifications updated?
- [ ] Database schemas documented?
- [ ] Deployment procedures current?
- [ ] Configuration documented?

---

## Security

### Authentication and authorization

- [ ] Authentication required where needed?
- [ ] Authorization checks in place?
- [ ] Role-based access implemented?
- [ ] Session management secure?
- [ ] Token handling secure?

### Data security

- [ ] Sensitive data encrypted?
- [ ] No secrets in code?
- [ ] Environment variables used?
- [ ] SQL injection prevented?
- [ ] XSS prevention in place?

### API security

- [ ] Rate limiting implemented?
- [ ] Input validation comprehensive?
- [ ] Output sanitization in place?
- [ ] CORS configured correctly?
- [ ] Error messages safe (no sensitive data leaked)?

---

## Deployment

### Pre-deployment

- [ ] All tests passing?
- [ ] Build successful?
- [ ] Environment variables set?
- [ ] Database migrations ready?
- [ ] Rollback plan prepared?

### Deployment verification

- [ ] Application starts correctly?
- [ ] Health checks passing?
- [ ] Critical paths tested?
- [ ] Monitoring active?
- [ ] Logs accessible?

### Post-deployment

- [ ] Smoke tests passed?
- [ ] Performance acceptable?
- [ ] No errors in logs?
- [ ] Stakeholders notified?
- [ ] Documentation updated?

---

## Sprint

### Sprint start

- [ ] Sprint goals understood?
- [ ] User stories refined?
- [ ] Dependencies identified?
- [ ] Capacity planned?
- [ ] Definition of Done agreed?

### During sprint

- [ ] Daily progress tracked?
- [ ] Blockers communicated?
- [ ] Sprint board updated?
- [ ] Tests maintained?
- [ ] Documentation current?

### Sprint end

- [ ] All stories complete?
- [ ] Sprint goal achieved?
- [ ] Demo prepared?
- [ ] Retrospective scheduled?
- [ ] Next sprint planned?

---

## Quality Gates

### Code quality

- [ ] Test coverage >80%?
- [ ] No critical security issues?
- [ ] Performance benchmarks met?
- [ ] Code complexity acceptable?
- [ ] Technical debt documented?

### Documentation quality

- [ ] All public APIs documented?
- [ ] User guides complete?
- [ ] Architecture documented?
- [ ] Runbooks updated?
- [ ] Change logs current?

### Process quality

- [ ] Agile ceremonies conducted?
- [ ] Retrospectives held?
- [ ] Feedback incorporated?
- [ ] Metrics tracked?

---

## Priority-Based Response

### P0 — Critical (0–4 hours)

- [ ] Issue confirmed critical?
- [ ] Team notified immediately?
- [ ] Fix in progress?
- [ ] Stakeholders updated hourly?
- [ ] Post-mortem scheduled?

### P1 — High (4–24 hours)

- [ ] Issue prioritized correctly?
- [ ] Resources allocated?
- [ ] Fix timeline communicated?
- [ ] Daily updates provided?
- [ ] Testing comprehensive?

### P2 — Medium (1–7 days)

- [ ] Added to sprint backlog?
- [ ] Story points estimated?
- [ ] Dependencies identified?
- [ ] Weekly updates planned?

### P3 — Low (1–4 weeks)

- [ ] Added to product backlog?
- [ ] Priority reviewed?
- [ ] Resources available?
- [ ] Monthly review scheduled?

---

## Decision Trees

### Should I delete this code?

```
Is it used anywhere? → YES → Don't delete — deprecate instead
                    ↓
                    NO → Is it documented? → YES → Check with team
                                           ↓
                                           NO → Still check with team
```

### Should I commit this?

```
Tests passing? → NO → Fix tests first
              ↓
              YES → Sensitive data? → YES → Remove it
                                   ↓
                                   NO → Good commit message? → NO → Improve it
                                                             ↓
                                                             YES → Commit!
```

### What priority is this?

```
System down? → YES → P0
            ↓
            NO → Major feature broken? → YES → P1
                                      ↓
                                      NO → Affects users? → YES → P2
                                                          ↓
                                                          NO → P3
```

---

## Daily

### Start of day

- [ ] Check P0/P1 items?
- [ ] Review assigned tasks?
- [ ] Pull latest changes?
- [ ] Check CI/CD status?
- [ ] Review team messages?

### During day

- [ ] Following project workflow?
- [ ] Updating task status?
- [ ] Communicating blockers?
- [ ] Writing tests?
- [ ] Documenting changes?

### End of day

- [ ] Code committed?
- [ ] Status updated?
- [ ] Tomorrow's work clear?
- [ ] Documentation current?
- [ ] Clean workspace?

---

## When a Task is Done

- [ ] Update user story to "Done"
- [ ] Notify team of completion
- [ ] Document lessons learned
- [ ] Help unblocked teammates
- [ ] Pick next priority item
