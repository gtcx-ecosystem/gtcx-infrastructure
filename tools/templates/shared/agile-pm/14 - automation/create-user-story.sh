#!/bin/bash
# create-user-story.sh - Generate user story from template
# Usage: ./create-user-story.sh <story-id> "<title>" <priority> [points]
# Example: ./create-user-story.sh TRADE-101 "User Authentication" P1 5

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Validate arguments
if [ $# -lt 3 ]; then
    echo -e "${RED}Error: Insufficient arguments${NC}"
    echo "Usage: $0 <story-id> \"<title>\" <priority> [points]"
    echo "Example: $0 TRADE-101 \"User Authentication\" P1 5"
    echo ""
    echo "Priority levels: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)"
    echo "Story points: 1, 2, 3, 5, 8, 13, 21 (Fibonacci scale)"
    exit 1
fi

STORY_ID=$1
STORY_TITLE=$2
PRIORITY=$3
POINTS=${4:-"0"}  # Default to 0 (unestimated)

# Validate priority
if [[ ! "$PRIORITY" =~ ^P[0-3]$ ]]; then
    echo -e "${RED}Error: Invalid priority level${NC}"
    echo "Valid priorities: P0, P1, P2, P3"
    exit 1
fi

# Validate story points if provided
if [ "$POINTS" != "0" ]; then
    if [[ ! "$POINTS" =~ ^(1|2|3|5|8|13|21)$ ]]; then
        echo -e "${YELLOW}Warning: Non-standard story points${NC}"
        echo "Standard Fibonacci scale: 1, 2, 3, 5, 8, 13, 21"
        read -p "Continue with $POINTS points? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Find agile-pm directory
AGILE_DIR=""
if [ -d "agile-pm" ]; then
    AGILE_DIR="agile-pm"
elif [ -d "../agile-pm" ]; then
    AGILE_DIR="../agile-pm"
elif [ -d "../../agile-pm" ]; then
    AGILE_DIR="../../agile-pm"
else
    echo -e "${RED}Error: Cannot find agile-pm directory${NC}"
    echo "Please run this script from within a GTCX project"
    exit 1
fi

# Create user stories directory if it doesn't exist
STORIES_DIR="$AGILE_DIR/06 - planning/user-stories"
mkdir -p "$STORIES_DIR"

# Check if story already exists
STORY_FILE="$STORIES_DIR/${STORY_ID}.md"
if [ -f "$STORY_FILE" ]; then
    echo -e "${YELLOW}Warning: Story $STORY_ID already exists${NC}"
    read -p "Overwrite existing story? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Generate story from template
echo -e "${BLUE}Creating user story: $STORY_ID${NC}"
echo "Title: $STORY_TITLE"
echo "Priority: $PRIORITY"
echo "Points: $POINTS"

# Determine priority description
case $PRIORITY in
    P0)
        PRIORITY_DESC="Critical - Must be completed immediately"
        RESPONSE_TIME="0-4 hours"
        ;;
    P1)
        PRIORITY_DESC="High - Complete within current sprint"
        RESPONSE_TIME="24 hours"
        ;;
    P2)
        PRIORITY_DESC="Medium - Complete within 2 sprints"
        RESPONSE_TIME="1 week"
        ;;
    P3)
        PRIORITY_DESC="Low - Nice to have"
        RESPONSE_TIME="As capacity allows"
        ;;
esac

# Create the user story
cat > "$STORY_FILE" << EOF
# 📝 User Story: $STORY_TITLE

## 📋 Story Details

**Story ID**: $STORY_ID  
**Priority**: $PRIORITY - $PRIORITY_DESC  
**Story Points**: $POINTS  
**Response Time**: $RESPONSE_TIME  
**Sprint**: [SPRINT_NUMBER]  
**Assignee**: [UNASSIGNED]  
**Status**: 📋 TODO  
**Created**: $(date '+%Y-%m-%d %H:%M:%S')  
**Updated**: $(date '+%Y-%m-%d %H:%M:%S')

---

## 👤 User Story

### As a...
[type of user]

### I want...
[functionality/feature]

### So that...
[benefit/value]

---

## ✅ Acceptance Criteria

### Must Have (Required for story completion)
- [ ] [Specific, testable requirement 1]
- [ ] [Specific, testable requirement 2]
- [ ] [Specific, testable requirement 3]
- [ ] [Specific, testable requirement 4]

### Should Have (Important but not critical)
- [ ] [Additional requirement 1]
- [ ] [Additional requirement 2]

### Could Have (Nice to have if time permits)
- [ ] [Optional enhancement 1]
- [ ] [Optional enhancement 2]

---

## 🎯 Definition of Done

### Development
- [ ] Code implementation complete
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written and passing
- [ ] Code reviewed and approved by at least 1 team member
- [ ] No critical or high severity security issues

### Documentation
- [ ] API documentation updated (if applicable)
- [ ] User documentation updated (if applicable)
- [ ] Inline code comments added for complex logic
- [ ] README updated with new features/changes

### Quality
- [ ] Passes all linting rules
- [ ] No console.log statements in production code
- [ ] Performance benchmarks met
- [ ] Accessibility requirements met (if UI changes)
- [ ] Cross-browser testing completed (if UI changes)

### Deployment
- [ ] Deployed to staging environment
- [ ] Smoke tests passing in staging
- [ ] Product Owner approval received
- [ ] Release notes prepared

---

## 🔧 Technical Details

### Implementation Approach
[Describe the technical approach to implement this story]

