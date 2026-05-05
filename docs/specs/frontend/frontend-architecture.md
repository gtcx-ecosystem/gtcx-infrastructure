# [Project Name] Frontend Architecture

**Document ID**: [DOC-FRONTEND-NNN]
**Version**: {version}
**Date**: {YYYY-MM-DD}
**Status**: [Draft / Technical Specification / Approved]

---

## Overview

The [Project Name] frontend is a [React / Vue / Next.js]-based [SPA / SSR application] that serves as the [dashboard / portal / interface] for [primary user types]. It consumes the [Backend Name] [REST / GraphQL / WebSocket] APIs.

---

## Technology Stack

| Component        | Technology                         | Purpose                                   |
| ---------------- | ---------------------------------- | ----------------------------------------- |
| Framework        | [React 18 / Vue 3 / etc.]          | UI component library                      |
| Language         | TypeScript 5.x                     | Type safety                               |
| State Management | [TanStack Query / Zustand / Redux] | Server state, caching, sync               |
| GraphQL Client   | [Apollo Client / urql]             | GraphQL queries, mutations, subscriptions |
| Routing          | [React Router / Next.js Router]    | Client-side navigation                    |
| Charting         | [Recharts / Chart.js / D3]         | [Score charts, trend lines, dashboards]   |
| Tables           | [TanStack Table / AG Grid]         | Sortable, filterable data tables          |
| Forms            | [React Hook Form + Zod]            | Form state management, validation         |
| Styling          | [Tailwind CSS / CSS Modules]       | [Utility-first / Component-scoped] CSS    |
| Build            | [Vite / Next.js / Webpack]         | Fast development and production builds    |
| Testing          | [Vitest / Jest + Testing Library]  | Unit and integration tests                |
| E2E Testing      | [Playwright / Cypress]             | End-to-end browser tests                  |

---

## Application Structure

```
src/
  main.tsx                     -- Application entry point
  App.tsx                      -- Root component, routing configuration
  api/
    client.ts                  -- HTTP client with auth interceptor
    graphql.ts                 -- [Apollo / urql] Client configuration
    websocket.ts               -- WebSocket connection manager
  pages/
    [Page1].tsx                -- [Page description]
    [Page2].tsx                -- [Page description]
    [Page3].tsx                -- [Page description]
  components/
    [Component1].tsx           -- [Component description]
    [Component2].tsx           -- [Component description]
    [Component3].tsx           -- [Component description]
  hooks/
    useAuth.ts                 -- Authentication state
    use[Domain].ts             -- [Domain] context hook
    useWebSocket.ts            -- WebSocket subscription management
  utils/
    format[X].ts               -- [X] display formatting
    [other utils]
  types/
    api.ts                     -- API response types
    graphql.ts                 -- Generated GraphQL types
```

---

## Authentication Flow

1. User authenticates via [OAuth 2.0 / JWT / Session]
2. Access token stored in [memory / localStorage / sessionStorage]
3. Refresh token stored in [HTTP-only secure cookie / secure storage]
4. [Axios / fetch] interceptor attaches Bearer token to all API requests
5. [GraphQL client] link attaches token to GraphQL requests
6. WebSocket connection includes token as [query parameter / header]
7. Token refresh triggered automatically on 401 response

---

## Real-Time Updates

[If applicable — describe WebSocket or SSE connection management:]

- Connection established on [page / app] mount
- Subscriptions registered per page
- Reconnection with exponential backoff on disconnection
- Last-event-id tracked for gap-free delivery on reconnect
- [State management] cache invalidated on WebSocket events

---

## Performance Targets

| Metric                   | Target  |
| ------------------------ | ------- |
| First Contentful Paint   | < [N]s  |
| Time to Interactive      | < [N]s  |
| Largest Contentful Paint | < [N]s  |
| Bundle size (gzipped)    | < [N]KB |
| [Key render metric]      | < [N]ms |

---

## Accessibility

- WCAG 2.1 AA compliance
- All interactive elements keyboard-navigable
- [Score / status] indicators include text labels (not color alone)
- ARIA labels on all data visualization components
- Minimum contrast ratio 4.5:1

---

**Document Status**: [Status]
**Review Cycle**: [Monthly / Quarterly]
**Owner**: [Frontend Team / Platform Team]
