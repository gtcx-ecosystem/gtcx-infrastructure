---
title: 'Moat Execution Plan'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'api']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Moat Execution Plan

**Purpose:** Execute the four strategic opportunities identified in the full audit — each creates durable competitive advantage that cannot be copied in 90 days.

---

## 1. Publish compliance-db to Terraform Registry

### Why this is a moat

No open-source Terraform module exists for African fintech regulatory compliance. The closest alternatives are manual spreadsheets or one-off internal tooling at individual fintechs. By publishing first, GTCX becomes the standard — every African fintech that uses Terraform will find us.

This is the **Trust** vertical from the defensible software framework: sell verification, not just access. Every fintech that adopts `compliance-db` validates GTCX's regulatory knowledge.

### What exists today

```
infra/terraform/modules/compliance-db/
  main.tf              — 11 jurisdiction presets (8 countries + 3 regional blocs)
  variables.tf         — Environment, jurisdiction, overrides
  compliance-db.tftest.hcl — 7 test runs
  README.md            — Module documentation
```

Jurisdictions encoded: Zimbabwe (RBZ), South Africa (SARB), Nigeria (CBN), Egypt (CBE), Kenya (CBK), Ghana (BoG), Tanzania (BoT), Rwanda (BNR), WAEMU (BCEAO), CEMAC (BEAC), EAC.

Each preset encodes: AWS region, KYC retention days, audit retention days, regulator name, data protection law, data protection authority, cross-border rules.

### Execution plan

| #   | Task                                                                                  | Effort  | Output                                            |
| --- | ------------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| 1.1 | Extract `compliance-db` into standalone repo `terraform-aws-compliance-db`            | 2 hours | New GitHub repo                                   |
| 1.2 | Add outputs.tf (missing from current module)                                          | 1 hour  | Endpoint ARNs, secret ARNs, jurisdiction metadata |
| 1.3 | Add examples/ directory (minimal, full, multi-jurisdiction)                           | 2 hours | 3 working examples                                |
| 1.4 | Write comprehensive README with jurisdiction table, architecture diagram, quick start | 2 hours | README.md                                         |
| 1.5 | Register on Terraform Registry (registry.terraform.io)                                | 30 min  | Published module                                  |
| 1.6 | Create GitHub release v1.0.0 with changelog                                           | 30 min  | Semantic version                                  |
| 1.7 | Write announcement post for African fintech community (dev.to, LinkedIn)              | 1 hour  | Distribution                                      |
| 1.8 | Submit to awesome-terraform and awesome-africa-tech lists                             | 30 min  | Discovery                                         |

**Timeline:** 1 day
**Cost:** $0
**Moat effect:** Every African fintech using Terraform discovers GTCX. Module downloads become a trust signal. Contributions from the community expand jurisdiction coverage for free.

### 90-day copy test

A competitor can fork the repo in 5 minutes. But:

- GTCX has the regulatory knowledge baked into the presets (sourced from actual central bank circulars)
- First-mover on the registry means GTCX shows up in `terraform init` searches
- Community contributions and stars compound — the fork starts at zero
- GTCX can iterate faster because this is our core domain

**Verdict:** The module is copyable. The position as the author and maintainer is not.

---

## 2. AI-Native Compliance Query Layer

### Why this is a moat

The 64 protocol handlers are deterministic API endpoints. A developer must know which endpoint to call, what parameters to pass, and how to interpret the response. This is the opposite of AI-native.

An AI layer that interprets natural language compliance queries and routes to the correct handler creates a moat because:

- The routing logic encodes domain expertise (which handler answers which question)
- The training data is proprietary (real compliance queries from African commodity traders)
- The model improves with every query (data gravity)
- Competitors can copy the API but not the query understanding

This is the **Context** vertical: own the knowledge graph. General model = chatbot. Model + GTCX compliance context = dependable compliance officer.

### Architecture

```
User/Agent Query (natural language)
  ↓
AI Compliance Gateway (Claude API / AI SDK)
  ↓ structured tool call
Protocol Router (maps intent → handler)
  ↓
Protocol Handler (deterministic execution)
  ↓
Structured Response + Explanation
```

### Execution plan

| #   | Task                                                                    | Effort  | Output                                                              |
| --- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| 2.1 | Design tool definitions for all 64 handlers (inputSchema, outputSchema) | 1 day   | `tools/compliance-gateway/tools.json`                               |
| 2.2 | Build compliance gateway service (Node.js + AI SDK v6)                  | 2 days  | `tools/compliance-gateway/`                                         |
| 2.3 | Create system prompt with African trade compliance domain knowledge     | 4 hours | System prompt covering TradePass, GCI, GeoTag, VaultMark, PvP, PANX |
| 2.4 | Wire to Claude API via AI Gateway (provider routing, fallback)          | 2 hours | Gateway config                                                      |
| 2.5 | Add compliance query examples for each jurisdiction                     | 4 hours | Test fixtures                                                       |
| 2.6 | Deploy to testnet at `api.gtcx.trade/v1/query`                          | 2 hours | Live endpoint                                                       |
| 2.7 | Build MCP server exposing compliance tools                              | 1 day   | Agentic discovery                                                   |

