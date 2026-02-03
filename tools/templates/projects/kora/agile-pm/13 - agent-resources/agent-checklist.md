# GTCX Agent Checklist
*Pre-flight and validation checklists for AI agents*

## Pre-Flight Checklist: Before Starting ANY Task

### Environment Check
- Correct project directory? (`pwd` to verify)
- Latest code pulled? (`git pull`)
- All dependencies installed? (`npm install`)
- Tests passing? (`npm test`)
- No uncommitted changes? (`git status`)

### Context Understanding
- Read project README in agile-pm?
- Checked current priorities (P0-P3)?
- Found relevant user story?
- Understood acceptance criteria?
- Reviewed Definition of Done?

### Safety Verification
- No production credentials in code?
- No hardcoded secrets or keys?
- Following naming conventions?
- Using established patterns?
- No unauthorized deletions planned?


## Development Checklist: During Work

### Code Quality
- Following TypeScript strict mode?
- No `any` types without justification?
- Error handling implemented?
- Input validation added?
- Logging statements appropriate?

### Pattern Compliance
- Using project's established patterns?
- Following file structure conventions?
- Consistent with existing code style?
- API patterns from templates followed?
- Security patterns implemented?

### Documentation
- Inline comments for complex logic?
- JSDoc for public methods?
- README updated if needed?
- API documentation current?
- Change log updated?

### Testing
- Unit tests written?
- Integration tests added?
- Edge cases covered?
- Error scenarios tested?
- Test coverage maintained/improved?


## Pre-Commit Checklist: Before Committing

### Code Validation
- All tests passing? (`npm test`)
- No linting errors? (`npm run lint`)
- Build successful? (`npm run build`)
- No console.log statements?
- No commented-out code?

### Git Hygiene
- Changes reviewed? (`git diff`)
- Only intended files staged? (`git status`)
- Commit message follows format?
- Commit is atomic (one purpose)?
- No sensitive data included?

### Documentation Status
- User story updated?
- Technical docs updated?
- API docs current?
- Breaking changes documented?
- Release notes updated?


## Feature Completion Checklist

### Functional Requirements
- All acceptance criteria met?
- Feature works as specified?
- Edge cases handled?
- Error states managed?
- Performance acceptable?

### Quality Requirements
- Code reviewed (self-review)?
- Tests comprehensive?
- Documentation complete?
- Security validated?
- Accessibility checked?

### Definition of Done
- Feature complete and working?
- Unit tests passing (>80% coverage)?
- Integration tests passing?
- Documentation updated?
- Code reviewed and approved?
- Deployed to staging?
- Stakeholder acceptance?


## Bug Fix Checklist

### Before Fixing
- Bug reproduced locally?
- Root cause identified?
- Priority level determined (P0-P3)?
- Impact assessed?
- Related issues checked?

### During Fix
- Minimal change approach?
- No unrelated changes?
- Regression test written?
- Fix validates the test?
- Side effects considered?

### After Fix
- Original bug resolved?
- No new bugs introduced?
- Tests updated?
- Documentation updated?
- Fix documented in changelog?


## Documentation Checklist

### Code Documentation
- Complex logic explained?
- Public APIs documented?
- Parameters described?
- Return values specified?
- Exceptions documented?

### User Documentation
- User guides updated?
- FAQs current?
- Troubleshooting guides updated?
- Examples provided?
- Screenshots current (if applicable)?

### Technical Documentation
- Architecture diagrams current?
- API specifications updated?
- Database schemas documented?
- Deployment procedures current?
- Configuration documented?


## Security Checklist

### Authentication & Authorization
- Authentication required where needed?
- Authorization checks in place?
- Role-based access implemented?
- Session management secure?
- Token handling secure?

### Data Security
- Sensitive data encrypted?
- No secrets in code?
- Environment variables used?
- SQL injection prevented?
- XSS prevention in place?

