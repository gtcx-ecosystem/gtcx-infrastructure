# GTCX Kubernetes Policies

## Prerequisites

These policies require [Kyverno](https://kyverno.io/) to be installed in the target cluster:

```bash
helm install kyverno kyverno/kyverno \
  --namespace kyverno \
  --create-namespace \
  --set admissionController.replicas=3
```

## Policies

| Policy                         | Action  | Scope                                                    |
| ------------------------------ | ------- | -------------------------------------------------------- |
| `reject-latest-tag.yaml`       | Enforce | Block `:latest` image tags in production and staging     |
| `require-resource-limits.yaml` | Enforce | Require CPU/memory requests and limits on all containers |

## Application

Policies are **not** applied by default via Kustomize. They must be explicitly opted into per overlay:

```yaml
# In your environment overlay kustomization.yaml
resources:
  - ../../base/policies/reject-latest-tag.yaml
  - ../../base/policies/require-resource-limits.yaml
```

This allows lower environments (e.g., development) to skip enforcement while keeping production hardened.

## CI Validation

Even without Kyverno installed, CI validates these rules using `tools/policy/check-k8s-policy.mjs`:

```bash
pnpm run check:k8s-policy
```