### Architecture Impact
[Describe any impacts on system architecture]

### Dependencies
- [ ] [Dependency 1 - e.g., another story, external service]
- [ ] [Dependency 2]

### API Changes
[List any API changes required]

### Database Changes
[List any database schema changes]

### Security Considerations
[List security aspects to consider]

---

## 📱 User Experience

### UI/UX Requirements
[Describe UI/UX requirements and considerations]

### Mobile Considerations
[Specific mobile requirements]

### Accessibility Requirements
[WCAG compliance needs]

### Offline Behavior
[How should this work offline?]

---

## 🧪 Test Scenarios

### Happy Path
1. [Step 1]
2. [Step 2]
3. [Expected result]

### Edge Cases
1. **Scenario**: [Edge case description]
   - **Input**: [Input data]
   - **Expected**: [Expected behavior]

2. **Scenario**: [Another edge case]
   - **Input**: [Input data]
   - **Expected**: [Expected behavior]

### Error Scenarios
1. **Scenario**: [Error condition]
   - **Trigger**: [What causes the error]
   - **Expected**: [How system should handle it]

---

## 📊 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| [Metric 1] | [Target value] | [How to measure] |
| [Metric 2] | [Target value] | [How to measure] |
| Performance | [<X seconds] | [Load testing] |
| Error Rate | [<X%] | [Monitoring] |

---

## ⚠️ Risks & Mitigation

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| [Risk 1] | Low/Medium/High | Low/Medium/High | [How to mitigate] |
| [Risk 2] | Low/Medium/High | Low/Medium/High | [How to mitigate] |

---

## 🔗 Related Items

### Related Stories
- [Related story ID and title]
- [Related story ID and title]

### Related Documentation
- [Link to design doc]
- [Link to API spec]
- [Link to architecture diagram]

### Related PRs
- [PR link when available]

---

## 💬 Discussion & Notes

### Open Questions
- [ ] [Question that needs answering]
- [ ] [Another question]

### Decisions Made
- [Decision 1 and rationale]
- [Decision 2 and rationale]

### Notes
[Any additional notes or context]

---

## 📝 Activity Log

| Date | Action | By | Notes |
|------|--------|-----|-------|
| $(date '+%Y-%m-%d') | Story created | [YOUR_NAME] | Initial creation |

---

## ✅ Story Checklist

### Before Starting
- [ ] Story is clear and well-defined
- [ ] Acceptance criteria are specific and testable
- [ ] Dependencies are identified and available
- [ ] Technical approach is defined
- [ ] Team has capacity to complete

### During Development
- [ ] Regular updates to this story document
- [ ] Blockers communicated immediately
- [ ] Tests written alongside code
- [ ] Documentation updated as needed

### Before Closing
- [ ] All acceptance criteria met
- [ ] Definition of Done completed
- [ ] Documentation updated
- [ ] Product Owner approval received
- [ ] Story demo completed

---

*Template Version: 2.0 | Story Created: $(date '+%Y-%m-%d %H:%M:%S')*
EOF

echo -e "${GREEN}✅ User story created successfully!${NC}"
echo "Location: $STORY_FILE"
echo ""

# Add to current sprint if exists
CURRENT_SPRINT="$AGILE_DIR/06 - planning/current-sprint.md"
if [ -f "$CURRENT_SPRINT" ]; then
    echo -e "${YELLOW}Would you like to add this story to the current sprint?${NC}"
    read -p "(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "- [ ] **$STORY_ID**: $STORY_TITLE ($PRIORITY, $POINTS points)" >> "$CURRENT_SPRINT"
        echo -e "${GREEN}✓ Added to current sprint${NC}"
    fi
fi

# Update backlog
BACKLOG="$AGILE_DIR/06 - planning/product-backlog.md"
if [ ! -f "$BACKLOG" ]; then
    # Create backlog if it doesn't exist
    cat > "$BACKLOG" << EOF
# Product Backlog

## Priority: P0 (Critical)

## Priority: P1 (High)

## Priority: P2 (Medium)

## Priority: P3 (Low)

---
*Last Updated: $(date '+%Y-%m-%d %H:%M:%S')*
EOF
fi

# Add to appropriate priority section in backlog
case $PRIORITY in
    P0)
        sed -i.bak "/## Priority: P0/a\\
- [ ] **$STORY_ID**: $STORY_TITLE ($POINTS points)" "$BACKLOG"
        ;;
    P1)
        sed -i.bak "/## Priority: P1/a\\
- [ ] **$STORY_ID**: $STORY_TITLE ($POINTS points)" "$BACKLOG"
        ;;
    P2)
        sed -i.bak "/## Priority: P2/a\\
- [ ] **$STORY_ID**: $STORY_TITLE ($POINTS points)" "$BACKLOG"
        ;;
    P3)
        sed -i.bak "/## Priority: P3/a\\
- [ ] **$STORY_ID**: $STORY_TITLE ($POINTS points)" "$BACKLOG"
        ;;
esac

# Clean up backup files
rm -f "$BACKLOG.bak"

echo -e "${GREEN}✓ Added to product backlog${NC}"
echo ""
echo "Next steps:"
echo "1. Edit the story: $STORY_FILE"
echo "2. Fill in the user story statement (As a... I want... So that...)"
echo "3. Define specific acceptance criteria"
echo "4. Add technical details"
echo "5. Assign to a team member"
echo ""
echo -e "${BLUE}Tip: Use 'code \"$STORY_FILE\"' to open in VS Code${NC}"