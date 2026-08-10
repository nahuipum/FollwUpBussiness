---
name: spring-hexagonal-scaffold
description: Create or extend Spring Boot code within FollowUpBussiness modular hexagonal architecture. Use when starting a Backend use case, port, REST/persistence/messaging adapter, configuration, or domain behavior without unnecessary layers.
---

# Scaffold Spring Hexagonal Code

Read the story/package once, locate the owning domain, inspect one nearby feature, and confirm required contracts/persistence/events. Stop for a decision/ADR when domain boundaries or unapproved infrastructure would change. Use root `com.nahui.followupbussiness.<domain>` and create only necessary pieces.

- `domain`: pure entities, value objects, invariants, services, events.
- `application/port/in`: exposed use cases; `application/port/out`: required external capabilities.
- `application`: commands, results, transactional orchestration.
- `adapter/in`: REST, CLI, WebSocket, consumers; `adapter/out`: persistence, security, Redis, RabbitMQ, external services.
- `config`: Spring wiring/properties.

Never place Spring/JPA annotations or transport DTOs in domain, expose persistence entities, or access another domain's repository. Derive tenant from trusted context; filter by tenant in repositories/cache/events/subscriptions. PostgreSQL is authoritative. Add idempotency, audit, and correlation ID only when required. Add new Flyway migrations rather than editing old ones; update affected public contracts before handoff.

Add domain/use-case and affected integration tests. Run focused tests plus architecture tests when packages change. Write concise Spanish output with files, decisions, commands, and risks.
