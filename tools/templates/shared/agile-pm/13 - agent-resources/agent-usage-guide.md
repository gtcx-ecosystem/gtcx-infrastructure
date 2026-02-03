# GTCX Agent Guide: How to Use the Agile-PM System
*Practical Instructions for AI Agents Working with GTCX's Agile-PM Structure*

## Quick Reference: What is Agile-PM?

**Location**: `[project]/agile-pm/` folder in every GTCX protocol/service  
**Purpose**: Provides templates, guides, and structure for consistent project management  
**Your Role**: Use these templates to understand context, track work, and maintain quality  


## Agent Workflow: Start Here

### Step 1: Understand Your Project Context
```bash
# First, navigate to the project's agile-pm folder
cd gtcx-ecosystem-protocols/[project-name]/agile-pm/

# Read these files IN ORDER:
1. README.md                          # Overview of the system
2. 04 - spec/project-specification-template.md  # What this project does
3. 02 - vision/prd-template.md       # Business requirements
4. 06 - planning/priority-framework.md  # Current priorities
```

### Step 2: Check Current Sprint Status
```bash
# Look for current work in planning folder
cd 06 - planning/

# Check for:
- current-sprint.md      # What's being worked on now
- sprint-backlog.md      # Upcoming work items
- user-stories/          # Detailed requirements
```

### Step 3: Understand Your Task
```yaml
Before_Coding:
  1. Find the user story for your task
  2. Read acceptance criteria carefully
  3. Check Definition of Done
  4. Note any dependencies
  5. Understand priority level (P0-P3)
```


## How to Use Each Agile-PM Section

### 01 - Overview: Your Starting Point
```typescript
// Use this section to:
interface OverviewUsage {
  quickLinks: "Find important documents fast";
  agentGuide: "Understand AI-specific rules";
  templateCatalog: "See all available templates";
  navigation: "Know where everything is";
}

// Key file: agent-guide.md
// THIS IS YOUR BIBLE - Read it first!
```

### 02 - Vision: Understanding the Why
```typescript
// Use this section to:
interface VisionUsage {
  productRequirements: "Understand what to build";
  businessValue: "Know why it matters";
  successMetrics: "Understand how success is measured";
  roiCalculations: "See the business case";
}

// Before implementing ANY feature, check:
// - Does this align with the PRD?
// - Does this support the vision?
```

### 03 - Design: User Experience Context
```typescript
// Use this section to:
interface DesignUsage {
  userJourneys: "Understand user workflows";
  designSystem: "Follow UI/UX patterns";
  accessibility: "Ensure inclusive design";
  mobileFirst: "Consider mobile users";
}

// When building UI components:
// - Follow design-system-template.md
// - Check user-journey-maps-template.md
```

### 04 - Spec: Technical Requirements
```typescript
// Use this section to:
interface SpecUsage {
  architecture: "Understand system design";
  apiSpecs: "Follow API patterns";
  deployment: "Know infrastructure needs";
  technicalDocs: "Get implementation details";
}

// CRITICAL: Always check these before coding:
// - technical-architecture-template.md
// - api-specification-template.md
// - system-architecture-spec-template.md
```

### 05 - Roadmap: Long-term Planning
```typescript
// Use this section to:
interface RoadmapUsage {
  epics: "See major features coming";
  dependencies: "Understand what blocks what";
  timeline: "Know delivery expectations";
  milestones: "Track progress markers";
}

// Check for dependencies before starting work
```

### 06 - Planning: Your Daily Guide
```typescript
// THIS IS YOUR MOST IMPORTANT SECTION
interface PlanningUsage {
  userStories: "Get detailed requirements";
  priorities: "Know what's urgent (P0-P3)";
  sprintPlanning: "Current sprint work";
  definitionOfDone: "Completion criteria";
  testPlans: "QA requirements";
}

// Daily workflow:
// 1. Check priority-framework.md for P0/P1 items
// 2. Read user-story-template.md for your task
// 3. Follow definition-of-done.md for completion
```

### 07 - Backend: API & Service Patterns
```typescript
// Use this section for:
interface BackendUsage {
  apiPatterns: "How to structure endpoints";
  serviceArchitecture: "Microservice design";
  databaseSchemas: "Data structure patterns";
  integrations: "External service connections";
}
```

### 08 - Frontend: UI Implementation
```typescript
// Use this section for:
interface FrontendUsage {
  componentStructure: "React/Vue patterns";
  screenInventory: "All UI screens";
  frontendRoadmap: "UI development plan";
  mobileConsiderations: "Mobile-specific needs";
}
```

### 09 - Security: Critical Requirements
```typescript
// Use this section for:
interface SecurityUsage {
  authPatterns: "Authentication/authorization";
  encryptionRequirements: "Data protection";
  vulnerabilityPrevention: "Security best practices";
  auditRequirements: "Logging needs";
}

// NEVER skip security requirements!
```

