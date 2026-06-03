# `infra/docker/`

Docker images and build contexts for GTCX Infrastructure services.

## Images

| Dockerfile                | Service               | Target          |
| ------------------------- | --------------------- | --------------- |
| `Dockerfile.intelligence` | gtcx-intelligence-sdk | AI orchestrator |

## Build

All images are built via `docker buildx` for `linux/amd64` (EKS t3 nodes).

```bash
docker buildx build --platform linux/amd64 -f infra/docker/Dockerfile.intelligence -t gtcx-intelligence-sdk:latest .
```

## Agent note

Prefer multi-stage builds. Keep production images under 200MB.
All images pushed to `348389439381.dkr.ecr.af-south-1.amazonaws.com/`.
