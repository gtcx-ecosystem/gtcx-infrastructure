# Environment Configuration

> Environment topology, configuration profiles, and secrets management for [Organization Name].

---

## 1. Environment Topology

| Environment             | Purpose                               | Audience                    | Promotion                     |
| ----------------------- | ------------------------------------- | --------------------------- | ----------------------------- |
| **Local**               | Developer workstation                 | Engineers                   | Manual                        |
| **Development** (`dev`) | Integration testing, feature branches | Engineering team            | Auto on merge to `develop`    |
| **Staging** (`staging`) | Pre-release validation, QA sign-off   | Engineering + QA            | Auto on merge to `staging`    |
| **Production** (`prod`) | Live user traffic                     | All users                   | Manual promotion from staging |
| **Preview**             | PR-level previews                     | Engineering + design review | Auto on PR open               |

### Environment Parity

- Staging must mirror production infrastructure (same instance types, same config)
- The only differences between staging and production are: data (anonymized in staging), traffic scale, and external integrations (use sandbox accounts in staging)
- All environment-specific differences are documented in this file

---

## 2. Configuration Profiles

### Environment Variables

| Variable                | Description                 | Dev                       | Staging                            | Production                 |
| ----------------------- | --------------------------- | ------------------------- | ---------------------------------- | -------------------------- |
| `NODE_ENV`              | Runtime environment         | `development`             | `staging`                          | `production`               |
| `DATABASE_URL`          | Primary database connection | Local PostgreSQL          | Staging Cloud SQL                  | Production Cloud SQL       |
| `REDIS_URL`             | Cache and queue connection  | Local Redis               | Staging Redis                      | Production Redis           |
| `LOG_LEVEL`             | Application log verbosity   | `debug`                   | `info`                             | `warn`                     |
| `API_BASE_URL`          | Internal API base URL       | `http://localhost:{port}` | `https://api.staging.[org-domain]` | `https://api.[org-domain]` |
| `[AI_PROVIDER]_API_KEY` | AI model provider key       | Dev key                   | Staging key                        | Production key             |

All secrets are sourced from [Secret Manager]. Never hardcode values in config files.

### Feature Flags

| Flag          | Dev    | Staging | Production | Description   |
| ------------- | ------ | ------- | ---------- | ------------- |
| `[FEATURE_A]` | `true` | `true`  | `false`    | [Description] |
| `[FEATURE_B]` | `true` | `false` | `false`    | [Description] |

Feature flags are managed via [feature flag service / environment variable]. Enable in staging before enabling in production.

---

## 3. Infrastructure per Environment

### Compute Sizing

| Service                   | Dev   | Staging                     | Production                    |
| ------------------------- | ----- | --------------------------- | ----------------------------- |
| Web (`[org]-web`)         | Local | 1 instance, 0.5 vCPU, 256MB | 2–10 instances, 1 vCPU, 512MB |
| API (`[org]-api`)         | Local | 1 instance, 1 vCPU, 512MB   | 2–20 instances, 2 vCPU, 1GB   |
| Workers (`[org]-workers`) | Local | 1 instance, 0.5 vCPU, 256MB | 0–5 instances, 1 vCPU, 512MB  |
| AI agents (`[org]-ai`)    | Local | 1 instance, 1 vCPU, 1GB     | 0–3 instances, 2 vCPU, 2GB    |

### Database

| Environment | Instance            | vCPU | RAM   | Storage   |
| ----------- | ------------------- | ---- | ----- | --------- |
| Dev         | Local PostgreSQL    | —    | —     | —         |
| Staging     | `db-f1-micro`       | 1    | 614MB | 10GB SSD  |
| Production  | `db-custom-[N]-[N]` | [N]  | [N]GB | [N]GB SSD |

---

## 4. Secrets Management

### Rules

- Secrets are never stored in git, environment files (`.env`), or application config files
- All secrets are stored in [Secret Manager service]
- Each service account has access only to the secrets it needs
- Secret rotation schedule: high-privilege credentials every [N] days; standard every [N] days

### Local Development

For local development, engineers use:

```bash
# Pull secrets to local .env (never committed)
[secret-manager-cli] secrets pull --env local > .env.local

# OR use a secrets management tool
direnv allow  # loads .envrc with secret references
```

`.env.local` and `.envrc` are in `.gitignore`.

### Adding a New Secret

1. Add secret to [Secret Manager] in all environments
2. Grant access to relevant service accounts
3. Document in this file (variable name + description, not value)
4. Reference in application config via environment variable

---

## 5. Access Control per Environment

| Environment | Engineer      | Senior Engineer | On-Call         | Admin |
| ----------- | ------------- | --------------- | --------------- | ----- |
| Local       | Full          | Full            | Full            | Full  |
| Dev         | Full          | Full            | Full            | Full  |
| Staging     | Deploy + read | Deploy + read   | Full            | Full  |
| Production  | Read-only     | Read-only       | Write (audited) | Full  |

Production write access for on-call engineers is time-limited (expires after [N] hours) and fully audited.

---

## 6. Environment Setup

### First-Time Setup (Engineer)

```bash
# Clone repo
git clone [repo-url]
cd [repo-name]

# Install dependencies
pnpm install

# Pull local environment config
[command to pull dev secrets]

# Start local services
docker-compose up -d  # start backing services (DB, Redis)
pnpm dev              # start application
```

### Environment Health Checks

| Environment | Health URL                                | Expected Response    |
| ----------- | ----------------------------------------- | -------------------- |
| Dev         | `http://localhost:{port}/health`          | `{ "status": "ok" }` |
| Staging     | `https://api.staging.[org-domain]/health` | `{ "status": "ok" }` |
| Production  | `https://api.[org-domain]/health`         | `{ "status": "ok" }` |

---

_Environment configuration is the foundation of reliable software delivery. Parity between staging and production prevents surprises._
