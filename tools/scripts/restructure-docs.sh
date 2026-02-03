#!/bin/bash
# GTCX Documentation Restructure Script
# Run from the gtcx/ root directory
# 
# BACKUP FIRST: cp -r docs/ docs-backup/

set -e  # Exit on error

echo "🚀 GTCX Documentation Restructure"
echo "=================================="
echo ""

# Verify we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "docs" ]; then
    echo "❌ Error: Run this script from the gtcx/ root directory"
    exit 1
fi

echo "📁 Creating new structure..."

# ============================================
# PHASE 1: Create new directory structure
# ============================================

mkdir -p docs-new/01-getting-started
mkdir -p docs-new/02-architecture/decisions
mkdir -p docs-new/02-architecture/diagrams
mkdir -p docs-new/03-protocols
mkdir -p docs-new/04-platforms
mkdir -p docs-new/05-engineering
mkdir -p docs-new/06-deployment
mkdir -p docs-new/07-guides
mkdir -p docs-new/08-reference
mkdir -p docs-new/09-research
mkdir -p docs-new/10-internal/prds
mkdir -p docs-new/10-internal/runbooks
mkdir -p docs-new/10-internal/migrations

echo "✅ Created directory structure"

# ============================================
# PHASE 2: Migrate content
# ============================================

echo "📦 Migrating content..."

# --- 01-getting-started ---
# Merge both getting-started folders
if [ -d "docs/01-getting-started" ]; then
    cp -r docs/01-getting-started/* docs-new/01-getting-started/ 2>/dev/null || true
fi
if [ -d "docs/getting-started" ]; then
    cp -r docs/getting-started/* docs-new/01-getting-started/ 2>/dev/null || true
fi
echo "  ✓ 01-getting-started"

# --- 02-architecture ---
# Copy architecture folder contents
if [ -d "docs/architecture" ]; then
    # Copy decisions subfolder
    if [ -d "docs/architecture/decisions" ]; then
        cp -r docs/architecture/decisions/* docs-new/02-architecture/decisions/ 2>/dev/null || true
    fi
    # Copy diagrams subfolder
    if [ -d "docs/architecture/diagrams" ]; then
        cp -r docs/architecture/diagrams/* docs-new/02-architecture/diagrams/ 2>/dev/null || true
    fi
    # Copy all .md files at root of architecture
    cp docs/architecture/*.md docs-new/02-architecture/ 2>/dev/null || true
fi
# Move misplaced ADRs into decisions
mv docs-new/02-architecture/ADR-*.md docs-new/02-architecture/decisions/ 2>/dev/null || true
echo "  ✓ 02-architecture"

# --- 03-protocols ---
if [ -d "docs/02-protocols" ]; then
    cp -r docs/02-protocols/* docs-new/03-protocols/ 2>/dev/null || true
fi
# Also grab protocol specs
if [ -d "docs/specs/protocols" ]; then
    cp -r docs/specs/protocols/* docs-new/03-protocols/ 2>/dev/null || true
fi
echo "  ✓ 03-protocols"

# --- 04-platforms ---
if [ -d "docs/04-platforms" ]; then
    cp -r docs/04-platforms/* docs-new/04-platforms/ 2>/dev/null || true
fi
echo "  ✓ 04-platforms"

# --- 05-engineering ---
if [ -d "docs/engineering-manifesto" ]; then
    cp -r docs/engineering-manifesto/* docs-new/05-engineering/ 2>/dev/null || true
fi
echo "  ✓ 05-engineering"

# --- 06-deployment ---
if [ -d "docs/09-deployment" ]; then
    cp -r docs/09-deployment/* docs-new/06-deployment/ 2>/dev/null || true
fi
# Also grab deployment guide
if [ -f "docs/guides/deployment.md" ]; then
    cp docs/guides/deployment.md docs-new/06-deployment/ 2>/dev/null || true
fi
echo "  ✓ 06-deployment"

# --- 07-guides ---
if [ -d "docs/guides" ]; then
    cp -r docs/guides/* docs-new/07-guides/ 2>/dev/null || true
fi
# Merge 08-integration content (it's how-to content)
if [ -d "docs/08-integration" ]; then
    cp -r docs/08-integration/* docs-new/07-guides/ 2>/dev/null || true
fi
echo "  ✓ 07-guides"

# --- 08-reference ---
if [ -d "docs/10-reference" ]; then
    cp -r docs/10-reference/* docs-new/08-reference/ 2>/dev/null || true
fi
if [ -d "docs/reference" ]; then
    cp -r docs/reference/* docs-new/08-reference/ 2>/dev/null || true
fi
# Merge data-model content
if [ -d "docs/07-data-model" ]; then
    cp -r docs/07-data-model/* docs-new/08-reference/ 2>/dev/null || true
fi
echo "  ✓ 08-reference"

# --- 09-research ---
if [ -d "docs/research" ]; then
    cp -r docs/research/* docs-new/09-research/ 2>/dev/null || true
fi
echo "  ✓ 09-research"

# --- 10-internal ---
if [ -d "docs/prds" ]; then
    cp -r docs/prds/* docs-new/10-internal/prds/ 2>/dev/null || true
fi
if [ -d "docs/migrations" ]; then
    cp -r docs/migrations/* docs-new/10-internal/migrations/ 2>/dev/null || true
fi
# Copy specs that aren't protocols
if [ -d "docs/specs" ]; then
    cp docs/specs/*.md docs-new/10-internal/ 2>/dev/null || true
fi
echo "  ✓ 10-internal"

# ============================================
# PHASE 3: Copy important root files
# ============================================

echo "📄 Copying root documentation files..."

# Keep the architectural audit
cp docs/ARCHITECTURAL-AUDIT.md docs-new/ 2>/dev/null || true
cp docs/DOCUMENTATION-STRUCTURE.md docs-new/ 2>/dev/null || true

echo "✅ Content migration complete"

# ============================================
# PHASE 4: Swap directories
# ============================================

echo ""
echo "🔄 Swapping directories..."

# Backup old docs
mv docs docs-old

# Move new docs into place
mv docs-new docs

echo "✅ Directory swap complete"

# ============================================
# PHASE 5: Cleanup
# ============================================

echo ""
echo "🧹 Cleaning up..."

# Remove .DS_Store files
find docs -name ".DS_Store" -delete 2>/dev/null || true

# Remove empty directories
find docs -type d -empty -delete 2>/dev/null || true

echo "✅ Cleanup complete"

# ============================================
# PHASE 6: Summary
# ============================================

echo ""
echo "=================================="
echo "✅ RESTRUCTURE COMPLETE"
echo "=================================="
echo ""
echo "New structure:"
ls -la docs/
echo ""
echo "Old docs backed up to: docs-old/"
echo ""
echo "NEXT STEPS:"
echo "1. Review the new structure"
echo "2. Run: rm -rf docs-old  (when satisfied)"
echo "3. Update any hardcoded paths in code"
echo "4. Commit changes"
echo ""
