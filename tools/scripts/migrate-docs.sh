#!/bin/bash
# ================================================================
# GTCX Documentation Restructure - COMPLETE MIGRATION
# ================================================================
# Run from gtcx/ root directory:
#   chmod +x tools/scripts/migrate-docs.sh
#   ./tools/scripts/migrate-docs.sh
#
# This script migrates docs/ to the new flat numbered structure.
# ================================================================

set -e  # Exit on any error

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         GTCX Documentation Restructure                       ║"
echo "║         Flat Numbered Structure (01-10)                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verify we're in the right place
if [ ! -f "package.json" ] || [ ! -d "docs" ]; then
    echo "❌ Error: Run this from the gtcx/ root directory"
    exit 1
fi

# ================================================================
# PHASE 1: Create new directory structure
# ================================================================
echo "📁 Phase 1: Creating new directory structure..."

mkdir -p docs-new/01-getting-started
mkdir -p docs-new/02-architecture/decisions
mkdir -p docs-new/02-architecture/diagrams
mkdir -p docs-new/03-protocols/tradepass
mkdir -p docs-new/03-protocols/gci
mkdir -p docs-new/03-protocols/geotag
mkdir -p docs-new/03-protocols/vaultmark
mkdir -p docs-new/03-protocols/pvp
mkdir -p docs-new/03-protocols/panx
mkdir -p docs-new/04-platforms/sgx
mkdir -p docs-new/04-platforms/crx
mkdir -p docs-new/04-platforms/agx
mkdir -p docs-new/04-platforms/caas
mkdir -p docs-new/04-platforms/pathways
mkdir -p docs-new/05-engineering
mkdir -p docs-new/06-deployment/kubernetes
mkdir -p docs-new/06-deployment/terraform
mkdir -p docs-new/07-guides
mkdir -p docs-new/08-reference/api
mkdir -p docs-new/08-reference/schemas
mkdir -p docs-new/09-research/academic
mkdir -p docs-new/09-research/ip-portfolio
mkdir -p docs-new/09-research/strategic
mkdir -p docs-new/10-internal/prds
mkdir -p docs-new/10-internal/runbooks
mkdir -p docs-new/10-internal/migrations
mkdir -p docs-new/10-internal/specs

echo "   ✅ Created 10 top-level directories with subdirectories"

# ================================================================
# PHASE 2: Migrate content
# ================================================================
echo ""
echo "📦 Phase 2: Migrating content..."

