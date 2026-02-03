# Priority Framework Template

## Purpose
This document defines the priority classification system used to categorize and prioritize work items, features, bugs, and improvements in the GTCX agile ecosystem.

## Priority Levels Overview
| Priority | Level | Description | Response Time | Business Impact |
|----------|-------|-------------|---------------|-----------------|
| **P0** | Critical | Must be addressed immediately | 0-4 hours | Business critical |
| **P1** | High | Must be addressed within 24 hours | 4-24 hours | High business impact |
| **P2** | Medium | Should be addressed within 1 week | 1-7 days | Medium business impact |
| **P3** | Low | Can be addressed when resources allow | 1-4 weeks | Low business impact |

## P0 - Critical Priority
### Definition
P0 items are critical issues that require immediate attention and resolution. These items block business operations or pose significant security/compliance risks.

### Characteristics
- **Business Impact**: Business operations are blocked or severely impacted
- **User Impact**: Users cannot complete critical tasks
- **Security Risk**: Security vulnerabilities or compliance violations
- **Revenue Impact**: Direct impact on revenue or customer retention
- **Legal Risk**: Potential legal or regulatory violations

### Examples
- System completely down or inaccessible
- Critical security vulnerability
- Data loss or corruption
- Payment processing failure
- Compliance violation
- Customer data breach

### Response Requirements
- **Immediate Response**: Within 0-4 hours
- **Escalation**: Immediate escalation to stakeholders
- **Communication**: Urgent communication to affected users
- **Resolution**: 24/7 availability until resolved
- **Post-Mortem**: Required after resolution

### Escalation Path
1. **Developer/QA** → **Team Lead** → **Project Manager** → **Stakeholders**
2. **Escalation Time**: Within 1 hour if not resolved
3. **Stakeholder Notification**: Within 2 hours of escalation

## P1 - High Priority
### Definition
P1 items are high-priority issues that significantly impact business operations or user experience. These items should be addressed within 24 hours.

### Characteristics
- **Business Impact**: Significant impact on business operations
- **User Impact**: Users experience major difficulties
- **Performance Impact**: System performance severely degraded
- **Feature Blocking**: Blocks development of other features
- **Customer Impact**: Affects customer satisfaction

### Examples
- Major feature not working
- Significant performance degradation
- Data synchronization issues
- Integration failures
- User authentication problems
- Critical bug in production

### Response Requirements
- **Response Time**: Within 4-24 hours
- **Escalation**: Escalate if not resolved within 24 hours
- **Communication**: Regular updates to stakeholders
- **Resolution**: Priority over P2 and P3 items
- **Documentation**: Document resolution and lessons learned

### Escalation Path
1. **Developer/QA** → **Team Lead** → **Project Manager**
2. **Escalation Time**: Within 24 hours if not resolved
3. **Stakeholder Notification**: Within 48 hours

## P2 - Medium Priority
### Definition
P2 items are medium-priority issues that impact business operations or user experience but are not critical. These items should be addressed within 1 week.

### Characteristics
- **Business Impact**: Moderate impact on business operations
- **User Impact**: Users experience some difficulties
- **Performance Impact**: Minor performance issues
- **Feature Enhancement**: Improvements to existing features
- **Bug Fixes**: Non-critical bugs

### Examples
- Minor feature issues
- Performance optimizations
- UI/UX improvements
- Documentation updates
- Code refactoring
- Minor bug fixes

### Response Requirements
- **Response Time**: Within 1 week
- **Escalation**: Escalate if not resolved within 1 week
- **Communication**: Weekly updates to stakeholders
- **Resolution**: Normal development cycle
- **Documentation**: Standard documentation requirements

### Escalation Path
1. **Developer/QA** → **Team Lead**
2. **Escalation Time**: Within 1 week if not resolved
3. **Stakeholder Notification**: Weekly status updates

## P3 - Low Priority
### Definition
P3 items are low-priority issues that have minimal impact on business operations or user experience. These items can be addressed when resources allow.

### Characteristics
- **Business Impact**: Minimal impact on business operations
- **User Impact**: Users may not notice the issue
- **Performance Impact**: No significant performance impact
- **Nice-to-Have**: Enhancements or improvements
- **Technical Debt**: Code quality improvements

### Examples
- Minor UI improvements
- Code quality enhancements
- Documentation improvements
- Minor bug fixes
- Performance optimizations
- Feature requests

### Response Requirements
- **Response Time**: Within 1-4 weeks
- **Escalation**: No escalation required
- **Communication**: Monthly updates to stakeholders
- **Resolution**: When resources are available
- **Documentation**: Minimal documentation requirements

### Escalation Path
1. **Developer/QA** → **Team Lead**
2. **Escalation Time**: No escalation required
3. **Stakeholder Notification**: Monthly status updates

## Priority Assignment Process
### Initial Assessment
1. **Report Issue**: Issue is reported or identified
2. **Initial Triage**: Quick assessment of impact and urgency
3. **Priority Assignment**: Assign initial priority level
4. **Escalation**: Escalate if immediate attention is needed

### Priority Review
1. **Daily Review**: Review P0 and P1 items daily
2. **Weekly Review**: Review P2 items weekly
3. **Monthly Review**: Review P3 items monthly
4. **Priority Updates**: Update priorities based on new information

### Priority Escalation
1. **Trigger**: Issue not resolved within expected timeframe
2. **Assessment**: Reassess impact and urgency
3. **Escalation**: Escalate to next level
4. **Communication**: Notify stakeholders of escalation

