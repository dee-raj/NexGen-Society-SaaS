#!/bin/bash
set -e

# ── Config ────────────────────────────────────────────────────────────────────
APP_NAME="nexgen-saas"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BRANCH="main"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()     { echo "[$(date '+%H:%M:%S')] $1"; }
success() { echo "[$(date '+%H:%M:%S')] ✔ $1"; }
error()   { echo "[$(date '+%H:%M:%S')] ✘ $1" >&2; exit 1; }

# ── Preflight checks ──────────────────────────────────────────────────────────
log "Running preflight checks..."

[ -f "$ENV_FILE" ]      || error ".env file not found"
[ -f "$COMPOSE_FILE" ]  || error "docker-compose.yml not found"
command -v docker       >/dev/null 2>&1 || error "Docker is not installed"
command -v git          >/dev/null 2>&1 || error "Git is not installed"

# ── Pull latest code ──────────────────────────────────────────────────────────
log "Pulling latest code from $BRANCH..."
git pull origin "$BRANCH" || error "Git pull failed"
success "Code updated"

# ── Build ─────────────────────────────────────────────────────────────────────
log "Building production image..."
docker compose -f "$COMPOSE_FILE" build --no-cache api || error "Build failed"
success "Image built"

# ── Deploy ────────────────────────────────────────────────────────────────────
log "Deploying $APP_NAME..."

# Bring up infra (mongo + redis) first, wait for healthy
docker compose -f "$COMPOSE_FILE" up -d mongo redis
log "Waiting for mongo and redis to be healthy..."

for service in mongo redis; do
  for i in $(seq 1 30); do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "nexgen-$service" 2>/dev/null)
    if [ "$STATUS" = "healthy" ]; then
      success "$service is healthy"
      break
    fi
    if [ "$i" -eq 30 ]; then
      error "$service did not become healthy in time"
    fi
    sleep 2
  done
done

# Rolling restart of api only (keeps mongo/redis running)
docker compose -f "$COMPOSE_FILE" up -d --no-deps --build api
success "API restarted"

# ── Cleanup ───────────────────────────────────────────────────────────────────
log "Cleaning up dangling images..."
docker image prune -f
success "Cleanup done"

# ── Health check ──────────────────────────────────────────────────────────────
log "Waiting for API to be healthy..."
for i in $(seq 1 15); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' nexgen-api 2>/dev/null)
  if [ "$STATUS" = "healthy" ]; then
    success "API is healthy"
    break
  fi
  if [ "$i" -eq 15 ]; then
    error "API did not become healthy — check logs: docker logs nexgen-api"
  fi
  sleep 3
done

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Deployment of $APP_NAME complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"