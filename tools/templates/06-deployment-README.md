# Deployment

> **Infrastructure, Kubernetes, Terraform, and operational guides**


## Contents

| Section | Description |
|---------|-------------|
| [kubernetes/](./kubernetes/) | Kubernetes manifests and overlays |
| [terraform/](./terraform/) | Infrastructure as code |
| [air-gapped.md](./air-gapped.md) | Air-gapped deployment guide |
| [deployment.md](./deployment.md) | General deployment procedures |


## Deployment Targets

| Target | Description | Overlay |
|--------|-------------|---------|
| **Development** | Local development | `overlays/development/` |
| **Staging** | Pre-production testing | `overlays/staging/` |
| **Production** | Live production | `overlays/production/` |
| **Air-Gapped** | Government data centers | `overlays/air-gapped/` |


## Infrastructure Overview

```
infra/
├── docker/              # Dockerfiles and compose
│   └── observability/   # Prometheus, Loki, Grafana
├── kubernetes/          # K8s manifests
│   ├── base/            # Base configurations
│   └── overlays/        # Environment-specific
├── terraform/           # Cloud provisioning
│   ├── modules/         # Reusable modules
│   └── environments/    # Per-jurisdiction
├── compliance/          # Compliance automation
└── security/            # Security tooling
```


## Key Principles

### P14: DEPLOYABLE
> Same artifact runs everywhere: cloud, on-premise, air-gapped, edge.

### P6: SOVEREIGN
> Each nation controls its own infrastructure. Data residency enforced.

### P15: OBSERVABLE
> Metrics, tracing, health — we see everything.


## Quick Start

### Local Development
```bash
# Start local services
docker-compose -f infra/docker/docker-compose.dev.yml up

# Or use Kubernetes
kubectl apply -k infra/kubernetes/overlays/development/
```

### Production Deployment
```bash
# Apply Terraform
cd infra/terraform/environments/ghana
terraform apply

# Deploy to Kubernetes
kubectl apply -k infra/kubernetes/overlays/production/
```


## Air-Gapped Deployments

Government data centers often require air-gapped deployments:

1. **Package all artifacts** (images, manifests, configs)
2. **Transfer via secure media** (USB, secure file transfer)
3. **Deploy from internal registry**
4. **No external network dependencies**

See [air-gapped.md](./air-gapped.md) for detailed guide.


## Related Documentation

- [Architecture Overview](../02-architecture/)
- [Engineering Standards](../05-engineering/)
- [Security Guide](./security/)
