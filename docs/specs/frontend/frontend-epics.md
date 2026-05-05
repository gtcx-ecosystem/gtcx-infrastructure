# Frontend Epics — {Project Name}

Suggested epic structure for frontend products. Adapt to your project — remove epics that don't apply, add product-specific ones, adjust priorities.

---

## Epic Template

```
Epic: {Name}
Priority: P0 / P1 / P2 / P3
Outcome: {measurable outcome}

Features:
  - {Feature 1}
  - {Feature 2}
  - {Feature 3}
```

---

## Suggested Frontend Epics

### Epic 1: Design System and Component Library (P0)

**Outcome:** All UI built from a consistent, accessible, documented component library

**Features:**

- Design tokens (color, typography, spacing, border radius, shadows)
- Core component library (atoms, molecules, organisms)
- Theme system with light/dark mode support
- RTL layout support
- Accessibility foundations (focus management, ARIA patterns, skip links)
- Component documentation (Storybook or equivalent)

---

### Epic 2: Authentication and Onboarding (P0)

**Outcome:** Users can securely sign in and reach their role-specific starting point

**Features:**

- Adaptive login (email/password, SSO, MFA)
- Role-based dashboard routing
- First-time onboarding flow
- Session management and timeout handling
- Security visualization (login history, active sessions)

---

### Epic 3: Core Workflows (P1)

**Outcome:** Users can complete their primary job-to-be-done end to end

**Features:**

- {Workflow 1} — {brief description}
- {Workflow 2} — {brief description}
- {Workflow 3} — {brief description}
- In-flow validation and error recovery
- Progress indicators and confirmation states

---

### Epic 4: Verification and Trust Surfaces (P1)

**Outcome:** Verified data and credentials are displayed clearly and exportable

**Features:**

- Verified status display (badges, seals, metadata)
- QR code generation and scanning
- Print and export (PDF, CSV)
- Audit trail viewer

---

### Epic 5: Search and Discovery (P1)

**Outcome:** Users can find what they need quickly across the full data set

**Features:**

- Global search with filters and facets
- Map-based search (if applicable)
- Saved searches and recent history
- Export of search results

---

### Epic 6: Mobile and Offline (P2)

**Outcome:** Core workflows function on mobile devices with intermittent connectivity

**Features:**

- PWA shell with offline support
- Background sync on reconnect
- Touch-optimized interactions (tap targets, swipe gestures)
- Reduced-data mode
- Native share and camera integration (if applicable)

---

### Epic 7: Reporting and Analytics (P2)

**Outcome:** Decision-makers can view, filter, and export key data

**Features:**

- Dashboard with configurable widgets
- Data visualization (charts, tables, maps)
- Date range and filter controls
- Export (CSV, PDF, scheduled reports)

---

### Epic 8: Settings and Administration (P2)

**Outcome:** Admins can manage users, roles, and system configuration

**Features:**

- User management (invite, deactivate, role assignment)
- Notification preferences
- Organization/team settings
- Audit log access

---

## Feature Breakdown Template

```
Feature: {Name}
Story Points: {N}
Priority: P0 / P1 / P2 / P3
Epic: {Epic name}

User Stories:
- {US-NNN}: As a {user type}, I want {goal} so that {benefit}

Acceptance Criteria:
- [ ] {specific, testable criterion}
- [ ] {specific, testable criterion}

Definition of Done:
- [ ] Meets design spec
- [ ] Passes accessibility audit (WCAG AA)
- [ ] Unit and integration tests written
- [ ] Tested on target devices
- [ ] Performance budget not exceeded
```

---

## Priority Assignment Guide

| Priority | When to assign                                                          |
| -------- | ----------------------------------------------------------------------- |
| P0       | Blocks all other work — required before any user can access the product |
| P1       | Required for core user value — part of the primary workflow             |
| P2       | Enhances the experience — users can complete key tasks without it       |
| P3       | Nice-to-have — defer until P0–P2 are stable                             |
