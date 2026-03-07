# Service Overview — {service-name}

> Someone should understand this service in 5 minutes.

---

## What It Does

{two-to-three-sentence-description-of-what-this-service-does-and-why-it-exists}

---

## Architecture

**Where it fits:** {description-of-this-service-role-in-the-broader-system}

```
{architecture-diagram-placeholder}

  ┌──────────┐      ┌──────────────┐      ┌──────────┐
  │ {upstream}│─────>│ {this-service}│─────>│{downstream}│
  └──────────┘      └──────────────┘      └──────────┘
```

---

## Tech Stack

| Layer          | Technology          |
| -------------- | ------------------- |
| Runtime        | {runtime}           |
| Framework      | {framework}         |
| Database       | {database}          |
| Cache          | {cache}             |
| Message Broker | {broker}            |
| Auth           | {auth-mechanism}    |
| Deployment     | {deployment-target} |

---

## Key Concepts

| Term          | Definition                      |
| ------------- | ------------------------------- |
| {domain-term} | {what-it-means-in-this-service} |
| {domain-term} | {what-it-means-in-this-service} |
| {domain-term} | {what-it-means-in-this-service} |

---

## Directory Structure

```
{service-name}/
├── src/
│   ├── {dir}/          # {purpose}
│   ├── {dir}/          # {purpose}
│   ├── {dir}/          # {purpose}
│   ├── {dir}/          # {purpose}
│   └── {entry-file}    # {purpose}
├── tests/              # {test-description}
├── {config-file}       # {purpose}
└── {config-file}       # {purpose}
```

---

## Key Files

| File          | Purpose               |
| ------------- | --------------------- |
| `{file-path}` | {what-this-file-does} |
| `{file-path}` | {what-this-file-does} |
| `{file-path}` | {what-this-file-does} |
| `{file-path}` | {what-this-file-does} |

---

## Data Flow

```
{data-flow-description}

1. {step-1-what-triggers-the-flow}
2. {step-2-what-happens-next}
3. {step-3-processing-or-transformation}
4. {step-4-where-data-ends-up}
```

---

## Dependencies

**This service depends on:**

| Dependency            | Type                              | Purpose             |
| --------------------- | --------------------------------- | ------------------- |
| {service-or-resource} | Service / Database / External API | {why-it-needs-this} |
| {service-or-resource} | Service / Database / External API | {why-it-needs-this} |

**What depends on this service:**

| Consumer       | How It Connects                    |
| -------------- | ---------------------------------- |
| {service-name} | {api-call / event / direct-import} |
| {service-name} | {api-call / event / direct-import} |

---

## API

**Key endpoints / interfaces:**

| Method     | Path     | Description    |
| ---------- | -------- | -------------- |
| `{METHOD}` | `{path}` | {what-it-does} |
| `{METHOD}` | `{path}` | {what-it-does} |
| `{METHOD}` | `{path}` | {what-it-does} |

**Authentication:** {auth-method}

**API documentation:** {link-to-swagger-or-docs}

---

## Running Locally

```bash
# Quick start
{quick-start-command}

# Available at
# {local-url}
```

For full setup instructions, see [Developer Setup](developer-setup.md).
