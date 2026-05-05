# Screen Inventory and Navigation Map — {Project Name}

A complete list of all screens in the product, organized by category, with navigation structure and role access matrix.

---

## Screen Categories

- Authentication and Onboarding
- Dashboards (role-based)
- Core Workflows ({list workflow names})
- Search and Discovery
- Verification and Trust
- Reporting and Analytics
- Settings and Administration
- Mobile-Specific Screens
- Support and Help

---

## Screen List

Use the prefix `[CAT]` for the category code (e.g., `AUTH`, `DASH`, `WF`, `SRCH`, `ADMIN`).

```
AUTH-001: Login
AUTH-002: MFA Verification
AUTH-003: Password Reset
AUTH-004: Onboarding — Step 1
AUTH-005: Onboarding — Step 2

DASH-001: {Role A} Dashboard
DASH-002: {Role B} Dashboard
DASH-003: {Role C} Dashboard

WF-001: {Workflow Name} — Step 1
WF-002: {Workflow Name} — Step 2
WF-003: {Workflow Name} — Confirmation

SRCH-001: Search Results
SRCH-002: Detail View

...
```

---

## Screen Access Matrix

| Screen    | {Role A} | {Role B}  | {Role C} | {Admin}   |
| --------- | -------- | --------- | -------- | --------- |
| AUTH-001  | Primary  | Primary   | Primary  | Primary   |
| DASH-001  | Primary  | —         | —        | —         |
| DASH-002  | —        | Primary   | —        | —         |
| WF-001    | Primary  | Secondary | —        | Read-only |
| ADMIN-001 | —        | —         | —        | Primary   |

**Access levels:** Primary (full access), Secondary (limited/read), Read-only, None (—)

---

## Navigation Structure

### Primary navigation (top-level)

```
Home / Dashboard
├── {Section A}
│   ├── {Subsection 1}
│   └── {Subsection 2}
├── {Section B}
│   ├── {Subsection 1}
│   └── {Subsection 2}
├── Search
├── Reports
└── Settings
    ├── Profile
    ├── Notifications
    └── Administration (admin only)
```

### Mobile navigation pattern

- **Bottom tabs** for primary sections (max 5 items)
- **Hamburger menu** for secondary and admin sections
- **FAB (floating action button)** for primary action on each screen
- Back navigation: hardware/gesture back, in-app back button at top-left

### Accessibility navigation

- Skip-to-main-content link at top of every page
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>` on all pages
- Focus management: focus traps in modals, focus returns to trigger on close
- Keyboard shortcuts: {list if applicable}

---

## Transition and Loading Patterns

### Page transitions

- Default: instant with skeleton loading state
- Heavy pages: fade-in with skeleton (300ms)
- Modal open: slide-up or fade (200ms)
- Drawer: slide-in from edge (250ms)

### Loading states

| State              | Pattern                                    |
| ------------------ | ------------------------------------------ |
| First load         | Skeleton with shimmer                      |
| Subsequent loads   | Spinner in content area (not full-page)    |
| Background refresh | No visible indicator unless delayed > {n}s |
| Infinite scroll    | Spinner at bottom, auto-load               |

### Offline and error states

| State                | Treatment                                     |
| -------------------- | --------------------------------------------- |
| Offline              | Persistent banner + cached data shown         |
| Partial load failure | In-place error with retry                     |
| Full page error      | Friendly error page with navigation preserved |
| Empty state          | Illustrated empty + primary CTA               |

---

## Responsive Breakpoints

| Breakpoint | Width      | Target device                     |
| ---------- | ---------- | --------------------------------- |
| Mobile     | < 768px    | Phones                            |
| Tablet     | 768–1024px | Tablets, large phones (landscape) |
| Desktop    | > 1024px   | Laptops and monitors              |

### Adaptive behaviors by breakpoint

| Feature    | Mobile        | Tablet           | Desktop            |
| ---------- | ------------- | ---------------- | ------------------ |
| Navigation | Bottom tabs   | Side rail        | Full sidebar       |
| Tables     | Card view     | Scrollable table | Full table         |
| Forms      | Single column | Two column       | Two/three column   |
| Modals     | Full-screen   | Centered dialog  | Centered dialog    |
| Charts     | Simplified    | Full             | Full with tooltips |

---

## Checklist

- [ ] All screens enumerated with IDs
- [ ] Screen categories complete and consistent
- [ ] Role access matrix filled for every screen
- [ ] Primary navigation tree defined
- [ ] Mobile navigation pattern specified
- [ ] Accessibility navigation requirements documented
- [ ] Responsive breakpoints and adaptive behaviors defined
- [ ] Loading and error states defined for each pattern
