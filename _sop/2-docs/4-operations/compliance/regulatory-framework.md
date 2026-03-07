# Regulatory Framework

Regulatory landscape, per-commodity compliance obligations, and how the GTCX Protocol layer maps to each framework. Configuration is jurisdiction- and commodity-specific — no regulatory framework is hardcoded.

---

## 1. Compliance Philosophy

Five principles guide all compliance design decisions:

| Principle                    | Traditional Approach                      | GTCX Implementation                                                         |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| **Proof over paperwork**     | Certificates, audit reports, attestations | Cryptographic proofs, immutable audit chains, real-time verification        |
| **Continuous over periodic** | Annual third-party audits                 | Continuous data collection, GCI scoring, automated alerts                   |
| **Inclusive over exclusive** | Compliance costs exclude small producers  | Progressive compliance, shared infrastructure, tiered requirements          |
| **Sovereign over external**  | International bodies dictate standards    | National authorities configure requirements; data stays within jurisdiction |
| **Transparent over opaque**  | Compliance status known only to auditors  | Verifiable GCI scores; privacy-preserving proof endpoints                   |

---

## 2. Regulatory Landscape

### International Standards

| Framework                                                  | Scope                                                   | GTCX Mapping                                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| OECD Due Diligence Guidance (DDG)                          | Responsible mineral supply chains — five-step framework | TradePass (identity), GCI (risk assessment), VaultMark (chain of custody), PANX (independent audit) |
| UN Guiding Principles on Business and Human Rights (UNGPs) | Human rights due diligence                              | GCI social factors (child labor, fair wages, grievance mechanisms)                                  |
| ILO Conventions                                            | Child labor, forced labor                               | GCI factor: `childLabor` (boolean, hard block on score tier)                                        |
| EITI (Extractive Industries Transparency Initiative)       | Revenue transparency                                    | Government PANX validator participation; tax/royalty reporting via PvP settlement                   |

### EU Regulatory Obligations

| Framework                                                          | Effective   | Scope                                                                           | GTCX Mapping                                                                         |
| ------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| EU Corporate Sustainability Due Diligence Directive (CS3D / CSDDD) | 2027 phased | Large companies — human rights and environmental due diligence in supply chains | Full provenance chain (GeoTag + VaultMark + GCI) satisfies traceability requirements |
| EU Conflict Minerals Regulation (CMR)                              | 2021        | Tin, tantalum, tungsten, gold imports from conflict-affected areas              | TradePass operator verification + GeoTag origin proof + GCI score                    |
| EU Deforestation Regulation (EUDR)                                 | 2024        | Timber, cocoa, coffee, soy — no deforestation after 2020                        | GeoTag licensed area validation + VaultMark chain of custody                         |
| EU Battery Regulation                                              | 2024–2027   | Cobalt, lithium, nickel sourcing disclosure                                     | GCI cobalt-specific factor weighting; supply chain provenance                        |

### US Obligations

| Framework                                  | Scope                                                     | GTCX Mapping                                                               |
| ------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| Dodd-Frank §1502                           | Conflict minerals (gold, tin, tantalum, tungsten)         | TradePass operator credentials + GeoTag origin + GCI conflict-zone factors |
| Uyghur Forced Labor Prevention Act (UFLPA) | Goods produced with forced labor — rebuttable presumption | GCI forced labor factors; supply chain traceability                        |

### Commodity-Specific Standards

| Commodity | Standard                                                  | GTCX Mapping                                                     |
| --------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Gold      | LBMA Responsible Gold Guidance                            | GCI gold config — assay, provenance, refinery provenance factors |
| Gold      | RJC Code of Practices                                     | TradePass certification credential type                          |
| Gold      | OECD DDG Annex II                                         | Full five-step mapping (see §3 below)                            |
| Cobalt    | Cobalt Institute Responsible Assessment Framework (CIRAF) | GCI cobalt config — purity, ESG, child labor check               |
| Cobalt    | OECD DDG                                                  | Same five-step mapping                                           |
| Coffee    | UTZ / Rainforest Alliance                                 | GCI coffee config — quality grade, cupping score, labor factors  |
| Coffee    | ISO 9001                                                  | Processor ID credential requirement                              |
| Timber    | FSC (Forest Stewardship Council)                          | VaultMark chain of custody + GeoTag licensed area                |
| Timber    | EU Timber Regulation (EUTR) / FLEGT                       | Species verification, legal harvest documentation                |

