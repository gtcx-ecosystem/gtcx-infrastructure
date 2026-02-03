# ComplianceOS

> **Internal Compliance Rules Engine for GTCX Operations**

ComplianceOS is the internal compliance automation layer that powers regulatory checking across the GTCX ecosystem. It provides reusable compliance logic, policy engines, and monitoring tools.

**Note:** This is *not* the same as **GTCX Veritas** (the commercial truth/resolution product). ComplianceOS is internal plumbing; Veritas is a market-facing platform.

## Purpose

```
┌─────────────────────────────────────────────────────────┐
│                    GTCX Platforms                       │
│              (CRX, SGX, AGX, Pathways)                  │
└──────────────────────────┬──────────────────────────────┘
                           │ uses
┌──────────────────────────▼──────────────────────────────┐
│                    ComplianceOS                         │
│           (Internal compliance automation)              │
│                                                         │
│  • Policy engine         • Rule evaluation              │
│  • Jurisdiction configs  • Audit logging                │
│  • Regulatory mappings   • Alert triggers               │
└─────────────────────────────────────────────────────────┘
```

## Capabilities

### Policy Engine
- Declarative compliance rules (YAML-based)
- Jurisdiction-aware rule evaluation
- Version-controlled policy updates
- A/B testing for rule changes

### Regulatory Mapping
- Map GTCX data models to regulatory requirements
- LBMA, Kimberley, OECD Due Diligence guidance
- Country-specific export/import regulations
- Sanctions screening integration points

### Compliance Monitoring
- Real-time rule evaluation
- Threshold breach alerts
- Compliance score calculation
- Audit trail generation

### Integration Points
- GCI Protocol (external compliance scoring)
- ANISA (cultural context for compliance)
- CORTEX (anomaly detection for compliance events)

## Architecture

```
compliance-os/
├── README.md
├── engine/               # Rule evaluation engine
│   ├── evaluator.ts      # Core rule evaluator
│   ├── context.ts        # Evaluation context
│   └── actions.ts        # Post-evaluation actions
├── policies/             # Policy definitions
│   ├── global/           # Cross-jurisdiction policies
│   ├── jurisdictions/    # Country-specific rules
│   └── standards/        # LBMA, Kimberley, etc.
├── monitoring/           # Compliance monitoring
│   ├── alerts.ts         # Alert configuration
│   ├── metrics.ts        # Compliance metrics
│   └── audit.ts          # Audit trail
└── integrations/         # External integrations
    ├── sanctions/        # Sanctions list APIs
    ├── regulators/       # Regulator data feeds
    └── protocols/        # GTCX protocol hooks
```

## Relationship to GCI Protocol

| ComplianceOS | GCI Protocol |
|--------------|--------------|
| Internal tool | External-facing protocol |
| Automates compliance checking | Produces compliance scores for entities |
| Used by GTCX platforms | Used by external parties |
| Operational layer | Verification layer |

ComplianceOS *consumes* GCI scores and *produces* operational compliance decisions.

## Relationship to GTCX Veritas

| ComplianceOS | GTCX Veritas |
|--------------|--------------|
| Internal compliance automation | Commercial truth/resolution platform |
| Checks if rules are met | Attests that events happened |
| Operational | Commercial product |
| No external API | Public API (Attest, Index, Resolve) |

Veritas *may use* ComplianceOS for internal compliance checks, but Veritas is a distinct commercial platform selling truth services to the market.

## Configuration Example

```yaml
# policies/jurisdictions/ghana.yaml
jurisdiction: GH
effective_date: 2025-01-01
rules:
  - id: gh-asm-export-license
    name: ASM Export License Required
    condition: 
      entity.type == 'asm_producer' AND 
      transaction.type == 'export' AND
      transaction.value_usd > 10000
    action: require_document
    document: minerals_commission_license
    
  - id: gh-precious-metals-declaration
    name: Precious Metals Export Declaration
    condition:
      commodity.type IN ['gold', 'silver', 'platinum'] AND
      transaction.type == 'export'
    action: require_document
    document: bog_export_declaration
```

## Status

**Placeholder** - Migrated from `gtcx-ecosystem-cognitive/veritas` (renamed to avoid confusion with GTCX Veritas product).

The original Veritas folder contained mostly placeholder READMEs. Actual compliance rules and engine implementation are planned for Phase 2.


*Part of the [GTCX Infrastructure](../README.md) layer*
