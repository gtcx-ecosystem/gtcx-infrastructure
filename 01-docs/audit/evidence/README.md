---
title: 'Audit Evidence Artifacts'
status: current
date: '2026-05-31'
owner: agent:platform-architect
tier: critical
tags: ['audit', 'evidence']
review_cycle: on-change
---

# Audit Evidence Artifacts

Operator-generated release and DR evidence bundles land here (for example
`dr-test.sh` output under dated subdirectories). CI dry-runs use a temp
directory — see `03-platform/tools/scripts/runtime-evidence-check.mjs`.