---

## 3. OECD DDG Five-Step Mapping

The OECD Due Diligence Guidance five-step framework is the primary international reference for responsible mineral supply chains.

| OECD Step                                         | Requirement                                                                                        | GTCX Implementation                                                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Step 1** — Strong management systems            | Supply chain policy, internal controls, supplier engagement, grievance mechanism, chain of custody | TradePass terms acceptance at onboarding; GCI organizational factors; VaultMark custody tracking; PvP dispute resolution             |
| **Step 2** — Identify and assess risks            | Risk identification, on-the-ground assessment, red flag identification, risk categorization        | GCI risk factor assessment (5 categories); VXA field verification; automated anomaly detection; GCI category tiers                   |
| **Step 3** — Design and implement risk mitigation | Mitigation strategy, measurable improvements, suspension criteria, continued engagement            | GCI improvement pathways and suggestions API; time-series score tracking; credential suspension/revocation; VIA training support     |
| **Step 4** — Independent third-party audit        | Independent audit, auditor qualifications, audit scope, audit frequency                            | PANX multi-party oracle consensus; validator tier requirements; configurable verification scopes; continuous + periodic verification |
| **Step 5** — Report on due diligence              | Public reporting, due diligence practices, risk identification, steps taken                        | GCI methodology disclosure; transparency verification endpoints; aggregated risk reports; immutable audit trail                      |

---

## 4. Per-Commodity Configuration

Commodity configurations are defined in `@gtcx/schemas/config/commodities/`. Each defines:

- Required verification types
- GCI factor weights (specific to the commodity's regulatory profile)
- Regulatory framework mappings
- Market access tier thresholds

| Commodity | Primary Unit | Required Verifications                   | Active Frameworks                        |
| --------- | ------------ | ---------------------------------------- | ---------------------------------------- |
| Gold      | grams        | assay, provenance, custody               | EU_CSDDD, OECD_DDG, DoddFrank_1502, LBMA |
| Coffee    | kg           | quality_grade, cupping_score, weight     | ISO_9001, UTZ, RFA                       |
| Cobalt    | kg           | purity, esg, child_labor_check           | EU_CSDDD, OECD_DDG, CIRAF                |
| Timber    | m³           | chain_of_custody, species, legal_harvest | EUTR, FLEGT, FSC                         |

Adding a new commodity requires only a new configuration file in `commodities/` — no protocol code changes.

---

## 5. Jurisdiction Configuration

Compliance requirements are configured per jurisdiction in `@gtcx/schemas/config/jurisdictions/`. This covers:

- Active regulatory frameworks for the jurisdiction
- Government PANX validator assignments
- Licensing authority mappings
- Tax and royalty reporting requirements for PvP settlement

Government bodies participate as PANX validators and have access to compliance data and reports within their jurisdiction scope. This is enforced via the `compliance.report` permission scope on the `GOVERNMENT` credential type.

---

## 6. GCI — Compliance Score as Regulatory Evidence

The GCI score (0–100) is the primary instrument for demonstrating regulatory compliance to buyers, government validators, and auditors.

| GCI Tier    | Score  | Market Access                        | Regulatory Standing                                                                          |
| ----------- | ------ | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| PREMIUM     | 85–100 | Full access; up to 22% price premium | Meets most framework requirements without additional documentation                           |
| VERIFIED    | 70–84  | Full access                          | Satisfies core due diligence obligations; some frameworks may require supplementary evidence |
| PROVISIONAL | 50–69  | Restricted access                    | Limited to markets with lower due diligence thresholds                                       |
| BLOCKED     | < 50   | No market access                     | Material compliance failure                                                                  |

GCI scores are cached and re-evaluated at PvP settlement time. A score drop below the escrow threshold between creation and settlement blocks settlement pending appeal or renegotiation.

---

## Reference

- [controls-matrix.md](controls-matrix.md)
- [operator-types.md](../../2-specs/operator-types.md)
- [data-models.md](../../2-specs/data-models.md)
