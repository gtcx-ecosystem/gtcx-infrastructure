#!/bin/bash
# ================================================================
# GTCX Structure Verification (CORRECTED)
# ================================================================
# Verifies the monorepo structure matches documentation
# Run from gtcx/ root directory
# ================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         GTCX Structure Verification                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

# ================================================================
# Check top-level directories
# ================================================================
echo "📁 Cross-Cutting Foundations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_required() {
    if [ -d "$1" ]; then
        echo "   ✅ $1/"
    else
        echo "   ❌ $1/ MISSING"
        ((ERRORS++))
    fi
}

check_warning() {
    if [ -d "$1" ]; then
        echo "   ⚠️  $1/ (unexpected - needs review)"
        ((WARNINGS++))
    fi
}

check_required "rust"
check_required "packages"
check_required "intelligence"

echo ""
echo "📁 Layered Architecture"
echo "━━━━━━━━━━━━━━━━━━━━━━━"

check_required "protocols"
check_required "platforms"
check_required "apps"

echo ""
echo "📁 Infrastructure & Tooling"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_required "infra"
check_required "services"
check_required "tools"

echo ""
echo "📁 Documentation"
echo "━━━━━━━━━━━━━━━━━"

check_required "docs"
check_required "gtcx-protocol-docs"

# ================================================================
# Check for unexpected top-level directories
# ================================================================
echo ""
echo "🔍 Checking for Unexpected Directories"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_warning "infrastructure"
check_warning "operations"

# agentic needs decision
if [ -d "agentic" ]; then
    echo "   🔍 agentic/ (needs consolidation decision - merge into intelligence/)"
    ((WARNINGS++))
fi

# ================================================================
# Check docs/ structure
# ================================================================
echo ""
echo "📄 docs/ Structure (Flat Numbered)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_docs_dir() {
    if [ -d "docs/$1" ]; then
        if [ -f "docs/$1/README.md" ]; then
            echo "   ✅ docs/$1/"
        else
            echo "   ⚠️  docs/$1/ (missing README.md)"
            ((WARNINGS++))
        fi
    else
        echo "   ❌ docs/$1/ MISSING"
        ((ERRORS++))
    fi
}

check_docs_dir "01-getting-started"
check_docs_dir "02-architecture"
check_docs_dir "03-protocols"
check_docs_dir "04-platforms"
check_docs_dir "05-engineering"
check_docs_dir "06-deployment"
check_docs_dir "07-guides"
check_docs_dir "08-reference"
check_docs_dir "09-research"
check_docs_dir "10-internal"

# Check for old structure remnants
for old_dir in getting-started architecture engineering-manifesto research-new; do
    if [ -d "docs/$old_dir" ]; then
        echo "   ⚠️  docs/$old_dir/ (old structure remnant)"
        ((WARNINGS++))
    fi
done

# ================================================================
# Check protocols/
# ================================================================
echo ""
echo "📜 protocols/ Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━"

for proto in tradepass gci geotag vaultmark pvp panx; do
    if [ -d "protocols/$proto" ]; then
        echo "   ✅ protocols/$proto/"
    else
        echo "   ❌ protocols/$proto/ MISSING"
        ((ERRORS++))
    fi
done

# ================================================================
# Check intelligence/
# ================================================================
echo ""
echo "🧠 intelligence/ Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"

for intel in anisa cortex panx sdk shared; do
    if [ -d "intelligence/$intel" ]; then
        echo "   ✅ intelligence/$intel/"
    else
        echo "   ⚠️  intelligence/$intel/ missing"
        ((WARNINGS++))
    fi
done

# ================================================================
# Check platforms/
# ================================================================
echo ""
echo "🌐 platforms/ Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━"

for plat in sgx crx agx caas; do
    if [ -d "platforms/$plat" ]; then
        echo "   ✅ platforms/$plat/"
    else
        echo "   ⚠️  platforms/$plat/ missing"
        ((WARNINGS++))
    fi
done

# ================================================================
# Check multi-layer systems
# ================================================================
echo ""
echo "🔗 Multi-Layer Systems"
echo "━━━━━━━━━━━━━━━━━━━━━━"

# PANX should exist in both protocols/ and intelligence/
if [ -d "protocols/panx" ] && [ -d "intelligence/panx" ]; then
    echo "   ✅ PANX: protocols/panx/ + intelligence/panx/"
elif [ -d "protocols/panx" ] && [ ! -d "intelligence/panx" ]; then
    echo "   ⚠️  PANX: protocols/panx/ exists but intelligence/panx/ missing"
    ((WARNINGS++))
elif [ ! -d "protocols/panx" ] && [ -d "intelligence/panx" ]; then
    echo "   ⚠️  PANX: intelligence/panx/ exists but protocols/panx/ missing"
    ((WARNINGS++))
else
    echo "   ❌ PANX: Both directories missing"
    ((ERRORS++))
fi

# TradePass should exist in protocols/ and apps/
if [ -d "protocols/tradepass" ] && [ -d "apps/mobile" ]; then
    echo "   ✅ TradePass: protocols/tradepass/ + apps/mobile/"
else
    echo "   ⚠️  TradePass: Check protocols/tradepass/ and apps/mobile/"
    ((WARNINGS++))
fi

# ================================================================
# Check gtcx-protocol-docs/
# ================================================================
echo ""
echo "📚 gtcx-protocol-docs/ (Formal Spec)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for file in GLOSSARY.md SPEC-TO-CODE-MAP.md TEST-VECTORS.md; do
    if [ -f "gtcx-protocol-docs/$file" ]; then
        echo "   ✅ gtcx-protocol-docs/$file"
    else
        echo "   ⚠️  gtcx-protocol-docs/$file missing"
        ((WARNINGS++))
    fi
done

if [ -d "gtcx-protocol-docs/api" ] && [ -f "gtcx-protocol-docs/api/openapi.yaml" ]; then
    echo "   ✅ gtcx-protocol-docs/api/openapi.yaml"
else
    echo "   ⚠️  gtcx-protocol-docs/api/openapi.yaml missing"
    ((WARNINGS++))
fi

# ================================================================
# Summary
# ================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ PERFECT: Structure matches documentation exactly"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  GOOD: $WARNINGS warnings (minor issues)"
    echo "   Structure is mostly correct with some improvements needed"
    exit 0
else
    echo "❌ ISSUES: $ERRORS errors, $WARNINGS warnings"
    echo "   Structure does not match documentation"
    exit 1
fi
