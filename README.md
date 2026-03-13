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

Ensure the following tools are installed:

* **Node.js ≥ 20**
* **Docker ≥ 24**
* **Git**

Optional but recommended for production:

* **Nginx**
* **Docker Compose**

---

# 🧪 Development Setup (Local)

Run the application locally using Node.js while MongoDB and Redis run in Docker.

### 1. Clone Repository

```bash
git clone https://github.com/dee-raj/NexGen-Society-SaaS.git
cd NexGen-Society-SaaS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Example development `.env`:

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

MONGODB_URI=mongodb://localhost:27017/nexgen_society_saas
REDIS_URL=redis://localhost:6379
```

---

### 4. Start Infrastructure (Mongo + Redis)

```bash
docker run -d --name nexgen-mongo -p 27017:27017 mongo:7

docker run -d --name jwt-redis -p 6379:6379 redis:7-alpine
```

---

### 5. Start API Server

```bash
npm run dev
```

Server will start at:

```
http://localhost:5000
```

Health check:

```
GET /api/health
```

---

# 🐳 Production Deployment (Docker)

Production deployments run **all services inside Docker containers** connected through a private network.

---

## 1. Create Docker Network

```bash
docker network create nexgen-network
```

This network allows containers to communicate internally.

---

## 2. Create MongoDB Volume

Ensures database persistence.

```bash
docker volume create nexgen-mongo-data
```

---

## 3. Start MongoDB

```bash
docker run -d \
--name nexgen-mongo \
--network nexgen-network \
-v nexgen-mongo-data:/data/db \
mongo:7
```

---

## 4. Start Redis

```bash
docker run -d \
--name jwt-redis \
--network nexgen-network \
-p 6379:6379 \
redis:7-alpine
```

---

## 5. Build API Image

Inside the project directory:

```bash
docker build -t nexgen-saas --target production .
```

---

## 6. Configure Production Environment

Example `.env`:

```env
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1

MONGODB_URI=mongodb://nexgen-mongo:27017/nexgen_society_saas
REDIS_URL=redis://jwt-redis:6379
```

**⚠️ Important:**
Inside Docker **never use `localhost`** for services.

---

## 7. Start API Container

```bash
docker run -d \
--name nexgen-saas \
--network nexgen-network \
-p 5000:5000 \
--restart unless-stopped \
--env-file .env \
nexgen-saas
```

---

## 8. Verify Application

Check running containers:

```bash
docker ps
```

View logs:

```bash
docker logs -f nexgen-saas
```

Health check:

```
http://localhost:5000/health
```



# 🔄 Deployment Workflow

Updating production after new commits:

```bash
git pull origin main

docker build -t nexgen-saas --target production .

docker stop nexgen-saas
docker rm nexgen-saas

docker run -d \
--name nexgen-saas \
--network nexgen-network \
-p 5000:5000 \
--restart unless-stopped \
--env-file .env \
nexgen-saas
```


# 📦 Container Architecture

Production runtime architecture:

```
Docker Network: nexgen-network

        ┌───────────────┐
        │  nexgen-saas  │
        │   Node API    │
        └───────┬───────┘
                │
        ┌───────┴────────┐
        │                │
  nexgen-mongo       jwt-redis
   MongoDB             Redis
```


# 📊 Logs & Monitoring

Logs can be viewed via Docker:

```bash
docker logs -f nexgen-saas
```

Structured logging is implemented using **Pino**.


# 🚀 Future Infrastructure Improvements

Planned production improvements:

* Nginx reverse proxy with HTTPS
* Docker Compose orchestration
* CI/CD pipeline (GitHub Actions)
* Centralized log aggregation
* Kubernetes support

## 🐳 Option B: Using Docker Compose

Instead of running containers manually, NexGen can be started using **Docker Compose**, which orchestrates the entire stack (API, MongoDB, Redis, and Nginx).

### Start the Stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### View Logs

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

### Stop the Stack

```bash
docker compose -f docker-compose.prod.yml down
```

### Update Deployment

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```
### Option C: Using PM2 (Bare Metal/VM)
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