# --- 01-getting-started ---
echo "   → 01-getting-started"
# From old 01-getting-started
cp docs/01-getting-started/*.md docs-new/01-getting-started/ 2>/dev/null || true
# From getting-started (merge both)
cp docs/getting-started/*.md docs-new/01-getting-started/ 2>/dev/null || true

# --- 02-architecture ---
echo "   → 02-architecture"
# Copy architecture root files
cp docs/architecture/*.md docs-new/02-architecture/ 2>/dev/null || true
# Copy decisions
cp docs/architecture/decisions/*.md docs-new/02-architecture/decisions/ 2>/dev/null || true
# Copy diagrams if they exist
cp -r docs/architecture/diagrams/* docs-new/02-architecture/diagrams/ 2>/dev/null || true
# Move misplaced ADRs from architecture root to decisions
if ls docs-new/02-architecture/ADR-*.md 1> /dev/null 2>&1; then
    mv docs-new/02-architecture/ADR-*.md docs-new/02-architecture/decisions/ 2>/dev/null || true
fi
# Copy root ARCHITECTURE.md
cp docs/ARCHITECTURE.md docs-new/02-architecture/ 2>/dev/null || true

# --- 03-protocols ---
echo "   → 03-protocols"
# From 02-protocols
cp docs/02-protocols/README.md docs-new/03-protocols/ 2>/dev/null || true
# Protocol subdirectories
cp -r docs/02-protocols/tradepass/* docs-new/03-protocols/tradepass/ 2>/dev/null || true
cp -r docs/02-protocols/gci/* docs-new/03-protocols/gci/ 2>/dev/null || true
cp -r docs/02-protocols/geotag/* docs-new/03-protocols/geotag/ 2>/dev/null || true
cp -r docs/02-protocols/vaultmark/* docs-new/03-protocols/vaultmark/ 2>/dev/null || true
cp -r docs/02-protocols/pvp/* docs-new/03-protocols/pvp/ 2>/dev/null || true
cp -r docs/02-protocols/panx-oracle/* docs-new/03-protocols/panx/ 2>/dev/null || true
# Protocol specs from specs/protocols
cp -r docs/specs/protocols/* docs-new/03-protocols/ 2>/dev/null || true

# --- 04-platforms ---
echo "   → 04-platforms"
# From 04-platforms
cp docs/04-platforms/README.md docs-new/04-platforms/ 2>/dev/null || true
cp -r docs/04-platforms/sgx/* docs-new/04-platforms/sgx/ 2>/dev/null || true
cp -r docs/04-platforms/crx/* docs-new/04-platforms/crx/ 2>/dev/null || true
cp -r docs/04-platforms/agx/* docs-new/04-platforms/agx/ 2>/dev/null || true
cp -r docs/04-platforms/pathways/* docs-new/04-platforms/pathways/ 2>/dev/null || true
cp -r docs/04-platforms/shared/* docs-new/04-platforms/shared/ 2>/dev/null || true
# From 03-operations (if it has relevant content)
cp docs/03-operations/*.md docs-new/04-platforms/ 2>/dev/null || true

# --- 05-engineering ---
echo "   → 05-engineering"
# From engineering-manifesto (primary source)
cp docs/engineering-manifesto/*.md docs-new/05-engineering/ 2>/dev/null || true
# Don't copy root duplicates (PRINCIPLES.md etc) - engineering-manifesto is authoritative

# --- 06-deployment ---
echo "   → 06-deployment"
# From 09-deployment
cp -r docs/09-deployment/* docs-new/06-deployment/ 2>/dev/null || true
# Deployment guide from guides
cp docs/guides/deployment.md docs-new/06-deployment/ 2>/dev/null || true

# --- 07-guides ---
echo "   → 07-guides"
# From guides
cp docs/guides/*.md docs-new/07-guides/ 2>/dev/null || true
# From 08-integration (how-to content)
cp docs/08-integration/*.md docs-new/07-guides/ 2>/dev/null || true
# Remove deployment.md from guides (it's in 06-deployment now)
rm docs-new/07-guides/deployment.md 2>/dev/null || true

# --- 08-reference ---
echo "   → 08-reference"
# From 10-reference
cp -r docs/10-reference/* docs-new/08-reference/ 2>/dev/null || true
# From reference
cp -r docs/reference/* docs-new/08-reference/ 2>/dev/null || true
# From 07-data-model
cp docs/07-data-model/*.md docs-new/08-reference/schemas/ 2>/dev/null || true

# --- 09-research ---
echo "   → 09-research"
# From research (preserving structure)
cp docs/research/README.md docs-new/09-research/ 2>/dev/null || true
cp -r docs/research/01-academic-papers/* docs-new/09-research/academic/ 2>/dev/null || true
cp -r docs/research/02-foundational-theory/* docs-new/09-research/academic/ 2>/dev/null || true
cp -r docs/research/03-technical-research/* docs-new/09-research/academic/ 2>/dev/null || true
cp -r docs/research/04-market-research/* docs-new/09-research/strategic/ 2>/dev/null || true
cp -r docs/research/05-ip-portfolio/* docs-new/09-research/ip-portfolio/ 2>/dev/null || true
cp -r docs/research/06-research-methodology/* docs-new/09-research/academic/ 2>/dev/null || true
cp -r docs/research/07-strategic-vision/* docs-new/09-research/strategic/ 2>/dev/null || true

# --- 10-internal ---
echo "   → 10-internal"
# PRDs
cp docs/prds/*.md docs-new/10-internal/prds/ 2>/dev/null || true
# Migrations
cp docs/migrations/*.md docs-new/10-internal/migrations/ 2>/dev/null || true
cp docs/MIGRATION_TRACKER.md docs-new/10-internal/migrations/ 2>/dev/null || true
# Specs (non-protocol)
cp docs/specs/*.md docs-new/10-internal/specs/ 2>/dev/null || true
cp -r docs/specs/economics docs-new/10-internal/specs/ 2>/dev/null || true
# Operations content
cp docs/operations/*.md docs-new/10-internal/runbooks/ 2>/dev/null || true

echo "   ✅ Content migration complete"

# ================================================================
# PHASE 3: Add README files
# ================================================================
echo ""
echo "📄 Phase 3: Adding README files..."

# Root README
cat > docs-new/README.md << 'EOFREADME'
# GTCX Documentation

> **Structured knowledge base for GTCX Protocol development**

---

## Navigation

| # | Section | Purpose | Audience |
|---|---------|---------|----------|
| **01** | [Getting Started](./01-getting-started/) | First steps, onboarding | Everyone |
| **02** | [Architecture](./02-architecture/) | System design, ADRs | Architects, Senior Devs |
| **03** | [Protocols](./03-protocols/) | TradePass™, GCI™, GeoTag™, etc. | Protocol Developers |
| **04** | [Platforms](./04-platforms/) | SGX, CRX, AGX, CaaS | Platform Engineers |
| **05** | [Engineering](./05-engineering/) | 30 Principles, Code Standards | All Developers |
| **06** | [Deployment](./06-deployment/) | Infrastructure, K8s, Terraform | DevOps, SRE |
| **07** | [Guides](./07-guides/) | How-to tutorials | All Developers |
| **08** | [Reference](./08-reference/) | API docs, schemas, glossary | All Developers |
| **09** | [Research](./09-research/) | Academic papers, IP, strategy | Leadership, Researchers |
| **10** | [Internal](./10-internal/) | PRDs, runbooks, migrations | Internal Team |

---

## Quick Links

### Start Here
- [Quickstart Guide](./01-getting-started/quickstart.md)
- [For Developers](./01-getting-started/for-developers.md)
- [For AI Agents](./01-getting-started/for-ai-agents.md)

### Core Reading
- [30 Engineering Principles](./05-engineering/PRINCIPLES.md)
- [Architecture Overview](./02-architecture/README.md)
- [Code Standards](./05-engineering/CODE-STANDARDS.md)

### Protocol Specification
- [Full Protocol Spec](../gtcx-protocol-docs/) — Formal specification (v3.0)
- [Glossary](../gtcx-protocol-docs/GLOSSARY.md) — All terminology
- [API Reference](../gtcx-protocol-docs/api/openapi.yaml) — OpenAPI spec

---

## Documentation Standards

- **File naming:** `kebab-case.md` for files, `UPPERCASE.md` for standards
- **Structure:** Every directory has a `README.md`
- **Writing:** Lead with key information, use tables, include examples

---

*Last updated: January 2026*
EOFREADME

# 01-getting-started README
cat > docs-new/01-getting-started/README.md << 'EOF01'
# Getting Started

> **First steps for developers, AI agents, and contributors**

---

## Quick Start

| Guide | For | Time |
|-------|-----|------|
| [Quickstart](./quickstart.md) | Everyone | 15 min |
| [For Developers](./for-developers.md) | Human developers | 30 min |
| [For AI Agents](./for-ai-agents.md) | AI coding assistants | 10 min |

---

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- pnpm 8+
- Git
- (Recommended) Rust toolchain, Docker

---

## First Steps

1. Clone and install: `git clone ... && pnpm install`
2. Read [30 Engineering Principles](../05-engineering/PRINCIPLES.md)
3. Review [Architecture](../02-architecture/)
4. Pick your path: Protocols, Platforms, or Infrastructure

---

*Welcome to GTCX. Let's build infrastructure for economic sovereignty.*
EOF01

# 02-architecture README
cat > docs-new/02-architecture/README.md << 'EOF02'
# Architecture

> **System design, architectural decisions, and technical diagrams**

---

## Contents

| Section | Description |
|---------|-------------|
| [decisions/](./decisions/) | Architecture Decision Records (ADRs) |
| [diagrams/](./diagrams/) | System diagrams and visualizations |
| [TECH-STACK.md](./TECH-STACK.md) | Technology choices |

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EXCHANGE LAYER                          │
│         SGX (Sovereign) │ CRX (Regulatory) │ AGX (Global)   │
├─────────────────────────────────────────────────────────────┤
│                    OPERATIONS LAYER                         │
│              CaaS │ VIA™ │ VXA™ │ Field Ops                 │
├─────────────────────────────────────────────────────────────┤
│                     PROTOCOL LAYER                          │
│   TradePass™ │ GCI™ │ GeoTag™ │ VaultMark™ │ PvP™ │ PANX™  │
└─────────────────────────────────────────────────────────────┘
```

See [Protocol Spec §2](../gtcx-protocol-docs/spec/02-architecture.md) for details.

---

## Key ADRs

| ADR | Decision | Status |
|-----|----------|--------|
| [ADR-001](./decisions/ADR-001-monorepo-structure.md) | Monorepo structure | ✅ |
| [ADR-005](./decisions/ADR-005-cryptographic-primitives.md) | Cryptographic primitives | ✅ |
| [ADR-007](./decisions/ADR-007-rust-foundational-layer.md) | Rust foundational layer | ✅ |
EOF02

# 03-protocols README
cat > docs-new/03-protocols/README.md << 'EOF03'
# Protocols

> **Core verification protocols: TradePass™, GCI™, GeoTag™, VaultMark™, PvP™, PANX™**

---

## Protocol Overview

| Protocol | Purpose | Spec |
|----------|---------|------|
| [TradePass™](./tradepass/) | Digital identity & credentials | §3 |
| [GCI™](./gci/) | Compliance scoring | §4 |
| [GeoTag™](./geotag/) | Location verification | §5.1 |
| [VaultMark™](./vaultmark/) | Custody chain tracking | §5.2 |
| [PvP™](./pvp/) | Payment-versus-Payment settlement | §6 |
| [PANX™](./panx/) | Multi-stakeholder consensus | §9.3 |

---

## Development

1. Start with schemas (`packages/schemas/`)
2. Implement in protocol (`protocols/<name>/`)
3. Add tests (unit + integration)
4. Document (update this folder + spec)

---

See [Full Protocol Specification](../../gtcx-protocol-docs/spec/) for details.
EOF03

# 04-platforms README
cat > docs-new/04-platforms/README.md << 'EOF04'
# Platforms

> **Exchange and operations platforms: SGX, CRX, AGX, CaaS**

---

## Platform Overview

| Platform | Purpose | Layer |
|----------|---------|-------|
| [SGX](./sgx/) | Sovereign Governance Exchange | Exchange |
| [CRX](./crx/) | Compliance Regulatory Exchange | Exchange |
| [AGX](./agx/) | Africa Gold Exchange (Global) | Exchange |
| [CaaS](./caas/) | Compliance-as-a-Service (VIA™/VXA™) | Operations |
| [Pathways](./pathways/) | ASM Pathways Protocol | Operations |

---

## Architecture

- Platforms depend on protocols and packages
- Platforms do NOT depend on apps
- Share code via `platforms/shared/`
EOF04

# 05-engineering README
cat > docs-new/05-engineering/README.md << 'EOF05'
# Engineering Standards

> **The 30 principles, code standards, and development practices**

---

## Core Documents

| Document | Purpose |
|----------|---------|
| [PRINCIPLES.md](./PRINCIPLES.md) | **The 30 Engineering Principles** |
| [CODE-STANDARDS.md](./CODE-STANDARDS.md) | Code style and quality |
| [RED-FLAGS.md](./RED-FLAGS.md) | Anti-patterns to avoid |
| [DEVELOPER-MANIFESTO.md](./DEVELOPER-MANIFESTO.md) | Philosophy and culture |

---

## 30 Principles Summary

```
🔐 TRUST: 1.Proof 2.Private 3.Auditable 4.Immutable 5.Transparent
🏛️ SOVEREIGNTY: 6.Sovereign 7.Open 8.Federated 9.Governed 10.Compliant
⚙️ ARCHITECTURE: 11.Secure 12.Resilient 13.Modular 14.Deployable 15.Observable
🌍 FRONTIER: 16.Ubuntu 17.Offline 18.Localized 19.Accessible 20.Hardware
🔄 SCALE: 21.Universal 22.Portable 23.Interoperable 24.Scalable 25.Extensible
🧭 CRAFT: 26.Researched 27.Documented 28.Adaptive 29.Tested 30.Intentional
```

See [PRINCIPLES.md](./PRINCIPLES.md) for full details.
EOF05

# 06-deployment README
cat > docs-new/06-deployment/README.md << 'EOF06'
# Deployment

> **Infrastructure, Kubernetes, Terraform, and operational guides**

---

## Deployment Targets

| Target | Overlay |
|--------|---------|
| Development | `overlays/development/` |
| Staging | `overlays/staging/` |
| Production | `overlays/production/` |
| Air-Gapped | `overlays/air-gapped/` |

---

## Key Principles

- **P14 (DEPLOYABLE):** Same artifact everywhere
- **P6 (SOVEREIGN):** Each nation controls infrastructure
- **P15 (OBSERVABLE):** Full metrics, tracing, health

---

See `infra/` for infrastructure code.
EOF06

# 07-guides README
cat > docs-new/07-guides/README.md << 'EOF07'
# Guides

> **How-to tutorials and step-by-step instructions**

---

## Available Guides

| Guide | Description |
|-------|-------------|
| [development.md](./development.md) | Local development setup |
| [agent-troubleshooting.md](./agent-troubleshooting.md) | Debug AI agent issues |

---

## Guide Format

1. Prerequisites
2. Overview
3. Steps (numbered, actionable)
4. Verification
5. Troubleshooting
6. Next steps
EOF07

# 08-reference README
cat > docs-new/08-reference/README.md << 'EOF08'
# Reference

> **API documentation, schemas, and lookup resources**

---

## Quick Links

- [OpenAPI Spec](../../gtcx-protocol-docs/api/openapi.yaml)
- [Full Glossary](../../gtcx-protocol-docs/GLOSSARY.md)
- [Test Vectors](../../gtcx-protocol-docs/TEST-VECTORS.md)
- [Spec-to-Code Map](../../gtcx-protocol-docs/SPEC-TO-CODE-MAP.md)

---

## Schemas

All schemas in `packages/schemas/` use Zod for validation.
EOF08

# 09-research README
cat > docs-new/09-research/README.md << 'EOF09'
# Research

> **Academic papers, intellectual property, and strategic vision**

---

## Contents

| Section | Description |
|---------|-------------|
| [academic/](./academic/) | Papers and publications |
| [ip-portfolio/](./ip-portfolio/) | Patents and innovations |
| [strategic/](./strategic/) | Vision and strategy |

---

## Research Areas

- Ubuntu Economics framework
- Proof-based legitimacy theory
- Cooperative verification infrastructure
- 77+ patentable innovations
EOF09

# 10-internal README
cat > docs-new/10-internal/README.md << 'EOF10'
# Internal

> **PRDs, runbooks, migrations, and internal documentation**

---

## Contents

| Section | Description |
|---------|-------------|
| [prds/](./prds/) | Product Requirement Documents |
| [runbooks/](./runbooks/) | Operational runbooks |
| [migrations/](./migrations/) | Migration tracking |
| [specs/](./specs/) | Internal specifications |

---

⚠️ **Internal documentation** — may not be suitable for external sharing.
EOF10

echo "   ✅ README files created"

# ================================================================
# PHASE 4: Clean up
# ================================================================
echo ""
echo "🧹 Phase 4: Cleaning up..."

# Remove .DS_Store files
find docs-new -name ".DS_Store" -delete 2>/dev/null || true

# Remove empty directories
find docs-new -type d -empty -delete 2>/dev/null || true

echo "   ✅ Cleanup complete"

# ================================================================
# PHASE 5: Swap directories
# ================================================================
echo ""
echo "🔄 Phase 5: Swapping directories..."

# Backup old docs
mv docs docs-old
mv docs-new docs

echo "   ✅ docs/ is now the new structure"
echo "   ✅ Old docs backed up to docs-old/"

# ================================================================
# Summary
# ================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ MIGRATION COMPLETE                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "New structure:"
echo ""
ls -la docs/
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Review the new structure:"
echo "   ls -la docs/*"
echo ""
echo "2. If satisfied, delete backup:"
echo "   rm -rf docs-old"
echo ""
echo "3. Run monorepo cleanup (infrastructure/, operations/, etc.):"
echo "   ./tools/scripts/cleanup-monorepo.sh"
echo ""
echo "4. Update SPEC-TO-CODE-MAP.md if needed"
echo ""
echo "5. Commit changes:"
echo "   git add -A && git commit -m 'refactor: restructure docs/ to flat numbered format'"
echo ""