### 10 - Compliance: Regulatory Needs
```typescript
// Use this section for:
interface ComplianceUsage {
  regulatoryRequirements: "Legal compliance";
  dataPrivacy: "GDPR/privacy laws";
  auditTrails: "Compliance logging";
  certificationNeeds: "Required certifications";
}
```

### 11 - Support: Documentation
```typescript
// Use this section for:
interface SupportUsage {
  userGuides: "End-user documentation";
  apiDocs: "Developer documentation";
  troubleshooting: "Common issues";
  faqs: "Frequently asked questions";
}

// Update docs when you change functionality!
```

### 12 - GTM: Business Context
```typescript
// Use this section for:
interface GTMUsage {
  marketStrategy: "Go-to-market plans";
  communityBuilding: "User engagement";
  partnerships: "Integration partners";
  revenuePlans: "Monetization strategy";
}
```

### 13 - Agent Resources: Your Specific Guidelines
```typescript
// NEW SECTION SPECIFICALLY FOR AGENTS
interface AgentResourcesUsage {
  safetyRules: "Critical do's and don'ts";
  behavioralConfig: "How to behave";
  workflowPatterns: "Common patterns";
  errorPrevention: "Mistakes to avoid";
  quickCommands: "Essential shortcuts";
}

// ALWAYS START HERE AS AN AGENT!
```

### 14 - Automation: Scripts & Tools
```typescript
// Use this section for:
interface AutomationUsage {
  initScripts: "Project setup automation";
  storyGenerators: "Create stories from templates";
  reportGenerators: "Sprint/status reports";
  dashboardScripts: "Generate metrics";
}
```

### 15 - Metrics & Dashboards: Tracking Progress
```typescript
// Use this section for:
interface MetricsUsage {
  velocityTracking: "Sprint velocity metrics";
  qualityMetrics: "Code quality indicators";
  progressDashboards: "Visual progress tracking";
  crossProjectMetrics: "Ecosystem-wide view";
}
```


## Agent Development Workflow

### For New Features
```bash
# 1. Start in planning folder
cd agile-pm/06\ -\ planning/

# 2. Create a new user story
cp user-story-template.md user-stories/my-new-feature.md

# 3. Fill out the template
- Replace all [PLACEHOLDER] text
- Define clear acceptance criteria
- Set appropriate priority (P0-P3)
- Include test scenarios

# 4. Update the sprint backlog
echo "- [ ] My New Feature (P2) - 5 points" >> sprint-backlog.md

# 5. Begin implementation
# Follow the technical specs in 04 - spec/
```

### For Bug Fixes
```bash
# 1. Check priority level
cd agile-pm/06\ -\ planning/
cat priority-framework.md

# 2. Assess the bug
- P0: Critical - Fix immediately
- P1: High - Fix within 24 hours
- P2: Medium - Fix within sprint
- P3: Low - Add to backlog

# 3. Document the fix
echo "### Bug Fix: [Description]
Priority: [P0-P3]
Impact: [Description]
Resolution: [What was fixed]
Testing: [How it was tested]" >> bug-fixes.md

# 4. Update relevant documentation
```

### For Documentation Updates
```bash
# 1. Identify what needs updating
- Code changes → Update 04 - spec/
- UI changes → Update 08 - frontend/
- API changes → Update 07 - backend/
- User guides → Update 11 - support/

# 2. Use the appropriate template
cd agile-pm/[relevant-folder]/

# 3. Update markdown files
- Keep formatting consistent
- Update version numbers
- Add change history

# 4. Commit with clear message
git commit -m "docs: update API specification for new endpoint"
```


## Understanding Priorities

### Priority Quick Reference
```yaml
P0_Critical:
  Response: "Drop everything, fix now"
  Timeline: "0-4 hours"
  Examples: "System down, data loss, security breach"
  Action: "Immediate escalation"

P1_High:
  Response: "Fix within 24 hours"
  Timeline: "4-24 hours"
  Examples: "Major feature broken, integration failure"
  Action: "Prioritize over P2/P3"

P2_Medium:
  Response: "Fix within sprint"
  Timeline: "1-7 days"
  Examples: "Minor bugs, performance issues"
  Action: "Normal development cycle"

P3_Low:
  Response: "When resources allow"
  Timeline: "1-4 weeks"
  Examples: "Nice-to-have features, minor improvements"
  Action: "Add to backlog"
```


## Quality Checklist for Agents

### Before Starting Work
- Read project specification in `04 - spec/`
- Check current priorities in `06 - planning/priority-framework.md`
- Review user story and acceptance criteria
- Understand Definition of Done
- Check for dependencies

