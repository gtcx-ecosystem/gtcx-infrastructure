---
title: 'GTCX Migration Stack'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['compliance', 'architecture', 'infrastructure', 'api', 'frontend']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Migration Stack

## Overview

The GTCX Migration Stack is a domain-agnostic infrastructure layer that transforms heterogeneous data sources into verified, standardized formats while providing multilingual user guidance.

---

## ⚠️ Repository Notice

**The core source code and migration tooling for MABA, KORA, and AMANI have been moved to the [sensei-ai](https://github.com/gtcx-ecosystem/sensei-ai) project.**

This repository (`gtcx-infrastructure`) maintains the **deployment manifests**, **sovereign stack templates**, and **infrastructure-as-code** required to run these components in a production environment.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
│      Citizens | Governments | Enterprises | Developers      │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                    AMANI - Guidance Layer                   │
│   Multilingual Conversational AI (200+ languages)           │
│   Channels: WhatsApp | SMS | USSD | Voice | Web            │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────────┐
        │                   │                 │
┌───────▼──────┐   ┌────────▼────────┐   ┌───▼──────────────┐
│     MABA     │◄──►     KORA        │◄──►  External APIs   │
│ Transformation│   │  Verification   │   │  Gov Registries  │
│    Engine    │   │     Oracle      │   │  Satellite Data  │
└──────────────┘   └─────────────────┘   └──────────────────┘
```

## Components

### MABA - Universal Transformation Engine

Transform any data from any source into any target schema. AI-powered schema mapping with 95%+ automatic accuracy.

### KORA - Multi-Source Verification Oracle

Create tamper-proof verification through multi-source consensus. Byzantine fault-tolerant consensus across sources.

### AMANI - Multilingual Guidance Layer

Make complex processes accessible to everyone. Supports 200+ languages with cultural adaptation and multi-channel delivery.

---

## Running & Deployment

Since the core logic has moved to `sensei-ai`, this repository focuses on **orchestration**.

### Local Development Boundary

This repository does not currently ship standalone `maba`, `kora`, or `amani` Compose services.
Use `sensei-ai` for local runtime development of those components.
This repo owns deployment-facing docs, templates, and infrastructure wiring.

```bash
# Audit migration deployment docs from the repo root
python 04-ship/migrations/03-platform/scripts/check_docs.py
```

### Sovereign Stack Deployment

For national or institutional deployments, use the Terraform modules and Kubernetes overlays:

```bash
# Example: Deploying to a jurisdictional node
cd 04-ship/terraform/environments/zimbabwe-pilot
terraform apply
```

---

## API Overview (Integration Pointers)

### MABA

`POST /api/v1/transform` | `GET /api/v1/jobs/{id}`

### KORA

`POST /api/v1/verify` | `GET /api/v1/proof/{id}`

### AMANI

`POST /api/v1/chat` | `POST /api/v1/translate`

---

## Documentation Structure

Documentation for the _deployment_ of these components is maintained here. Functional and code-level documentation resides in the `sensei-ai` repository.

| Script                                                    | Purpose                                     |
| :-------------------------------------------------------- | :------------------------------------------ |
| `04-ship/migrations/03-platform/scripts/generate_docs.py` | Generate deployment documentation templates |
| `04-ship/migrations/03-platform/scripts/check_docs.py`    | Audit deployment doc completeness           |

---

_Part of the [GTCX Protocol](../../README.md) ecosystem_
