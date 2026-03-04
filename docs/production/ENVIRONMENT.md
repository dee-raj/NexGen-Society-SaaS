# Environment Strategy

## Overview
NexGen Society SaaS employs a multi-tier environment strategy to ensure reliable continuous integration and delivery. Managing environment variables securely across these environments is crucial.

## Environments

1. **Development (Local)**
   - Used by engineers for local development.
   - `.env` file (gitignored) based on `.env.example`.
   - Connects to local Docker containers (Mongo, Redis).

2. **Staging (Pre-Production)**
   - Mirrors production as closely as possible.
   - Tied to the `main` or `staging` branch.
   - Used for QA, integration testing, and user-acceptance testing (UAT).
   - Anonymized production data can be periodically synced here (with PII obfuscated).

3. **Production**
   - The live environment serving 1000+ societies.
   - Strictly controlled access.
   - Uses `docker-compose.prod.yml` or managed orchestration (Kubernetes/ECS).

## Secrets Management
**DO NOT use standard `.env` files on production servers.**
Instead, utilize a centralized secrets management tool:

- **AWS Secrets Manager** (Recommended if on AWS)
- **Doppler / HashiCorp Vault** (Cloud agnostic)
- **GitHub Secrets** (For CI/CD injection during deployment pipelines)

## Best Practices
- **Strict Verification:** CI pipelines must fail if required environment variables are missing during the build phase (e.g., using robust `zod` validation in `src/config/env.ts`).
- **Rotation:** Ensure keys (e.g., JWT Secrets, Payment Gateway API keys) can be rotated easily without application downtime.
- **Segregation:** Production and staging must use entirely different databases, cloud storage buckets, and third-party API keys to prevent cross-contamination.
