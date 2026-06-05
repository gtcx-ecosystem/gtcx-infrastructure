# GTCX Chaos Engineering — Production

## ⚠️ Warning

These manifests are **destructive**. Only apply during maintenance windows with explicit operator approval.

## Prerequisites

[LitmusChaos](https://litmuschaos.io/) must be installed:

```bash
helm install litmus litmuschaos/litmus \
  --namespace litmus \
  --create-namespace
```

## Experiments

| Experiment             | Target                  | Risk Level | Duration |
| ---------------------- | ----------------------- | ---------- | -------- |
| `pod-kill.yaml`        | Random platform pod     | Medium     | 10 min   |
| `network-latency.yaml` | Protocol service egress | Low        | 5 min    |
| `cpu-hog.yaml`         | Single AGX pod          | Medium     | 5 min    |

## Approval Process

1. Create a PagerDuty maintenance window
2. Notify `#gtcx-ops` Slack channel
3. Apply one experiment at a time
4. Monitor SLO dashboards during execution
5. Rollback immediately if error budget burn exceeds 2x

## Usage

```bash
# Pod kill experiment
kubectl apply -f pod-kill.yaml

# Monitor
watch kubectl get pods -n gtcx-production

# Clean up
kubectl delete -f pod-kill.yaml
```
