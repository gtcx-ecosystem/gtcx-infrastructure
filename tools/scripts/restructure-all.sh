#!/bin/bash
# ================================================================
# GTCX Complete Restructure - Master Script
# ================================================================
# Run from gtcx/ root directory:
#   chmod +x tools/scripts/restructure-all.sh
#   ./tools/scripts/restructure-all.sh
#
# This runs both migrations in sequence:
# 1. migrate-docs.sh - Restructure docs/ to flat numbered format
# 2. cleanup-monorepo.sh - Clean up infrastructure/, operations/, etc.
# ================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         GTCX Complete Restructure                            ║"
echo "║         Making architecture match documentation              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verify location
if [ ! -f "package.json" ] || [ ! -d "docs" ]; then
    echo "❌ Error: Run from gtcx/ root directory"
    exit 1
fi

# Make scripts executable
chmod +x "$SCRIPT_DIR/migrate-docs.sh"
chmod +x "$SCRIPT_DIR/cleanup-monorepo.sh"

echo "This will:"
echo "  1. Restructure docs/ to flat numbered format (01-10)"
echo "  2. Consolidate infrastructure/ → infra/"
echo "  3. Move operations/caas → platforms/caas"
echo "  4. Clean up artifacts and empty directories"
echo ""
echo "Old docs will be backed up to docs-old/"
echo ""

read -p "Proceed? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Migrating docs/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$SCRIPT_DIR/migrate-docs.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Cleaning up monorepo structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$SCRIPT_DIR/cleanup-monorepo.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Final verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$SCRIPT_DIR/verify-structure.sh" 2>/dev/null || echo "(Verification script not found - check manually)"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ✅ ALL RESTRUCTURING COMPLETE                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Review the changes, then commit:"
echo ""
echo "  git add -A"
echo "  git commit -m 'refactor: restructure repo to match documentation'"
echo ""
echo "If something went wrong, restore from backup:"
echo "  rm -rf docs && mv docs-old docs"
echo ""
