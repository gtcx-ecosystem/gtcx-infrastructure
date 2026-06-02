---
title: 'Docker Images & Local Development'
status: current
date: '2026-06-02'
owner: devops
tags: ['docker', 'compose', 'local-dev', 'containers']
---

# Docker Images & Local Development

This directory contains Dockerfiles, Compose manifests, and init scripts for local development and CI.

## Images

| Dockerfile                | Purpose                                       | Base                   |
| ------------------------- | --------------------------------------------- | ---------------------- |
| `Dockerfile.node`         | Standard Node.js 20 runtime for GTCX services | `node:20-alpine`       |
| `Dockerfile.intelligence` | AI/ML inference runtime with model cache      | `python:3.11-slim`     |
| `Dockerfile.platforms`    | Multi-arch build stage (amd64 + arm64)        | `buildx` cross-compile |
| `Dockerfile.protocols`    | gtcx-protocols sidecar with native deps       | `node:20`              |

## Compose Stacks

| File                       | Services                                          | Use Case                     |
| -------------------------- | ------------------------------------------------- | ---------------------------- |
| `docker-compose.dev.yml`   | Postgres, Redis, NATS, localstack                 | Day-to-day local development |
| `docker-compose.infra.yml` | Observability stack (Prometheus, Grafana, Jaeger) | Local ops debugging          |
| `docker-compose.test.yml`  | Ephemeral test databases + fixtures               | CI test isolation            |

## Init Scripts

`init-scripts/` contains idempotent setup scripts for Postgres schemas, NATS streams, and Redis keys. Run automatically on `docker compose up`.

## Quick Start

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
# Wait for health checks, then:
pnpm test
```
