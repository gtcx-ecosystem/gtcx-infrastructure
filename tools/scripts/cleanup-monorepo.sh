#!/bin/bash
# GTCX Monorepo Cleanup Script
# Run from: /Users/amanianai/Sites/gtcx

set -e  # Exit on error

echo "=== GTCX Monorepo Cleanup ==="
echo ""

# Verify we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "protocols" ]; then
    echo "ERROR: Run this from the gtcx root directory"
    exit 1
fi

echo "Working directory: $(pwd)"
echo ""

# 1. Delete empty infrastructure/ (duplicate of infra/)
echo "1. Removing duplicate infrastructure/ directory..."
if [ -d "infrastructure" ]; then
    rm -rf infrastructure
    echo "   ✓ Deleted infrastructure/"
else
    echo "   - infrastructure/ already removed"
fi

# 2. Delete empty services/
echo "2. Removing empty services/ directory..."
if [ -d "services" ]; then
    rm -rf services
    echo "   ✓ Deleted services/"
else
    echo "   - services/ already removed"
fi

# 3. Move operations/* into platforms/operations/
echo "3. Consolidating operations/ into platforms/operations/..."
if [ -d "operations" ]; then
    mkdir -p platforms/operations
    # Move each subdirectory
    for dir in operations/*/; do
        if [ -d "$dir" ]; then
            name=$(basename "$dir")
            if [ ! -d "platforms/operations/$name" ]; then
                mv "$dir" "platforms/operations/"
                echo "   ✓ Moved $name to platforms/operations/"
            else
                echo "   - platforms/operations/$name already exists, skipping"
            fi
        fi
    done
    # Remove empty operations/ if successful
    rmdir operations 2>/dev/null && echo "   ✓ Removed empty operations/" || echo "   - operations/ not empty, check manually"
else
    echo "   - operations/ already moved or doesn't exist"
fi

# 4. Merge agentic/ into intelligence/agents/
echo "4. Merging agentic/ into intelligence/agents/..."
if [ -d "agentic" ]; then
    mkdir -p intelligence/agents
    # Copy contents (preserving agentic as backup until verified)
    cp -r agentic/* intelligence/agents/ 2>/dev/null || true
    echo "   ✓ Copied agentic/ contents to intelligence/agents/"
    echo "   ! Run 'rm -rf agentic' manually after verifying the merge"
else
    echo "   - agentic/ already merged or doesn't exist"
fi

# 5. Move migration templates to tools/templates/projects/
echo "5. Moving project templates from infra/migrations/..."
if [ -d "infra/migrations" ]; then
    mkdir -p tools/templates/projects
    
    for project in amani kora maba; do
        if [ -d "infra/migrations/$project" ]; then
            if [ ! -d "tools/templates/projects/$project" ]; then
                mv "infra/migrations/$project" "tools/templates/projects/"
                echo "   ✓ Moved $project to tools/templates/projects/"
            else
                echo "   - tools/templates/projects/$project already exists"
            fi
        fi
    done
else
    echo "   - infra/migrations/ doesn't exist"
fi

echo ""
echo "=== Cleanup Complete ==="
echo ""
echo "Remaining manual steps:"
echo "  1. Verify intelligence/agents/ merged correctly"
echo "  2. Run: rm -rf agentic  (if merge verified)"
echo "  3. Update pnpm-workspace.yaml if needed"
echo "  4. Run: pnpm install"
echo ""
