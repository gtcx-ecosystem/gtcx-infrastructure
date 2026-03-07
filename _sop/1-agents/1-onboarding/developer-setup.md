# Developer Setup — {repo-name}

---

## Prerequisites

| Tool   | Version   | Install                   |
| ------ | --------- | ------------------------- |
| {tool} | {version} | {install-command-or-link} |
| {tool} | {version} | {install-command-or-link} |
| {tool} | {version} | {install-command-or-link} |
| {tool} | {version} | {install-command-or-link} |

---

## Clone & Install

```bash
# 1. Clone the repository
git clone {repo-url}
cd {repo-name}

# 2. Install dependencies
{install-command}

# 3. Copy environment variables
cp .env.example .env

# 4. Set up the database
{db-setup-command}

# 5. Seed initial data (optional)
{seed-command}
```

---

## Environment Variables

Reference: `.env.example`

| Variable     | Description   | Where to Get It                             |
| ------------ | ------------- | ------------------------------------------- |
| `{VAR_NAME}` | {description} | {source — vault, team lead, auto-generated} |
| `{VAR_NAME}` | {description} | {source}                                    |
| `{VAR_NAME}` | {description} | {source}                                    |

> Never commit `.env` files. All secrets must come from a secure source.

---

## Local Services

```bash
# Start all required services (database, cache, message broker, etc.)
docker compose up -d

# Verify services are running
docker compose ps
```

| Service   | URL                     | Credentials                      |
| --------- | ----------------------- | -------------------------------- |
| {service} | http://localhost:{port} | {default-credentials-or-see-env} |
| {service} | http://localhost:{port} | {default-credentials-or-see-env} |
| {service} | http://localhost:{port} | {default-credentials-or-see-env} |

---

## Running the App

```bash
# Development server with hot reload
{dev-command}

# The app will be available at:
# {app-url}
```

---

## Running Tests

```bash
# Run all tests
{test-command}

# Run tests in watch mode
{test-watch-command}

# Run tests with coverage
{test-coverage-command}

# Run a specific test file
{test-single-command}
```

---

## Common Issues

| Problem                    | Cause            | Solution     |
| -------------------------- | ---------------- | ------------ |
| {error-message-or-symptom} | {why-it-happens} | {how-to-fix} |
| {error-message-or-symptom} | {why-it-happens} | {how-to-fix} |
| {error-message-or-symptom} | {why-it-happens} | {how-to-fix} |

---

## IDE Setup

**Recommended editor:** {editor}

**Extensions:**

- {extension-name} — {what-it-does}
- {extension-name} — {what-it-does}
- {extension-name} — {what-it-does}

**Settings:**

```json
{
  "editor.formatOnSave": true,
  "{additional-settings}": "{value}"
}
```

---

## Verification

Confirm your setup is working by checking each item:

- [ ] Repository cloned and dependencies installed without errors
- [ ] `.env` file created with all required variables
- [ ] Local services running (`docker compose ps` shows all healthy)
- [ ] App starts without errors (`{dev-command}`)
- [ ] Can access the app at {app-url}
- [ ] Tests pass (`{test-command}`)
- [ ] Can connect to the local database
- [ ] Can hit a sample API endpoint: `curl {sample-endpoint}`