## Priority Matrix
### Impact vs. Urgency Matrix
| Impact\Urgency | Low | Medium | High | Critical |
|----------------|-----|--------|------|----------|
| **Low** | P3 | P3 | P2 | P1 |
| **Medium** | P3 | P2 | P2 | P1 |
| **High** | P2 | P2 | P1 | P0 |
| **Critical** | P1 | P1 | P0 | P0 |

### Business Value vs. Effort Matrix
| Business Value\Effort | Low | Medium | High | Very High |
|----------------------|-----|--------|------|-----------|
| **Low** | P3 | P3 | P3 | P3 |
| **Medium** | P2 | P2 | P2 | P3 |
| **High** | P1 | P1 | P2 | P2 |
| **Critical** | P0 | P0 | P1 | P1 |

## Priority in Agile Context
### Sprint Planning
- **P0 Items**: Must be included in current sprint
- **P1 Items**: High priority for sprint planning
- **P2 Items**: Medium priority for sprint planning
- **P3 Items**: Low priority for sprint planning

### Backlog Grooming
- **P0 Items**: Always at top of backlog
- **P1 Items**: Top of backlog after P0
- **P2 Items**: Middle of backlog
- **P3 Items**: Bottom of backlog

### Capacity Planning
- **P0 Items**: 100% capacity allocation if needed
- **P1 Items**: 50-80% capacity allocation
- **P2 Items**: 20-50% capacity allocation
- **P3 Items**: 0-20% capacity allocation

## Priority Communication
### Stakeholder Updates
- **P0 Items**: Immediate notification and hourly updates
- **P1 Items**: Daily updates
- **P2 Items**: Weekly updates
- **P3 Items**: Monthly updates

### Team Communication
- **P0 Items**: Immediate team notification
- **P1 Items**: Daily standup focus
- **P2 Items**: Sprint planning focus
- **P3 Items**: Backlog grooming focus

### External Communication
- **P0 Items**: Customer notification if applicable
- **P1 Items**: Customer notification if applicable
- **P2 Items**: No customer notification required
- **P3 Items**: No customer notification required

## Priority Metrics & Reporting
### Key Metrics
- **Priority Distribution**: % of items by priority level
- **Resolution Time**: Average time to resolve by priority
- **Escalation Rate**: % of items escalated
- **Priority Accuracy**: % of items correctly prioritized

### Reporting Frequency
- **P0 Items**: Real-time reporting
- **P1 Items**: Daily reporting
- **P2 Items**: Weekly reporting
- **P3 Items**: Monthly reporting

### Dashboard Views
- **Priority Overview**: Summary of all priority levels
- **Priority Trends**: Changes in priority over time
- **Resolution Metrics**: Performance by priority level
- **Escalation Tracking**: Escalation patterns and trends

## Priority Best Practices
### Do's
- [Done] **Assess Impact First**: Always assess business impact before assigning priority
- [Done] **Consider User Impact**: Factor in user experience and satisfaction
- [Done] **Review Regularly**: Regularly review and update priorities
- [Done] **Communicate Clearly**: Clearly communicate priority levels to stakeholders
- [Done] **Document Decisions**: Document priority assignment decisions and rationale

### Don'ts
- [Missing] **Don't Over-Prioritize**: Don't mark everything as P0 or P1
- [Missing] **Don't Ignore Context**: Don't assign priority without understanding context
- [Missing] **Don't Set and Forget**: Don't assign priority and never review it
- [Missing] **Don't Skip Escalation**: Don't skip escalation when items aren't resolved
- [Missing] **Don't Ignore Stakeholders**: Don't assign priority without stakeholder input

## Priority Templates
### Priority Assignment Template
```
Issue: [Issue Title]
Reported By: [Reporter Name]
Date: [Date Reported]

Initial Assessment:
- Business Impact: [Low/Medium/High/Critical]
- User Impact: [Low/Medium/High/Critical]
- Urgency: [Low/Medium/High/Critical]
- Effort: [Low/Medium/High/Very High]

Priority Assignment:
- Priority Level: [P0/P1/P2/P3]
- Rationale: [Reason for priority assignment]
- Expected Resolution Time: [Expected timeframe]
- Escalation Criteria: [When to escalate]

Stakeholder Notification:
- [ ] Immediate notification required
- [ ] Daily updates required
- [ ] Weekly updates required
- [ ] Monthly updates required
```

### Priority Review Template
```
Priority Review: [Date]
Reviewer: [Reviewer Name]

Items Reviewed:
- P0 Items: [Count] - [Status]
- P1 Items: [Count] - [Status]
- P2 Items: [Count] - [Status]
- P3 Items: [Count] - [Status]

Priority Changes:
- [Item] - [Old Priority] → [New Priority] - [Reason]
- [Item] - [Old Priority] → [New Priority] - [Reason]

Escalations:
- [Item] - [Escalated to] - [Reason]
- [Item] - [Escalated to] - [Reason]

Next Review: [Date]
```

## Appendices
### A. Priority Decision Tree
[Flowchart for priority assignment decisions]

### B. Priority Examples by Category
[Examples of P0, P1, P2, P3 items by category]

### C. Escalation Procedures
[Detailed escalation procedures for each priority level]

### D. Priority Review Checklist
[Checklist for priority review meetings]

*Template: Customize for your specific project and team requirements*
