---
title: 'ADR-0007: Rename gtcx-infrastructure to fabric-os'
status: accepted
date: 2026-06-12
---

# ADR-0007: Rename gtcx-infrastructure to fabric-os

## Context

Coordination, P44 Fabric Consumption, and `service-fabric.json` used `fabric-os`
conceptually while the GitHub repository remained `gtcx-infrastructure`, causing
hub and workspace discovery failures parallel to the markets-os rename.

## Decision

- **Canonical repo id:** `fabric-os`
- **GitHub:** `gtcx-ecosystem/fabric-os` (renamed 2026-06-12; redirect from `gtcx-infrastructure`)
- **Local checkout:** `~/Sites/gtcx-ecosystem/fabric-os` (no legacy folder symlinks)
- **Legacy id:** `gtcx-infrastructure` resolves via `bridge-os/pm/spec/ecosystem-repo-aliases.json` (IDs only — not disk paths)

## Consequences

- Update remotes: `git remote set-url origin https://github.com/gtcx-ecosystem/fabric-os.git`
- Fleet scripts, hub `repoId`, and friction registers use `fabric-os`
- Outbound coordination filenames use `from-fabric-os-*`; inbound handoffs use `to-fabric-os-*`
- Dated audit evidence may still cite `gtcx-infrastructure` in filenames

## References

- `bridge-os/pm/spec/ecosystem-repo-aliases.json`
- `bridge-os/pm/spec/service-fabric.json`
- ADR-0006 (markets-os rename pattern)

## Does NOT Cover

- Renaming Kubernetes cluster or AWS resource names.
- Historical evidence artifact filenames.
- Authority ownership boundaries (fabric orchestrates; product repos implement).
