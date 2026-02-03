# Automation Scripts & Tools

## Purpose
This section contains automation scripts and tools to streamline agile processes, reduce manual work, and ensure consistency across the GTCX ecosystem.

## Available Scripts

### Project Initialization
- `init-project.sh` - Initialize new project with agile-pm structure
- `setup-templates.sh` - Copy all templates to project
- `configure-project.sh` - Set up project-specific configurations

### Story Management
- `create-user-story.sh` - Generate user story from template
- `create-epic.sh` - Create epic with linked stories
- `estimate-stories.sh` - Bulk story point estimation
- `prioritize-backlog.sh` - Auto-prioritize based on rules

### Sprint Management
- `start-sprint.sh` - Initialize new sprint
- `close-sprint.sh` - Close sprint and generate reports
- `sprint-velocity.sh` - Calculate sprint velocity
- `burndown-chart.sh` - Generate burndown chart

### Reporting
- `generate-sprint-report.sh` - Create sprint report
- `generate-status-report.sh` - Weekly status report
- `generate-metrics-dashboard.sh` - Metrics dashboard
- `generate-retrospective.sh` - Retrospective summary

### Quality Assurance
- `run-quality-checks.sh` - Run all quality gates
- `check-documentation.sh` - Verify documentation completeness
- `validate-stories.sh` - Validate user story format
- `test-coverage-report.sh` - Generate test coverage report

### Cross-Project Tools
- `sync-templates.sh` - Sync templates across projects
- `ecosystem-status.sh` - Generate ecosystem-wide status
- `dependency-check.sh` - Check cross-project dependencies
- `update-all-projects.sh` - Batch update all projects


## Quick Start Scripts

### Initialize New Project
```bash
#!/bin/bash
# init-project.sh - Initialize new GTCX project with agile-pm

PROJECT_NAME=$1
PROJECT_TYPE=$2  # protocol|platform|service|mobile

if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: ./init-project.sh <project-name> <project-type>"
    exit 1
fi

echo "🚀 Initializing GTCX project: $PROJECT_NAME"

# Create project structure
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Copy agile-pm template
cp -r ../agile-pm-master-template/agile-pm .

# Customize for project
find agile-pm -type f -name "*.md" -exec sed -i '' "s/\[PROJECT_NAME\]/$PROJECT_NAME/g" {} \;
find agile-pm -type f -name "*.md" -exec sed -i '' "s/\[PROJECT_TYPE\]/$PROJECT_TYPE/g" {} \;

# Initialize git
git init
git add .
git commit -m "feat: initialize $PROJECT_NAME with agile-pm structure"

echo "✅ Project $PROJECT_NAME initialized successfully!"
echo "📁 Navigate to: cd $PROJECT_NAME/agile-pm"
echo "📚 Start with: cat agile-pm/README.md"
```

### Create User Story
```bash
#!/bin/bash
# create-user-story.sh - Generate user story from template

STORY_ID=$1
STORY_TITLE=$2
PRIORITY=$3

if [ -z "$STORY_ID" ]; then
    echo "Usage: ./create-user-story.sh <story-id> <title> <priority>"
    echo "Example: ./create-user-story.sh TRADE-101 'User Authentication' P1"
    exit 1
fi

STORY_FILE="agile-pm/06 - planning/user-stories/${STORY_ID}.md"

# Copy template
cp agile-pm/06\ -\ planning/user-story-template.md "$STORY_FILE"

# Replace placeholders
sed -i '' "s/\[STORY-ID\]/$STORY_ID/g" "$STORY_FILE"
sed -i '' "s/\[PROJECT_NAME\]/$STORY_TITLE/g" "$STORY_FILE"
sed -i '' "s/\[P0\/P1\/P2\/P3\]/$PRIORITY/g" "$STORY_FILE"

# Add timestamp
echo "Created: $(date)" >> "$STORY_FILE"

echo "✅ User story created: $STORY_FILE"
echo "📝 Edit the story: code '$STORY_FILE'"
```

