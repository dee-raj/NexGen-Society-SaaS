# Horizontal Scaling Plan

## Objective
Scale the NexGen Society SaaS platform from a single instance to support 1000+ societies smoothly and reliably, anticipating traffic spikes during maintenance fee billing cycles or global broadcasts.

## Phase 1: Stateless Computation (API Layer)
To scale horizontally, the API servers must be entirely stateless.
1. **No Local State:** Do not store sessions or files locally.
   - User sessions are handled via stateless JWTs.
   - Websocket connections must use Redis Pub/Sub adapter to broadcast messages across multiple API instances.
   - File uploads must go directly to cloud storage (e.g., AWS S3).
2. **Load Balancing:** Place an Application Load Balancer (ALB) or Nginx reverse proxy in front of the API instances. Use Round-Robin or Least-Connections routing algorithms.
3. **Container Orchestration:** Deploy API instances using Kubernetes (EKS/GKE) or AWS ECS.

## Phase 2: Caching Layer (Redis)
Database reads are expensive. Implement a robust caching strategy.
1. **Cache Master Data:** Frequently accessed but rarely changed data (e.g., Society configurations, lookup tables).
2. **Rate Limiting:** Move rate-limiting state (e.g., `express-rate-limit`) to a centralized Redis cluster to ensure limits are enforced consistently across all API instances.
3. **Scaling Redis:** Move from a single Redis instance to a Redis Cluster for distributed caching and high availability.

## Phase 3: Database Scaling (MongoDB)
Relational joins across massive datasets degrade performance.
1. **Current State:** The system utilizes multi-tenancy (Tenant ID = Society ID) implicitly through data partitioning. Ensure indexes almost exclusively start with `society_id` for extreme query isolation.
2. **Read-Replicas:** Most web traffic is read-heavy. Deploy secondary nodes in the MongoDB Replica Set. Configure Mongoose to prefer secondary reads for non-critical dashboard queries (e.g., analytics).
3. **Partitioning / Sharding:** If 1000+ societies generate terabytes of data, implement MongoDB Sharding. Use `society_id` as the shard key, ensuring all data for a single society physically resides on the same shard, eliminating cross-shard queries.

## Phase 4: Asynchronous Processing
Avoid long-running processes on the main HTTP thread.
1. **Queueing System:** Implement a message broker (RabbitMQ or Redis BullMQ).
2. **Background Workers:** Spin up separate worker instances to handle heavy tasks:
   - Invoice generation for 1000 societies.
   - Pushing mobile notifications (FCM/APNS).
   - Email dispatching.
   - Heavy analytical report generation. 

## Auto-Scaling Triggers
Configure auto-scaling groups to provision new API containers automatically based on:
1. Average CPU Utilization > 70%
2. In-flight Request Count / Active Connections threshold.
