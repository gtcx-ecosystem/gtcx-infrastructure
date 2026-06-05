# Pen-Test K8s Overlay

Isolated Kubernetes overlay for penetration testing targets.

## Contents

| File                 | Purpose                        |
| -------------------- | ------------------------------ |
| `namespace.yaml`     | Dedicated `pen-test` namespace |
| `kustomization.yaml` | Kustomize overlay entry point  |

## Usage

```bash
kubectl apply -k 04-ship/kubernetes/overlays/pen-test/
```

> Deploy only during authorized pen-test windows.