### Generate Sprint Report
```bash
#!/bin/bash
# generate-sprint-report.sh - Generate comprehensive sprint report

SPRINT_NUMBER=$1
OUTPUT_FILE="agile-pm/reports/sprint-${SPRINT_NUMBER}-report.md"

if [ -z "$SPRINT_NUMBER" ]; then
    echo "Usage: ./generate-sprint-report.sh <sprint-number>"
    exit 1
fi

mkdir -p agile-pm/reports

cat > "$OUTPUT_FILE" << EOF
# Sprint $SPRINT_NUMBER Report
**Generated**: $(date)

## Sprint Overview
- **Sprint**: $SPRINT_NUMBER
- **Duration**: 2 weeks
- **Start Date**: [START_DATE]
- **End Date**: [END_DATE]
- **Sprint Goal**: [SPRINT_GOAL]

## Metrics
EOF

# Calculate metrics
COMPLETED=$(find agile-pm/06\ -\ planning/user-stories -name "*.md" -exec grep -l "\[x\]" {} \; | wc -l)
TOTAL=$(find agile-pm/06\ -\ planning/user-stories -name "*.md" | wc -l)
VELOCITY=$(grep "story points" agile-pm/06\ -\ planning/current-sprint.md | awk '{sum+=$1} END {print sum}')

cat >> "$OUTPUT_FILE" << EOF
- **Stories Completed**: $COMPLETED
- **Total Stories**: $TOTAL
- **Velocity**: $VELOCITY story points
- **Completion Rate**: $(( COMPLETED * 100 / TOTAL ))%

## Completed Items
EOF

# List completed stories
find agile-pm/06\ -\ planning/user-stories -name "*.md" -exec grep -l "\[x\]" {} \; | while read story; do
    echo "- ✅ $(basename $story .md)" >> "$OUTPUT_FILE"
done

cat >> "$OUTPUT_FILE" << EOF

## Pending Items
EOF

# List pending stories
find agile-pm/06\ -\ planning/user-stories -name "*.md" -exec grep -L "\[x\]" {} \; | while read story; do
    echo "- ⏳ $(basename $story .md)" >> "$OUTPUT_FILE"
done

cat >> "$OUTPUT_FILE" << EOF

## Blockers & Issues
- [List any blockers]

## Lessons Learned
- [What went well]
- [What could improve]

## Next Sprint Planning
- [Key items for next sprint]
EOF

echo "✅ Sprint report generated: $OUTPUT_FILE"
```


## Metrics Generation Scripts

### Sprint Velocity Calculator
```javascript
// sprint-velocity.js - Calculate sprint velocity trends

const fs = require('fs');
const path = require('path');

function calculateVelocity(sprintNumber) {
    const sprintDir = `agile-pm/sprints/sprint-${sprintNumber}`;
    const stories = fs.readdirSync(`${sprintDir}/completed`);
    
    let totalPoints = 0;
    stories.forEach(story => {
        const content = fs.readFileSync(`${sprintDir}/completed/${story}`, 'utf8');
        const points = content.match(/Story Points: (\d+)/);
        if (points) totalPoints += parseInt(points[1]);
    });
    
    return totalPoints;
}

// Calculate last 5 sprints
const velocities = [];
for (let i = 1; i <= 5; i++) {
    velocities.push({
        sprint: i,
        velocity: calculateVelocity(i)
    });
}

// Generate report
console.log('Sprint Velocity Trend:');
velocities.forEach(v => {
    console.log(`Sprint ${v.sprint}: ${'█'.repeat(v.velocity)} ${v.velocity} points`);
});

// Calculate average
const avg = velocities.reduce((sum, v) => sum + v.velocity, 0) / velocities.length;
console.log(`\nAverage Velocity: ${avg.toFixed(1)} points`);
```

### Cross-Project Dashboard Generator
```python
#!/usr/bin/env python3
# ecosystem-dashboard.py - Generate ecosystem-wide dashboard

import os
import json
from datetime import datetime

def scan_project(project_path):
    """Scan a project for metrics"""
    metrics = {
        'name': os.path.basename(project_path),
        'stories': 0,
        'completed': 0,
        'p0': 0,
        'p1': 0,
        'p2': 0,
        'p3': 0,
        'test_coverage': 0,
        'last_updated': None
    }
    
    # Count stories
    stories_path = f"{project_path}/agile-pm/06 - planning/user-stories"
    if os.path.exists(stories_path):
        stories = os.listdir(stories_path)
        metrics['stories'] = len(stories)
        
        for story in stories:
            with open(f"{stories_path}/{story}", 'r') as f:
                content = f.read()
                if '[x]' in content:
                    metrics['completed'] += 1
                if 'Priority: P0' in content:
                    metrics['p0'] += 1
                elif 'Priority: P1' in content:
                    metrics['p1'] += 1
                elif 'Priority: P2' in content:
                    metrics['p2'] += 1
                elif 'Priority: P3' in content:
                    metrics['p3'] += 1
    
    # Get last updated
    git_log = os.popen(f"cd {project_path} && git log -1 --format=%cd").read()
    metrics['last_updated'] = git_log.strip()
    
    return metrics

def generate_dashboard():
    """Generate markdown dashboard"""
    projects = [
        'gtcx-ecosystem-protocols',
        'gtcx-ecosystem-platforms',
        'gtcx-ecosystem-services',
        'gtcx-ecosystem-mobile'
    ]
    
    dashboard = f"""# GTCX Ecosystem Dashboard
**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Project Status Overview

| Project | Stories | Completed | P0 | P1 | P2 | P3 | Last Updated |
|---------|---------|-----------|----|----|----|----|--------------|
"""
    
    for project in projects:
        if os.path.exists(project):
            m = scan_project(project)
            dashboard += f"| {m['name']} | {m['stories']} | {m['completed']} ({m['completed']*100//max(m['stories'],1)}%) | {m['p0']} | {m['p1']} | {m['p2']} | {m['p3']} | {m['last_updated'][:10]} |\n"
    
    return dashboard

if __name__ == "__main__":
    dashboard = generate_dashboard()
    with open('ecosystem-dashboard.md', 'w') as f:
        f.write(dashboard)
    print("✅ Dashboard generated: ecosystem-dashboard.md")
```


