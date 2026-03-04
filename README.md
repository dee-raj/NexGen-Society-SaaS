# NexGen Society SaaS

A robust, multi-tenant SaaS backend for modern Society Management and Procurement. Built with Node.js, Express, TypeScript, and MongoDB, this platform is designed to handle multiple societies (tenants) with complete data isolation and a powerful financial engine.

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

## 🛠️ Tech Stack
- **Runtime**: Node.js (>=18)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Validation**: Zod
- **Logging**: Pino
- **Security**: Helmet, CORS, Rate-limiting

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

## 🏗️ Architecture
The project follows a modular architecture:
- `src/modules`: Domain-specific logic (Auth, Finance, Society, etc.)
- `src/shared`: Reusable middleware, plugins, and utilities.
- `src/config`: Global configuration and logger setup.

## 🔒 Multi-tenant Isolation
Data isolation is enforced at the database level via a Mongoose plugin (`tenantScopePlugin`). All queries automatically filter by `societyId` based on the `X-Tenant-Id` header provided in the request.

---
© 2026 NexGen Society SaaS Team
