# ADR-011: Connectivity Profiles

## Status

Accepted

## Date

2026-01-26

## Context

[Organization Name] serves audiences across varied connectivity conditions:

| Condition             | Characteristics         | Audience                           |
| --------------------- | ----------------------- | ---------------------------------- |
| **Full connectivity** | 4G/WiFi, rich media     | Urban professionals, international |
| **Limited data**      | 3G, metered connections | Semi-urban / frontier markets      |
| **Text-only**         | SMS, WhatsApp, USSD     | Rural areas, field operators       |
| **Email digest**      | Async, batched          | Corporate subscribers              |

A single distribution approach excludes significant portions of our target audience.

## Decision

Implement **6 connectivity profiles** with adaptive content delivery:

### Profile Definitions

```typescript
type ConnectivityProfile =
  | 'offline' // Zero connectivity - cached content only
  | 'ussd-only' // Feature phone, text-based only
  | 'edge' // 2G/EDGE, <200 Kbps
  | 'degraded' // 3G intermittent, 1-5 Mbps
  | 'standard' // 4G/WiFi, full capability
  | 'satellite'; // High latency, expensive
```

### Profile-Specific Content Delivery

| Profile     | Content Format    | Images     | Updates     | Priority      |
| ----------- | ----------------- | ---------- | ----------- | ------------- |
| `offline`   | Cached articles   | Cached     | Manual sync | Breaking only |
| `ussd-only` | 160-char alerts   | None       | On request  | Breaking only |
| `edge`      | Text summaries    | Thumbnails | 30 min      | High priority |
| `degraded`  | Compressed HTML   | Compressed | 15 min      | Normal        |
| `standard`  | Full rich content | Full       | Real-time   | All           |
| `satellite` | Compressed batch  | Compressed | Hourly      | High priority |

### Content Adaptation

Each piece of content adapts to connectivity:

```
Full Article (2,000 words, 5 images)
    │
    ├─► Standard: Full article, all images
    ├─► Degraded: Full article, compressed images
    ├─► Edge: 500-word summary, 1 thumbnail
    ├─► USSD: 160-char headline + link
    └─► Offline: Previously cached version
```

## Consequences

### Positive

1. **Reach everyone** — Content accessible across all conditions
2. **Cost efficiency** — Less data usage on expensive connections
3. **Better UX** — App adapts to actual conditions
4. **Inclusive design** — Feature phone users included

### Negative

1. **Increased complexity** — Multiple content formats
2. **Testing burden** — Must test all profile scenarios
3. **Content maintenance** — Multiple versions to manage

## Implementation

Content transformation happens at distribution:

```yaml
# In distribution config
profiles:
  standard:
    format: full
    images: full
    update_interval: 5m
  edge:
    format: summary
    images: thumbnail
    update_interval: 30m
  ussd:
    format: headline
    images: none
    update_interval: on_request
```

## Related Decisions

- [ADR-004: Offline-First Mobile](./ADR-004-offline-first-mobile.md)
- ADR-008: Multi-Channel Distribution (`ADR-008-multi-channel-distribution.md`)

## References

- Adapted from [Protocol Partner] ADR-0016
