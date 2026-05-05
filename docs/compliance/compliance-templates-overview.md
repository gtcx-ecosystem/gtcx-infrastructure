# Compliance Templates

Country-agnostic compliance rule templates for GTCX Protocol deployments.

## Overview

Each template defines the regulatory compliance rules for a specific jurisdiction. Templates are:

- **Declarative** — YAML-based rule definitions
- **Composable** — Mix country rules with industry-specific modules
- **AI-Readable** — Structured for agent interpretation and enforcement
- **Version Controlled** — Track regulatory changes over time

## Template Structure

```yaml
compliance_engine:
  version: '1.0.0'
  country: 'country_code'
  regulatory_framework: 'primary_legislation'

  capabilities:
    automated_checking: true
    real_time_monitoring: true
    compliance_scoring: true

# Rule categories
mining_safety:
  rules:
    rule_id:
      description: 'Human readable description'
      checks: ['list', 'of', 'checks']
      validation:
        type: 'boolean|certification|inspection|etc'
        frequency: 'daily|weekly|monthly'
      automated_action:
        on_violation: 'block_operation|flag_violation|etc'

environmental_compliance:
  # ...

worker_protection:
  # ...

revenue_management:
  # ...
```

## Available Templates

| Country  | Code            | Regulatory Framework        | Status              |
| -------- | --------------- | --------------------------- | ------------------- |
| Ghana    | `ghana.yaml`    | Minerals and Mining Act 703 | [Done] Production   |
| Kenya    | `kenya.yaml`    | Mining Act 2016             | [Done] Production   |
| Peru     | `peru.yaml`     | Mining Law DS 014-92-EM     | [In Progress] Draft |
| Colombia | `colombia.yaml` | Mining Code Law 685/2001    | [In Progress] Draft |
| Tanzania | `tanzania.yaml` | Mining Act 2010             | [In Progress] Draft |

## Usage

```typescript
import { loadComplianceTemplate, ComplianceEngine } from '@gtcx/compliance';

// Load country template
const ghanaRules = await loadComplianceTemplate('ghana');

// Initialize compliance engine
const engine = new ComplianceEngine(ghanaRules);

// Check compliance
const result = await engine.check({
  entity: miningOperation,
  ruleCategories: ['mining_safety', 'environmental'],
});

// result: { compliant: boolean, violations: [], score: 0.95 }
```

## Creating New Templates

1. Copy `_template.yaml` as starting point
2. Map local regulations to rule categories
3. Define automated checks and actions
4. Test with local regulatory experts
5. Version and deploy

See [Template Authoring Guide](./AUTHORING.md) for details.

## AI Agent Integration

Agents can query compliance rules:

```typescript
// Agent determining required checks
const requiredChecks = await agent.query({
  intent: 'compliance_requirements',
  country: 'ghana',
  operation: 'gold_export',
  context: { quantity: '500kg', destination: 'switzerland' },
});

// Returns structured compliance checklist
```
