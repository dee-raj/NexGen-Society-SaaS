# NexGen Society SaaS

## 🌍 What is NexGen?

NexGen Society SaaS is an enterprise-grade, multi-tenant backend platform built for housing societies, gated communities, and residential associations.

It provides a robust financial engine, strict tenant data isolation, audit-compliant accounting, and scalable infrastructure designed for real-world production environments.

This system is built not as a CRUD app — but as a scalable SaaS foundation capable of handling thousands of societies securely and independently.

## 🚀 Key Features

### 🏢 Society & Structure Management
- **Multi-tenancy**: Automatic tenant isolation using `X-Tenant-Id` header.
- **Hierarchical Layout**: Manage Societies, Buildings, and Flats.
- **Resident Management**: Track Owners, Tenants, and Family members with status history.

### 💰 Financial Engine (Enterprise Grade)
- **Maintenance Templates**: Flexible calculation methods (Fixed or Per Sq-Ft).
- **Invoicing System**: Automated monthly invoice generation with sequential numbering.
- **Payment Processing**: Secure payments with MongoDB transactions for atomic updates.
- **Immutable Ledger**: Append-only accounting records (unbreakable audit trail).
- **Expense Tracking**: Manage society-level costs with approval workflows.
- **Defaulter Analytics**: Real-time tracking of overdue accounts and late fees.

### 🔐 Security & Auth
- **JWT Authentication**: Secure access and refresh token rotation.
- **RBAC**: Role-Based Access Control (`SUPER_ADMIN`, `SOCIETY_ADMIN`, `RESIDENT`).
- **Audit Logging**: Automatic tracking of every data change for accountability.

## 📈 Scalability & SaaS Architecture

NexGen is designed for horizontal scalability and production-grade SaaS deployments:

- Stateless API layer (horizontally scalable behind load balancer)
- Tenant-scoped database queries via Mongoose plugin
- Redis-backed rate limiting & caching
- Event-driven architecture using NATS
- MongoDB indexing optimized for tenant-based queries
- Designed for containerized & Kubernetes environments
- Ready for microservice extraction (Finance, Billing, Auth modules)

---

## 🛠️ Tech Stack
- **Runtime**: Node.js (>=18)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Message Broker**: NATS (Event-driven Architecture)
- **Caching & Rate Limiting**: Redis
- **Validation**: Zod
- **Logging**: Pino
- **Security**: Helmet, CORS, Rate-limiting
- **Deployment**: Docker, Docker Compose, Nginx Reverse Proxy
- **Process Manager**: PM2

## 🏁 Getting Started

### Prerequisites
- Node.js installed
- MongoDB instance running

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` with your MongoDB URI and JWT secrets.*

### Running the App
- **Development Mode**:
  ```bash
  npm run dev
  ```
- **Build**:
  ```bash
  npm run build
  ```
- **Production Mode**:
  ```bash
  npm start
  ```


## 🔹 How to deploy / start

### Option A: Using Docker & Docker Compose (Recommended for Production)
```bash
# 1. Build and start containers in detached mode
docker-compose up -d --build

# 2. View application logs
docker-compose logs -f nexgen-api

# 3. Stop containers
docker-compose down
```
*Note: Ensure `.env.production` is configured before running Docker.*

### Option B: Using PM2 (Bare Metal/VM)
```bash
# 1. Build your project
npm run build

# 2. Start PM2 (first time)
pm2 start ecosystem.config.js --env production

# 3. Reload after changes
npm run build
pm2 reload ecosystem.config.js --env production

# 4. Save process list for restart on server reboot
pm2 save
pm2 startup
```

## 📊 Monitoring & Alerts
We recommend utilizing Prometheus and Grafana for comprehensive system monitoring:
- **Metrics Endpoint**: Exposed at `/metrics` (Requires `prom-client` & `@willsoto/nestjs-prometheus` equivalents for Express).
- **Log Aggregation**: Fluent Bit / Filebeat routing to Elasticsearch or Loki.
- **Alerting**: Alertmanager configured for anomalies (e.g., High 5xx errors, Disk Space > 85%, CPU > 80%).
See `docs/production/MONITORING.md` for full implementation details.

## 🏗️ Architecture
The project follows a modular architecture:
- `src/modules`: Domain-specific logic (Auth, Finance, Society, etc.)
- `src/shared`: Reusable middleware, plugins, and utilities.
- `src/config`: Global configuration and logger setup.
- `src/app.ts`: Entry point of the application.
- `src/server.ts`: Server initialization and startup.

## 🔐 Security & Compliance

NexGen follows security best practices for SaaS environments:

- JWT Access + Refresh Token Rotation
- Role-Based Access Control (RBAC)
- Tenant-level Data Isolation (Query-level enforcement)
- Helmet-secured HTTP headers
- CORS policy enforcement
- Rate limiting (Redis-backed)
- Immutable financial ledger (append-only records)
- Full audit logging of all mutations
- Environment-based secret management
- Ready for HTTPS + Reverse Proxy deployment

Future Enhancements:
- Field-level encryption for sensitive data
- SOC2-ready logging structure
- S3-compatible secure document storage
- IP whitelisting for Admin endpoints

## 🔒 Multi-tenant Isolation
Data isolation is enforced at the database level via a Mongoose plugin (`tenantScopePlugin`). All queries automatically filter by `societyId` based on the `X-Tenant-Id` header provided in the request.

### Database Optimization

All tenant-scoped collections enforce compound indexes:

- societyId + createdAt
- societyId + status
- societyId + flatId

This ensures efficient query performance even at high tenant scale.

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Configure `.env.production`
- [ ] Enable MongoDB Replica Set (required for transactions)
- [ ] Secure Redis with password
- [ ] Configure Nginx with HTTPS (SSL)
- [ ] Enable PM2 cluster mode or Docker scaling
- [ ] Setup Prometheus metrics scraping
- [ ] Configure Alertmanager rules
- [ ] Enable log aggregation (ELK / Loki)
- [ ] Backup strategy for MongoDB
- [ ] Setup CI/CD pipeline

© 2026 NexGen Society SaaS Team