**Example queries the gateway would handle:**

```
"Is this gold shipment from Kwekwe compliant with RBZ export regulations?"
→ Routes to: GCI.createGCIScore + GeoTag.captureGeoTag + TradePass.verifyCredential

"What documents do I need for a cross-border tobacco trade between Zimbabwe and Mozambique?"
→ Routes to: TradePass.issueCredential + VaultMark.createCustodyRecord

"Verify this cooperative's compliance score and check if they can trade platinum"
→ Routes to: GCI.getScoreBreakdown + GCI.checkGCITierRequirement
```

**Timeline:** 1 week
**Cost:** Claude API usage (~$50-100/month at testnet scale)
**Moat effect:** Every query improves the routing model. Competitors can copy the API but not the accumulated query understanding. The MCP server makes GTCX discoverable by AI agents — agentic commerce architecture.

### 90-day copy test

A competitor can build a wrapper around Claude + generic compliance docs in a week. But:

- GTCX's tool definitions encode real protocol semantics (64 handlers, not generic)
- The system prompt encodes domain knowledge from actual regulatory engagement
- Query logs create training data for fine-tuning (data gravity)
- The MCP server means AI agents find GTCX autonomously (distribution moat)

**Verdict:** The wrapper is copyable. The domain-specific tool definitions and accumulated query data are not.

---

## 3. Cloudflare Tunnel Migration

### Why this matters

Current architecture: Cloudflare DNS → ALB → EKS pods. This required:

- ACM certificate management (failed validation, domain mismatch)
- Security group debugging (manual fix, not in Terraform)
- ALB target group registration issues (controller reconciliation)
- High latency from dev machine to af-south-1 EKS API

Cloudflare Tunnel architecture: Cloudflare DNS → Tunnel → Pod (direct). No ALB, no security groups, no ACM certs.

### What changes

| Before (ALB)                  | After (Tunnel)                 |
| ----------------------------- | ------------------------------ |
| ALB + ACM + SG + Target Group | `cloudflared` sidecar in pod   |
| $18-25/month ALB cost         | $0 (Tunnel is free)            |
| Security group debugging      | Zero network config            |
| ACM cert validation           | Cloudflare automatic TLS       |
| Manual target registration    | Automatic via tunnel connector |
| Public EKS API needed         | Private cluster only           |

### Execution plan

| #   | Task                                                             | Effort | Output                  |
| --- | ---------------------------------------------------------------- | ------ | ----------------------- |
| 3.1 | Create Cloudflare Tunnel for gtcx-testnet                        | 5 min  | Tunnel ID + credentials |
| 3.2 | Create tunnel config mapping `api.gtcx.trade` → `localhost:8300` | 10 min | `config.yml`            |
| 3.3 | Deploy `cloudflared` as K8s sidecar or DaemonSet                 | 30 min | K8s manifest            |
| 3.4 | Update Cloudflare DNS to use tunnel CNAME (replace ALB CNAME)    | 5 min  | DNS record              |
| 3.5 | Verify `api.gtcx.trade` routes through tunnel                    | 5 min  | `curl` test             |
| 3.6 | Remove ALB ingress, target group, ACM cert                       | 30 min | Terraform cleanup       |
| 3.7 | Disable EKS public API endpoint                                  | 10 min | Security hardening      |
| 3.8 | Document tunnel architecture in README                           | 30 min | Updated docs            |

**Timeline:** 2 hours
**Cost:** -$18-25/month (saves ALB cost)
**Side benefits:**

- EKS API can be fully private (no public endpoint, no CIDR management)
- Built-in DDoS protection from Cloudflare (no WAF needed)
- `cloudflared` access for SSH/kubectl to cluster (replaces bastion need)
- Zero Trust access policies via Cloudflare Access (replaces VPN)

### Compatibility with existing setup

You already have `cloudflared` installed and authenticated. The `sensei-pilot` tunnel proves the pattern works. This is a 2-hour migration, not a redesign.

---

## 4. compliance-db as Strategic Foundation

### Why this matters beyond the module

The compliance-db module is not just a Terraform module — it's a knowledge base. The jurisdiction presets encode regulatory intelligence that took months to research. This knowledge should power multiple products:

