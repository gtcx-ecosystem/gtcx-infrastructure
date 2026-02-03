# GTCX Infrastructure

DevOps tooling, deployment automation, and security framework for the GTCX ecosystem. Manages container orchestration, infrastructure-as-code, and zero-trust security across all environments.


## Deployment Infrastructure

| Tool | Purpose |
|------|---------|
| **Docker** | Container configurations for all services |
| **Kubernetes** | Orchestration (base manifests + overlays per environment) |
| **Terraform** | Multi-cloud provisioning (reusable modules + country-specific envs) |
| **Ansible** | On-premise provisioning for air-gapped deployments |


## Security Framework

| Component | Purpose |
|-----------|---------|
| **Zero-trust** | Network policies, mTLS, service mesh |
| **Threat models** | Per-service threat analysis |
| **Secrets management** | Vault integration, key rotation |
| **Audit logging** | Centralized security event collection |


## Structure

```
gtcx-infrastructure/
├── docker/               # Container configs
├── kubernetes/
│   ├── base/             # Base manifests
│   └── overlays/         # dev/staging/prod
├── terraform/
│   ├── modules/          # Reusable IaC modules
│   └── environments/     # Country-specific
├── ansible/              # On-premise provisioning
├── security/             # Zero-trust framework, threat models
├── monitoring/           # Observability (metrics, logging, tracing)
├── scripts/              # Deployment automation
└── docs/
```


## Dependencies

- None (standalone DevOps tooling)


## Source Reference

- Infrastructure: `../gtcx/infra/`
- Docker configs: `../gtcx/infra/docker/`
- Kubernetes: `../gtcx/infra/kubernetes/`
- Terraform: `../gtcx/infra/terraform/`
