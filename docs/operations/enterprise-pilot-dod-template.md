---
title: Enterprise pilot definition of done (TAAS)
status: current
date: 2026-06-12
owner: fabric-os
initiative: INIT-AGENT-TOOL-SCOUT
pilot: PILOT-QWILR-PILOT-PACK
---

# Enterprise pilot DoD template

Normative checklist for **Qwilr** and fleet enterprise pilot packs under TAAS. Country-agnostic — jurisdiction overlays are Class R witness attachments, not pilot IDs.

## Required sections (interactive pack)

1. **Problem framing** — institutional buyer outcome (proof, not vibes)
2. **Security posture** — link compliance-os trust matrix + fabric staging boundary
3. **Pilot scope** — repos, duration, budget cap (`pm/tool-adoption-register.json`)
4. **Success metrics** — five-pillar lift cited in witness JSON
5. **Embedded witnesses** — links to `audit/evidence/tool-scout-*-pilot.json` in owner repos
6. **Expansion gate** — promote only after PostHog pilot proof witness green

## Qwilr pack wiring

| Field          | Source                                                     |
| -------------- | ---------------------------------------------------------- |
| ADV-PITCH base | `markets-os` ADV-PITCH-001 output (Phase B witness)        |
| Trust matrix   | `compliance-os/docs/operations/compliance-as-a-service.md` |
| Register row   | `fabric-os/pm/tool-adoption-register.json`                 |
| Witness sink   | `fabric-os/audit/evidence/tool-scout-qwilr-pilot.json`     |

## Done when

- [x] DoD template published (this doc)
- [x] Qwilr pilot witness cites template + ADV-PITCH dependency satisfied
- [ ] Operator runs Qwilr trial and attaches redacted pack URL to witness (Class R)
