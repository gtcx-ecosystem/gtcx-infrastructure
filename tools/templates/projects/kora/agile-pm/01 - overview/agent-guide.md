# AI Agent Guide for GTCX Agile System

## Purpose
This guide helps AI agents understand and work effectively within the GTCX agile ecosystem, following established protocols and best practices.

## Core Principles
- **Work within designated folders only** - Never create files outside the project scope
- **Follow naming conventions** - Use lowercase for all files except README.md
- **Commit frequently** - Small, incremental commits with clear messages
- **Respect existing structure** - Don't modify files without understanding their purpose

## Agile Framework Understanding
### Sprint Structure
- **Sprint Duration**: 2 weeks (10 working days)
- **Ceremonies**: Planning, Daily Standup, Review, Retrospective
- **Artifacts**: Backlog, Sprint Backlog, Increment

### User Story Format
```
As a [user type]
I want [functionality]
So that [benefit/value]
```

### Acceptance Criteria
- Must be testable
- Clear and unambiguous
- Business-focused
- Measurable outcomes

## File Organization Rules
### Allowed Locations
[Done] **Within project folder**: `agile/`, `src/`, `docs/`
[Done] **Within designated subdirectories**: `templates/`, `guides/`, `processes/`

[Missing] **Never create in**: System root, parent directories, unrelated folders

### Naming Conventions
- **Files**: lowercase-with-hyphens.md
- **Directories**: lowercase-with-hyphens/
- **README files**: README.md (capitalized)

## Workflow Protocols
### Before Making Changes
1. **Verify location** - Confirm you're in the correct project folder
2. **Check existing** - Review what's already there
3. **Plan structure** - Design your changes before implementing

### During Implementation
1. **Create incrementally** - Build step by step
2. **Test locally** - Ensure changes work as expected
3. **Document changes** - Update relevant documentation

### After Changes
1. **Commit immediately** - Don't leave changes uncommitted
2. **Push to remote** - Keep repository synchronized
3. **Verify structure** - Confirm no files were misplaced

## Template Usage
### When to Use Templates
- **New projects** - Copy the entire `agile/` folder
- **New features** - Use appropriate template from `templates/`
- **New processes** - Follow established protocols

### Template Customization
- Replace placeholder text `[PLACEHOLDER]`
- Update project-specific information
- Maintain consistent formatting
- Add project-specific examples

## Quality Standards
### Documentation Quality
- Clear, concise language
- Consistent formatting
- Proper markdown syntax
- Meaningful examples

### Code Quality (if applicable)
- Follow project coding standards
- Include error handling
- Add appropriate comments
- Test functionality

## Common Tasks & Commands
### File Operations
```bash
# Create new directory
mkdir -p new-feature-folder

# Create new file
touch new-file.md

# Move files (within project only)
mv old-location/file.md new-location/
```

### Git Operations
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "feat: add new agile template"

# Push to remote
git push origin main
```

## Error Prevention
### Common Mistakes to Avoid
- [Missing] Creating files in wrong locations
- [Missing] Modifying files without understanding context
- [Missing] Breaking existing structure
- [Missing] Using wrong naming conventions
- [Missing] Leaving changes uncommitted

### Validation Checklist
- Files are in correct project folder
- Naming follows conventions
- Changes are committed
- Structure remains intact
- Documentation is updated

## Support & Escalation
### When to Ask for Help
- Unclear project requirements
- Complex structural changes needed
- Integration with existing systems
- Security or compliance concerns

### Escalation Process
1. **Document the issue** - What you're trying to do
2. **Explain your approach** - How you planned to solve it
3. **Request guidance** - Specific questions or concerns

*This guide ensures AI agents work effectively and safely within the GTCX agile ecosystem*