```
compliance-db (Terraform module)
  → Powers: Infrastructure deployment (current)
  → Powers: AI Compliance Gateway (natural language queries)
  → Powers: Compliance Dashboard (BaselineOS / terminal-os)
  → Powers: Regulatory Change Alerts (when laws change)
  → Powers: MCP Server (agentic discovery by AI agents)
```

### Execution plan

| #   | Task                                                                            | Effort  | Output                                      |
| --- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------- |
| 4.1 | Extract jurisdiction data into standalone JSON/YAML (not just Terraform locals) | 2 hours | `data/jurisdictions.json`                   |
| 4.2 | Publish as npm package `@gtcx/compliance-data`                                  | 1 hour  | Importable by any JS/TS service             |
| 4.3 | Add regulatory change detection (diff against previous version)                 | 2 hours | CI alert when jurisdiction data changes     |
| 4.4 | Wire into AI Compliance Gateway system prompt                                   | 1 hour  | AI knows current regulations                |
| 4.5 | Create MCP server resource for jurisdiction data                                | 2 hours | AI agents can query regulatory requirements |
| 4.6 | Add 5 more jurisdictions (Uganda, Mozambique, Zambia, DRC, Ethiopia)            | 1 day   | 16 jurisdictions total                      |

**Timeline:** 2 days
**Moat effect:** The jurisdiction data becomes a living dataset that powers multiple products. Each new jurisdiction makes the dataset more valuable. Competitors must research each jurisdiction independently — GTCX has already done the work.

---

## Combined Sprint Plan

### Sprint A: Publish + Tunnel (2 days)

| #   | Task                                                  | Source  | Effort  |
| --- | ----------------------------------------------------- | ------- | ------- |
| 1   | Extract compliance-db to standalone repo              | Moat #1 | 2 hours |
| 2   | Add outputs.tf + examples/ + comprehensive README     | Moat #1 | 3 hours |
| 3   | Publish to Terraform Registry v1.0.0                  | Moat #1 | 30 min  |
| 4   | Create Cloudflare Tunnel + deploy cloudflared sidecar | Moat #3 | 2 hours |
| 5   | Migrate api.gtcx.trade from ALB to Tunnel             | Moat #3 | 30 min  |
| 6   | Disable EKS public API endpoint                       | Moat #3 | 10 min  |

**Done when:** `terraform-aws-compliance-db` on registry, `api.gtcx.trade` serving through Tunnel, EKS API private.

### Sprint B: AI Compliance Gateway (3 days)

| #   | Task                                                  | Source  | Effort  |
| --- | ----------------------------------------------------- | ------- | ------- |
| 1   | Extract jurisdiction data to `@gtcx/compliance-data`  | Moat #4 | 2 hours |
| 2   | Design tool definitions for 64 handlers               | Moat #2 | 1 day   |
| 3   | Build compliance gateway service (AI SDK v6 + Claude) | Moat #2 | 2 days  |
| 4   | Deploy to `api.gtcx.trade/v1/query`                   | Moat #2 | 2 hours |
| 5   | Build MCP server exposing compliance tools            | Moat #2 | 1 day   |

**Done when:** Natural language compliance queries return structured results, MCP server discoverable.

### Sprint C: Expand + Announce (2 days)

| #   | Task                                                                 | Source  | Effort  |
| --- | -------------------------------------------------------------------- | ------- | ------- |
| 1   | Add 5 more jurisdictions (Uganda, Mozambique, Zambia, DRC, Ethiopia) | Moat #4 | 1 day   |
| 2   | Write announcement post                                              | Moat #1 | 1 hour  |
| 3   | Submit to awesome lists                                              | Moat #1 | 30 min  |
| 4   | Add regulatory change detection CI                                   | Moat #4 | 2 hours |
| 5   | Demo video: natural language compliance query                        | Moat #2 | 2 hours |

**Done when:** 16 jurisdictions, public announcement, demo video.

---

## Impact Matrix

| Item              | Before                    | After                           | 90-Day Copy Defense              |
| ----------------- | ------------------------- | ------------------------------- | -------------------------------- |
| compliance-db     | Internal module           | Public Terraform standard       | First-mover + community + trust  |
| AI Gateway        | 64 raw API endpoints      | Natural language compliance     | Domain data gravity + query logs |
| Cloudflare Tunnel | ALB + SG + ACM complexity | Zero-config, $0, DDoS protected | Operational simplicity           |
| Compliance Data   | Terraform locals          | Multi-format, multi-product     | Living dataset, 16 jurisdictions |

**Total timeline:** 7 days
**Total cost:** ~$50-100/month (Claude API)
**What you get:** The only open-source African fintech compliance platform with AI-native query interface, discoverable by AI agents via MCP, serving through zero-config Cloudflare infrastructure. That passes the 90-day copy test.

---

_Plan authored: 2026-05-09_
