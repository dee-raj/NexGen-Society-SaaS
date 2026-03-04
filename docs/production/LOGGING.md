# Logging Best Practices

## Overview
At scale (1000+ societies), conventional text logs become unmanageable. NexGen Society SaaS must utilize **Structured JSON Logging** to allow efficient querying, filtering, and alerting.

## Application Level (Pino)
The platform is configured with `pino` and `pino-http` for lightweight, fast JSON logging.

### Rules of Engagement:
1. **Never use `console.log()`** in production. Always use the central logger instance (`logger.info`, `logger.error`).
2. **Contextual Information:** Inject request metadata (Trace ID, Tenant ID/Society ID, User ID) into logs to track a single request's lifecycle.
3. **Redact Sensitive Info:** Ensure passwords, tokens, and PII are redacted before logging. `pino` has built-in redaction (e.g., `redact: ['req.headers.authorization', 'password']`).
4. **Error Stack Traces:** Always log full stack traces for unhandled exceptions and `5xx` errors.

## Docker Level
The `docker-compose.prod.yml` uses the `json-file` logging driver with rotation enabled:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```
This prevents logs from exhausting disk space.

## Log Aggregation (Centralization)
In a scaled environment, logs from multiple API instances must be shipped to a central repository.

**Recommended Tools:**
- **Datadog:** Premium, highly integrated.
- **ELK Stack (Elasticsearch, Logstash, Kibana):** Industry standard, open-source.
- **Grafana Loki:** Cost-effective, works excellently if you already use Prometheus/Grafana.

**Implementation:**
Use an agent (e.g., Promtail for Loki, Datadog Agent, or Filebeat) on the host machine to read the Docker JSON logs and forward them to the aggregation server. Do not block the NodeJS event loop with network-based log shipping.
