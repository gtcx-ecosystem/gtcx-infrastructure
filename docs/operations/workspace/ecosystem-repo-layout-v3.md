---
title: 'Ecosystem repo layout v3 — pointer'
status: current
date: 2026-06-06
owner: gtcx-infrastructure
---

# Ecosystem repo layout v3 — pointer

> **Normative SoR (gtcx-docs):**  
> [ecosystem-repo-layout-v3.md](https://github.com/gtcx-ecosystem/canon-os/blob/main/01-docs/governance/protocols/29-agent-workspace-domains/ecosystem-repo-layout-v3.md)  
> **Session hygiene:** [Protocol 30](https://github.com/gtcx-ecosystem/canon-os/blob/main/01-docs/governance/protocols/30-agent-session-layout-hygiene/protocol.md)

This path exists so `config/ops.manifest.json` → `layout` resolves locally. **Do not edit normative rules here** — change the gtcx-docs spec.

**Rollout:** `pnpm ecosystem:rollout-layout-v3` (gtcx-agentic)  
**Score after each session:** `pnpm ecosystem:session:hygiene -- --repo gtcx-infrastructure`
