# ADR-007: Use Kustomize over Helm for K8s manifest management

## Status

Accepted

## Context

GTCX deploys services across multiple environments (development, staging, production) and multiple jurisdictions. We need a system to manage Kubernetes manifests that supports environment-specific overrides without duplicating base definitions.

The two dominant approaches are Helm (template engine with charts) and Kustomize (native kubectl overlay system).

## Decision

Use Kustomize with a base/overlay pattern for all Kubernetes manifest management.

Directory structure:

```
infra/kubernetes/
  base/           # Shared resource definitions
  overlays/
    development/  # Dev-specific patches
    staging/      # Staging-specific patches
    production/   # Production-specific patches + scaling
```

## Rationale

- **Native kubectl support** -- `kubectl apply -k` works without installing additional tooling
- **No template engine complexity** -- YAML stays as valid YAML, not Go templates with `{{ .Values }}` syntax
- **Transparent patches** -- overlays clearly show what differs per environment as strategic merge patches
- **GitOps compatibility** -- Kustomize output is deterministic, making it straightforward to diff and review in PRs
- **Lower learning curve** -- operators read standard YAML, not Helm template syntax
- **No chart repository overhead** -- no need to package, version, and host charts

## Consequences

- Must maintain overlay patches per environment; adding a new field to a base resource may require updating overlays
- No built-in package ecosystem (Helm charts from vendors cannot be used directly, though `kustomize` can reference remote bases)
- Complex conditional logic is harder than in Helm templates; structural changes across environments require separate base variants
