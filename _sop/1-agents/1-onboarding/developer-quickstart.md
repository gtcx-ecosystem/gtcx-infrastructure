# Developer Quickstart — {project-name}

Get a local environment running and complete your first end-to-end workflow.

---

## One-Line Setup

```bash
curl -sSL https://get.{project}.{tld} | sh && docker run -p 8000:8000 {project}/quickstart
```

{Describe what this does. Link to alternatives: Docker Compose, local dev, managed cloud.}

---

## First Workflow

1. Initialize environment
2. Perform a simple operation via API or UI
3. Verify result

```bash
# Example — replace with actual command
curl -X POST http://localhost:8000/api/v1/{resource} \
  -H "Authorization: Bearer {token}" \
  -d '{"field": "value"}'
```

---

## Architecture Overview

- {Core component 1} — {responsibility}
- {Core component 2} — {responsibility}
- {Where to plug in custom logic}

See [system design](../../engineering/2-system-design/system-design-template.md) for full architecture.

---

## Local Development

```bash
# Install dependencies
{install command}

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start dev servers
{dev start command}

# Run tests
{test command}
```

---

## Essential Resources

- API reference: {link}
- SDKs: {link}
- Tutorials: {link}
- Community: {link}

---

## Deploy

- **Kubernetes**: {link to sample manifest}
- **Docker Compose**: {link}
- **Managed cloud**: {CLI command}

---

## Need Help?

- Issues: {link}
- Security contact: {email}
- Commercial support: {link}
