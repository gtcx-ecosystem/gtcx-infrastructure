# Edge Proxy Configuration

> **Note**: This folder is reserved for future deployment infrastructure.

## Purpose

Thin edge layer for:
- TLS termination
- Geographic routing  
- DDoS protection
- Static asset caching

**This is NOT an API gateway** - no application logic lives here.

## Future Contents

When implemented, this will contain:
- `nginx/` - Nginx configurations
- `envoy/` - Envoy proxy configs (alternative)
- `cloudflare/` - Cloudflare Workers scripts
- `kubernetes/` - Ingress configurations

## Architecture Decision

We deliberately chose NOT to build a custom API gateway because:

1. **Protocol-First Architecture** - GTCX protocols (TradePass, GeoTag, GCI) handle their own authentication and validation cryptographically.

2. **Decentralized Verification** - Each protocol validates independently via PANX consensus, not a central gateway.

3. **Client SDK Resilience** - Retry, circuit breaker, and offline handling live in `@gtcx/api-client`, not server-side.

4. **Platform-Specific Entry Points** - CRX, SGX, AGX have their own APIs and auth flows.

## When to Implement

Implement edge proxy when:
- Deploying to production
- Need geographic load balancing
- DDoS protection required
- TLS certificate management

Use industry-standard tools (nginx, envoy, Cloudflare) rather than custom code.


*Part of the [GTCX Protocol](../../README.md) infrastructure*
