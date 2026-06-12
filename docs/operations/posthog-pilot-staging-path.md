---
title: PostHog self-host pilot staging path
status: current
date: 2026-06-12
owner: fabric-os
initiative: INIT-AGENT-TOOL-SCOUT
pilot: PILOT-POSTHOG-PILOT-PROOF
---

# PostHog pilot staging path

Self-hosted PostHog captures **pilot session replay** on fabric staging for enterprise-pilot-dod usage proof. No production PII; staging-only keys.

## Deploy path

1. **Namespace** — `fabric-staging/posthog` (Helm or docker-compose overlay)
2. **Ingress** — internal-only; VPN or staging tunnel required
3. **Capture targets** — markets-os pilot convening demo + fabric GTMAAS operator surfaces
4. **Evidence** — `audit/evidence/tool-scout-posthog-pilot.json` with `captureConfigured: true`

## Environment contract

| Variable             | Owner     | Notes                         |
| -------------------- | --------- | ----------------------------- |
| `POSTHOG_API_KEY`    | fabric-os | Staging SM — Class A populate |
| `POSTHOG_HOST`       | fabric-os | Internal staging URL          |
| `POSTHOG_PROJECT_ID` | fabric-os | Pilot project only            |

## Done when

- [x] Staging path documented (this doc)
- [x] Pilot witness cites deploy path + pillar lift (trust + technical excellence)
- [ ] Helm apply on staging cluster (Class R — infra window)
