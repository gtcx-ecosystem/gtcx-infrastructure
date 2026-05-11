# kubectl-access — JIT Kubernetes Access Tool

Implements the Just-In-Time access policy for production cluster access.

## Usage

```bash
# Request access for 1 hour (default)
./kubectl-access.sh request --cluster gtcx-af-south-1 --role cluster-admin --duration 1h

# Check current access
./kubectl-access.sh status

# Revoke access early
./kubectl-access.sh revoke
```

## Policy

- Access must be requested before use (no standing admin access)
- Maximum duration: 4 hours
- All actions are logged to audit trail
- Break-glass procedure documented in `docs/security/break-glass.md`
