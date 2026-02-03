# Definition of Done (DoD) Template

## Purpose
This document defines the criteria that must be met for a user story, feature, or epic to be considered "Done" and ready for production deployment.

## Scope
This Definition of Done applies to:
- Individual user stories
- Features/epics
- Sprint deliverables
- Release deliverables

## General DoD Criteria
### Code Quality
- Code follows project coding standards
- Code is self-documenting with clear naming
- No TODO comments or debugging code left in
- Code complexity is within acceptable limits
- Code duplication is minimized

### Code Review
- Code has been reviewed by at least one peer
- All review comments have been addressed
- Code review checklist is completed
- Security review is completed (if applicable)
- Architecture review is completed (if applicable)

### Testing
- Unit tests are written and passing
- Integration tests are written and passing
- End-to-end tests are written and passing
- Test coverage meets minimum requirements
- Performance tests are completed (if applicable)
- Security tests are completed (if applicable)

### Documentation
- Code documentation is updated
- API documentation is updated (if applicable)
- User documentation is updated
- Technical documentation is updated
- README files are updated

### Build & Deployment
- Code builds successfully in CI/CD pipeline
- All automated tests pass in CI/CD pipeline
- Code is deployed to staging environment
- Staging deployment is verified
- Production deployment is ready

## User Story DoD
### Development Complete
- Feature is implemented according to requirements
- All acceptance criteria are met
- Code is committed to version control
- Code review is completed
- All tests are passing

### Testing Complete
- Unit tests are written and passing
- Integration tests are written and passing
- Manual testing is completed
- Bug fixes are implemented and tested
- Regression testing is completed

### Documentation Complete
- Code comments are added where needed
- API documentation is updated (if applicable)
- User documentation is updated
- Technical documentation is updated

### Ready for Demo
- Feature is demo-ready
- Demo script is prepared
- Demo data is available
- Feature works in demo environment

## Feature/Epic DoD
### Development Complete
- All user stories in the feature are complete
- Feature integration is tested
- Cross-feature dependencies are resolved
- Performance requirements are met
- Security requirements are met

### Testing Complete
- Feature testing is completed
- Integration testing is completed
- System testing is completed
- User acceptance testing is completed
- Performance testing is completed
- Security testing is completed

### Documentation Complete
- Feature documentation is complete
- User guides are updated
- Technical specifications are updated
- API documentation is updated (if applicable)

### Deployment Ready
- Feature is deployed to staging
- Staging verification is completed
- Production deployment plan is ready
- Rollback plan is prepared
- Monitoring and alerting are configured

## Sprint DoD
### Sprint Planning Complete
- Sprint backlog is finalized
- Sprint goals are defined
- Team capacity is estimated
- Dependencies are identified
- Sprint ceremonies are scheduled

### Sprint Execution Complete
- All planned user stories are completed
- Sprint goals are achieved
- Sprint demo is prepared
- Sprint retrospective is scheduled

### Sprint Review Complete
- Sprint demo is presented to stakeholders
- Stakeholder feedback is collected
- Sprint outcomes are documented
- Product backlog is updated

### Sprint Retrospective Complete
- Team reflects on sprint performance
- Improvement actions are identified
- Action items are assigned
- Retrospective outcomes are documented

## Release DoD
### Development Complete
- All features in the release are complete
- Release integration testing is completed
- Performance benchmarks are met
- Security requirements are met
- Compliance requirements are met

### Testing Complete
- System testing is completed
- User acceptance testing is completed
- Performance testing is completed
- Security testing is completed
- Accessibility testing is completed
- Cross-browser testing is completed

### Documentation Complete
- Release notes are prepared
- User documentation is updated
- Technical documentation is updated
- API documentation is updated (if applicable)
- Migration guides are prepared (if applicable)

### Deployment Complete
- Production deployment is completed
- Post-deployment verification is completed
- Monitoring and alerting are active
- Support team is trained
- Go-live announcement is made

## Quality Gates
### Code Quality Gates
- Code coverage meets minimum threshold (e.g., 80%)
- Code complexity is within acceptable limits
- No critical or high-severity security vulnerabilities
- Performance benchmarks are met
- Accessibility standards are met

### Testing Quality Gates
- All automated tests are passing
- Manual testing is completed
- Bug severity distribution is acceptable
- Performance requirements are met
- Security requirements are met

### Documentation Quality Gates
- All required documentation is complete
- Documentation is reviewed and approved
- Documentation is accessible to target audience
- Documentation is up-to-date

## Exceptions & Escalations
### When DoD Cannot Be Met
- **Technical Blockers**: [Process for handling technical blockers]
- **Resource Constraints**: [Process for handling resource constraints]
- **External Dependencies**: [Process for handling external dependencies]
- **Scope Changes**: [Process for handling scope changes]

### Escalation Process
1. **Identify the Issue**: [How to identify DoD blockers]
2. **Assess Impact**: [How to assess impact of not meeting DoD]
3. **Escalate to Stakeholders**: [When and how to escalate]
4. **Implement Mitigation**: [How to mitigate DoD risks]
5. **Update DoD Criteria**: [How to update DoD if needed]

## Continuous Improvement
### DoD Review Process
- **Frequency**: [How often DoD is reviewed]
- **Participants**: [Who participates in DoD review]
- **Process**: [How DoD review is conducted]
- **Outcomes**: [What outcomes are expected]

### DoD Metrics
- **DoD Compliance Rate**: [% of items meeting DoD]
- **DoD Violation Reasons**: [Common reasons for DoD violations]
- **DoD Effectiveness**: [How well DoD ensures quality]

### DoD Evolution
- **Feedback Sources**: [Where feedback on DoD comes from]
- **Update Process**: [How DoD is updated]
- **Communication**: [How DoD changes are communicated]

## Team-Specific DoD
### Development Team
- Code follows team coding standards
- Code is reviewed by team members
- Tests are written and passing
- Documentation is updated

### QA Team
- Test cases are executed
- Defects are reported and tracked
- Test results are documented
- Quality metrics are collected

### DevOps Team
- Infrastructure is provisioned
- Deployment pipelines are configured
- Monitoring and alerting are set up
- Security configurations are applied

### Product Team
- Requirements are clear and complete
- Acceptance criteria are defined
- User stories are prioritized
- Stakeholder feedback is collected

## DoD Checklist Template
### For Each User Story
```
User Story: [Story Title]
Sprint: [Sprint Number]
Developer: [Developer Name]
Reviewer: [Reviewer Name]

Development:
- [ ] Code is implemented
- [ ] Code follows standards
- [ ] Code is reviewed
- [ ] Tests are written

Testing:
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Bug fixes implemented

Documentation:
- [ ] Code comments added
- [ ] Documentation updated
- [ ] README updated

Deployment:
- [ ] Code builds successfully
- [ ] Tests pass in CI/CD
- [ ] Ready for staging

Definition of Done: [ ] Complete
```

## Appendices
### A. Coding Standards
[Link to project coding standards]

### B. Testing Standards
[Link to project testing standards]

### C. Documentation Standards
[Link to project documentation standards]

### D. Deployment Standards
[Link to project deployment standards]

*Template: Customize for your specific project and team requirements*