### During Development
- Follow patterns from `04 - spec/technical-architecture-template.md`
- Use API patterns from `07 - backend/`
- Apply security requirements from `09 - security/`
- Consider compliance needs from `10 - compliance/`
- Write tests according to `06 - planning/qa-test-plan-template.md`

### Before Committing
- Code meets Definition of Done
- Tests are passing
- Documentation is updated
- Security requirements met
- Acceptance criteria satisfied

### After Completion
- Update user story status
- Document in sprint notes
- Update relevant documentation
- Note any technical debt created
- Add to release notes if applicable


## Common Agent Mistakes to Avoid

### DON'T Do These:
```yaml
Mistakes_to_Avoid:
  1_Skipping_Context:
    Wrong: "Jump straight into coding"
    Right: "Read agile-pm docs first"
  
  2_Ignoring_Templates:
    Wrong: "Create ad-hoc documentation"
    Right: "Use provided templates"
  
  3_Missing_Priorities:
    Wrong: "Work on random features"
    Right: "Follow P0→P1→P2→P3 order"
  
  4_Breaking_Structure:
    Wrong: "Create files anywhere"
    Right: "Follow agile-pm folder structure"
  
  5_Incomplete_Work:
    Wrong: "Code without tests/docs"
    Right: "Follow Definition of Done"
```


## Pro Tips for Agents

### Efficiency Hacks
```bash
# Create aliases for common navigation
alias agile='cd agile-pm'
alias planning='cd agile-pm/06\ -\ planning'
alias spec='cd agile-pm/04\ -\ spec'
alias agent='cd agile-pm/13\ -\ agent-resources'

# Quick status check
alias status='cat agile-pm/06\ -\ planning/current-sprint.md'

# Priority check
alias priorities='cat agile-pm/06\ -\ planning/priority-framework.md | grep "P0\|P1"'

# Agent checklist
alias checklist='cat agile-pm/13\ -\ agent-resources/agent-checklist.md'
```

### Documentation Patterns
```markdown
# When updating docs, use this format:

## Change Log
**Date**: 2024-09-01
**Author**: AI Agent
**Changes**: 
- Updated API endpoint for user verification
- Added new error codes
- Fixed typo in response schema

## Version
Previous: 1.0.0
Current: 1.0.1
```

### Communication Template
```markdown
# When reporting progress:

## Task: [User Story ID]
**Status**: In Progress / Complete / Blocked
**Progress**: 70%
**Completed**:
- ✅ Implementation complete
- ✅ Unit tests written
- ⏳ Integration tests pending
**Blockers**: None
**Next Steps**: Complete integration tests
**ETA**: 2 hours
```


## Summary: Your Agile-PM Mantra

```yaml
As_an_AI_Agent_I_Will:
  1. "ALWAYS check agile-pm before starting work"
  2. "FOLLOW templates and patterns exactly"
  3. "RESPECT priorities (P0 > P1 > P2 > P3)"
  4. "UPDATE documentation as I work"
  5. "COMPLETE work according to Definition of Done"
  6. "MAINTAIN the folder structure"
  7. "COMMUNICATE using the templates"
  8. "TEST everything before marking complete"
  9. "SECURE by default, always"
  10. "ASK when uncertain rather than guess"
  11. "USE agent resources section for guidance" # NEW!
  12. "LEVERAGE automation scripts when available" # NEW!
```


## Quick Command Reference

```bash
# Navigation
cd [project]/agile-pm/            # Go to agile-pm
cd 06\ -\ planning/              # Go to planning
cd 04\ -\ spec/                  # Go to specifications
cd 13\ -\ agent-resources/       # Go to agent resources (NEW!)
cd 14\ -\ automation/            # Go to automation scripts (NEW!)
cd 15\ -\ metrics-dashboards/   # Go to metrics (NEW!)

# Reading key files
cat README.md                     # Understand structure
cat 13\ -\ agent-resources/agent-safety-rules.md  # Critical rules
cat priority-framework.md        # Current priorities
cat definition-of-done.md        # Completion criteria

# Creating new work
cp user-story-template.md user-stories/new-story.md
cp qa-test-plan-template.md test-plans/new-test.md

# Updating status
echo "- [x] Completed story" >> sprint-progress.md
echo "### Bug fixed: [description]" >> bug-fixes.md

# Using automation (NEW!)
./14\ -\ automation/init-project.sh     # Initialize new project
./14\ -\ automation/create-story.sh     # Generate user story
./14\ -\ automation/sprint-report.sh    # Generate sprint report
```


**Remember**: The agile-pm system is your guide to excellence. Use it, follow it, and maintain it. The new sections (13, 14, 15) provide additional agent-specific support and automation capabilities!

*This guide ensures AI agents work within GTCX's professional agile framework, maintaining quality and consistency across all development efforts.*
