# ─── Build Stage ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build


# ─── Development Stage ─────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY tsconfig.json ./

# src is intentionally omitted — mounted as volume in compose

CMD ["npm", "run", "dev"]


# ─── Production Stage ──────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 5000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "dist/server.js"]

# docker network create nexgen-network
# docker run -d --name nexgen-mongo --network nexgen-network mongo:7
# docker run -d --name nexgen-mongo --network nexgen-network -v nexgen-mongo-data:/data/db mongo:7

# docker run -d --name jwt-redis --network nexgen-network -p 6379:6379 redis:7-alpine

# docker build -t nexgen-saas --target production .
# docker run -d --name nexgen-saas --network nexgen-network -p 5000:5000 --restart unless-stopped --env-file .env nexgen-saas
# docker logs -f nexgen-saas

# git pull origin main
# docker build -t nexgen-saas --target production .
# docker stop nexgen-saas
# docker rm nexgen-saas
# docker run -d --name nexgen-saas --network nexgen-network -p 5000:5000 --restart unless-stopped --env-file .env nexgen-saas

# docker exec -it nexgen-mongo mongosh

# docker exec nexgen-mongo mongodump --archive --gzip > mongo-backup.gz
# docker exec nexgen-mongo mongodump --archive --gzip > mongo-backup-$(Get-Date -Format "yyyy-MM-dd").gz

# docker exec nexgen-mongo mongorestore --archive --gzip < mongo-backup.gz

# docker exec nexgen-mongo mongodump --archive=/tmp/backup.gz --gzip
# docker cp nexgen-mongo:/tmp/backup.gz ./mongo-backup.gz
# docker exec nexgen-mongo mongorestore --archive=/tmp/backup.zp --gzip --dryRun
# cmd /c "docker exec -i nexgen-mongo mongorestore --archive --gzip < mongo-backup.gz"
