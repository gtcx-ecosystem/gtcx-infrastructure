# SECaaS card — gtcx-markets

**Friction:** `SEC-WAF-01` (closed) · **DaaS overlap:** `XR-MKT-011`

## Stack security actions (gtcx-infrastructure)

1. WAF `AllowMarketsAuthorityEndpoints` — witness 7/7 authority trace
2. Ingress TLS + path rules per `xr-mkt-011-authority-url-matrix`
3. Pen-test scope includes AGX staging (`SEC-PENTEST-01` post vendor ack)

## Product handoff

Authority route or capture failures → `to-gtcx-infrastructure-markets-authority-*.md`

## Re-probe

`pnpm --dir ../gtcx-markets authority:trace:capture` after infra seal.