### API Security
- Rate limiting implemented?
- Input validation comprehensive?
- Output sanitization in place?
- CORS configured correctly?
- Error messages safe (no leak)?


## Deployment Checklist

### Pre-Deployment
- All tests passing?
- Build successful?
- Environment variables set?
- Database migrations ready?
- Rollback plan prepared?

### Deployment Verification
- Application starts correctly?
- Health checks passing?
- Critical paths tested?
- Monitoring active?
- Logs accessible?

### Post-Deployment
- Smoke tests passed?
- Performance acceptable?
- No errors in logs?
- Stakeholders notified?
- Documentation updated?


## Sprint Checklist

### Sprint Start
- Sprint goals understood?
- User stories refined?
- Dependencies identified?
- Capacity planned?
- Definition of Done agreed?

### During Sprint
- Daily progress tracked?
- Blockers communicated?
- Sprint board updated?
- Tests maintained?
- Documentation current?

### Sprint End
- All stories complete?
- Sprint goal achieved?
- Demo prepared?
- Retrospective scheduled?
- Next sprint planned?


## Quality Gates Checklist

### Code Quality
- Test coverage >80%?
- No critical security issues?
- Performance benchmarks met?
- Code complexity acceptable?
- Technical debt documented?

### Documentation Quality
- All public APIs documented?
- User guides complete?
- Architecture documented?
- Runbooks updated?
- Change logs current?

### Process Quality
- Agile ceremonies conducted?
- Retrospectives held?
- Feedback incorporated?
- Metrics tracked?
- Continuous improvement?


## Priority-Based Checklists

### P0 - Critical (0-4 hours)
- Issue confirmed critical?
- Team notified immediately?
- Fix in progress?
- Stakeholders updated hourly?
- Post-mortem scheduled?

### P1 - High (4-24 hours)
- Issue prioritized correctly?
- Resources allocated?
- Fix timeline communicated?
- Daily updates provided?
- Testing comprehensive?

### P2 - Medium (1-7 days)
- Added to sprint backlog?
- Story points estimated?
- Dependencies identified?
- Weekly updates planned?
- Documentation planned?

### P3 - Low (1-4 weeks)
- Added to product backlog?
- Priority reviewed?
- Resources available?
- Monthly review scheduled?
- Value justified?


## Quick Decision Trees

### Should I Delete This Code?
```
Is it used anywhere? → YES → Don't delete, deprecate
                    ↓
                    NO → Is it documented? → YES → Check with team
                                           ↓
                                           NO → Still check with team
```

### Should I Commit This?
```
Tests passing? → NO → Fix tests first
              ↓
              YES → Sensitive data? → YES → Remove it
                                   ↓
                                   NO → Good commit message? → NO → Improve it
                                                             ↓
                                                             YES → Commit!
```

### What Priority Is This?
```
System down? → YES → P0
            ↓
            NO → Major feature broken? → YES → P1
                                      ↓
                                      NO → Affects users? → YES → P2
                                                          ↓
                                                          NO → P3
```


## Daily Checklist

### Start of Day
- Check priority items (P0/P1)?
- Review assigned tasks?
- Pull latest changes?
- Check CI/CD status?
- Review team messages?

### During Day
- Following agile-pm structure?
- Updating task status?
- Communicating blockers?
- Writing tests?
- Documenting changes?

### End of Day
- Code committed?
- Status updated?
- Tomorrow's work clear?
- Documentation current?
- Clean workspace?


## Completion Celebration Checklist

### When Task is Done
- Pat yourself on the back! 
- Update user story to "Done"
- Notify team of completion
- Document lessons learned
- Help blocked teammates
- Pick next priority item
- Keep the momentum going! 


**Remember**: These checklists ensure quality, consistency, and professionalism in every aspect of GTCX development. Use them, trust them, and maintain excellence!

*Checklists save time, prevent errors, and ensure nothing important is forgotten.*