## Utility Scripts

### Template Sync Script
```bash
#!/bin/bash
# sync-templates.sh - Sync templates across all projects

MASTER_TEMPLATE="gtcx-ecosystem-agile/agile-pm"
PROJECTS=$(ls -d gtcx-ecosystem-*)

echo "🔄 Syncing templates from master: $MASTER_TEMPLATE"

for project in $PROJECTS; do
    if [ -d "$project/agile-pm" ]; then
        echo "Updating: $project"
        
        # Backup current
        cp -r "$project/agile-pm" "$project/agile-pm.backup"
        
        # Sync templates only (preserve project-specific content)
        rsync -av --include="*template.md" --include="*/" --exclude="*" \
            "$MASTER_TEMPLATE/" "$project/agile-pm/"
        
        echo "✅ Updated: $project"
    fi
done

echo "🎉 Template sync complete!"
```

### Quality Gate Validator
```bash
#!/bin/bash
# quality-gates.sh - Check if project meets quality gates

PROJECT=$1

if [ -z "$PROJECT" ]; then
    echo "Usage: ./quality-gates.sh <project-name>"
    exit 1
fi

echo "🔍 Checking quality gates for: $PROJECT"

PASSED=0
FAILED=0

# Check test coverage
COVERAGE=$(cd $PROJECT && npm run test:coverage 2>/dev/null | grep "All files" | awk '{print $10}' | sed 's/%//')
if [ "$COVERAGE" -ge 80 ]; then
    echo "✅ Test coverage: ${COVERAGE}% (>80%)"
    ((PASSED++))
else
    echo "❌ Test coverage: ${COVERAGE}% (<80%)"
    ((FAILED++))
fi

# Check documentation
if [ -f "$PROJECT/README.md" ] && [ -d "$PROJECT/agile-pm" ]; then
    echo "✅ Documentation: Present"
    ((PASSED++))
else
    echo "❌ Documentation: Missing"
    ((FAILED++))
fi

# Check for console.log
CONSOLE_LOGS=$(grep -r "console.log" $PROJECT/src 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -eq 0 ]; then
    echo "✅ Console logs: None found"
    ((PASSED++))
else
    echo "❌ Console logs: $CONSOLE_LOGS found"
    ((FAILED++))
fi

# Check TypeScript strict
if grep -q '"strict": true' "$PROJECT/tsconfig.json" 2>/dev/null; then
    echo "✅ TypeScript strict: Enabled"
    ((PASSED++))
else
    echo "❌ TypeScript strict: Not enabled"
    ((FAILED++))
fi

echo ""
echo "📊 Results: $PASSED passed, $FAILED failed"

if [ "$FAILED" -eq 0 ]; then
    echo "🎉 All quality gates passed!"
    exit 0
else
    echo "⚠️ Some quality gates failed. Please fix before proceeding."
    exit 1
fi
```


## Script Usage Guide

### Installation
```bash
# Make scripts executable
chmod +x agile-pm/14\ -\ automation/*.sh

# Add to PATH for easy access
export PATH="$PATH:$(pwd)/agile-pm/14 - automation"
```

### Daily Workflow Integration
```bash
# Morning routine
./ecosystem-status.sh          # Check overall status
./check-priorities.sh          # Review P0/P1 items

# During development
./create-user-story.sh         # Create new stories
./update-story-status.sh       # Update progress

# End of day
./generate-status-report.sh    # Daily status
./commit-and-push.sh          # Safe commit workflow
```

### Sprint Ceremonies
```bash
# Sprint planning
./start-sprint.sh 15           # Start sprint 15
./estimate-stories.sh          # Bulk estimation

# Sprint review
./generate-sprint-report.sh 14 # Review sprint 14
./sprint-velocity.sh           # Check velocity

# Retrospective
./generate-retrospective.sh 14 # Retro for sprint 14
```


## Continuous Improvement

### Adding New Scripts
1. Create script in this directory
2. Make it executable
3. Add documentation here
4. Test across projects
5. Share with team

### Script Standards
- Use clear, descriptive names
- Include usage instructions
- Add error handling
- Make idempotent (safe to run multiple times)
- Document dependencies

### Contribution Guidelines
```bash
# Script template
#!/bin/bash
# script-name.sh - Brief description
# Usage: ./script-name.sh <args>
# Dependencies: tool1, tool2

set -e  # Exit on error

# Validate inputs
if [ -z "$1" ]; then
    echo "Usage: $0 <argument>"
    exit 1
fi

# Main logic
echo "🚀 Starting process..."
# ... implementation ...
echo "✅ Complete!"
```


*These automation scripts accelerate agile processes and ensure consistency across the GTCX ecosystem.*
