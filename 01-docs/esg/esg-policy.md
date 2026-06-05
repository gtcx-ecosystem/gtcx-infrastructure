---
title: 'Environmental, Social & Governance (ESG) Policy'
status: 'current'
date: '2026-05-27'
owner: 'ceo'
role: 'ceo'
tier: 'critical'
tags: ['esg', 'sustainability', 'diversity', 'carbon', 'investment-grade']
review_cycle: 'annual'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ESG Policy

**Document ID:** GTCX-ESG-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Owner:** Chief Executive Officer  
**Aligned Frameworks:** UN Sustainable Development Goals (SDGs), King IV, GRI Standards

---

## 1. Environmental

### 1.1 Carbon Footprint

| Source                 | 2025 Baseline (tCO₂e) | 2026 Target        | 2030 Target                |
| ---------------------- | --------------------- | ------------------ | -------------------------- |
| AWS cloud (af-south-1) | ~12                   | ~15 (pilot growth) | Carbon neutral via offsets |
| Office / remote work   | ~3                    | ~4                 | ~2 (renewable energy)      |
| Business travel        | ~2                    | ~1.5 (reduce 25%)  | ~0.5 (virtual first)       |
| **Total**              | **~17**               | **~20.5**          | **Carbon neutral**         |

**Measurement:** Annual calculation using AWS Customer Carbon Footprint Tool + travel expense data.

### 1.2 Sustainable Infrastructure

- AWS af-south-1 selected partly for proximity to renewable energy sources.
- Serverless and containerized architecture minimizes idle compute.
- E-waste policy: All hardware disposed via certified recyclers.

## 2. Social

### 2.1 Diversity & Inclusion

| Metric                                   | 2025 Baseline | 2026 Target | 2030 Target |
| ---------------------------------------- | ------------- | ----------- | ----------- |
| Female representation (overall)          | 35%           | 40%         | 50%         |
| Female representation (technical)        | 25%           | 30%         | 40%         |
| African national representation (non-SA) | 20%           | 25%         | 35%         |
| Board diversity (female directors)       | 0             | 1           | ≥ 1         |

**Programs:**

- Internship pipeline with University of Cape Town and University of Zimbabwe.
- mentorship program pairing senior engineers with junior talent from underrepresented groups.
- Unconscious bias training for all hiring managers.

### 2.2 Community Impact

| Initiative                                              | Target     | Status      |
| ------------------------------------------------------- | ---------- | ----------- |
| Zimbabwe pilot supporting 2+ local banks                | 2026-Q3    | In progress |
| Free compliance tooling for smallholder cooperatives    | 2027       | Planned     |
| Open-source security tools (audit-signer, replay-guard) | Continuous | Active      |

### 2.3 Employee Wellbeing

- Remote-first policy with quarterly in-person gatherings.
- Mental health support: subsidized counseling sessions.
- Professional development budget: $2,000 per employee per year.

## 3. Governance

### 3.1 Board Oversight

- ESG metrics reported to Board quarterly.
- Dedicated ESG review in annual board evaluation (target 2027).

### 3.2 Ethical AI

- Algorithmic bias testing in eval-pipeline.
- Human-in-the-loop for all consequential AI decisions.
- Transparency: Model cards published for all production AI systems.

### 3.3 Supply Chain

- Vendor security questionnaire includes ESG questions.
- Preference for vendors with published sustainability policies.
- No vendors on environmental or labor violation watchlists.

## 4. Reporting

| Report                  | Frequency | Audience             |
| ----------------------- | --------- | -------------------- |
| ESG metrics dashboard   | Quarterly | Board, investors     |
| Carbon footprint report | Annual    | Public (website)     |
| Diversity report        | Annual    | Public (website)     |
| Impact assessment       | Per pilot | Donors, DFI partners |

## 5. Compliance Mapping

| Framework           | Control                           | Evidence               |
| ------------------- | --------------------------------- | ---------------------- |
| King IV Principle 3 | Responsible corporate citizenship | This document          |
| King IV Principle 7 | Composition of the board          | Diversity targets      |
| GRI 305             | Emissions                         | Carbon footprint table |
| GRI 405             | Diversity and equal opportunity   | Diversity table        |
| UN SDG 5            | Gender equality                   | Diversity programs     |
| UN SDG 13           | Climate action                    | Carbon targets         |

---

_Last updated: 2026-05-25_
