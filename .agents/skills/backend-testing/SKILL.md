---
name: backend-testing
description: Design, implement, or review FollowUpBussiness Backend tests with JUnit, Spring Boot, and Maven. Use for Java story test strategy, acceptance coverage, defect reproduction, or efficient test selection across architecture, contracts, persistence, and security.
---

# Test Backend

Map each criterion to observable behavior, inspect nearby tests/conventions, and choose the smallest proving level: unit for pure domain; application for use cases/mock ports; integration for SQL, migration, security, or Spring wiring; contract for OpenAPI/events/WebSocket/sync; architecture for package/module boundaries. Avoid `@SpringBootTest` when isolation is sufficient.

Cover applicable happy path, validation, boundaries, errors, resource authorization, cross-tenant denial, idempotency/double submission/concurrency, clean migrations and constraints, explicit PostGIS SRID/units, and only touched Redis/RabbitMQ/WebSocket integrations. Never leak secrets, personal data, or unnecessary coordinates in evidence. Name tests by behavior and avoid internal-detail assertions outside the contract.

Run one focused Maven command first, then module/full suite only by risk, failure, or gate. Reuse verifiable same-candidate CI. Record command, result, and mapped behavior without full logs. Deliver Spanish criteria coverage, changed tests, commands/results, unexecuted cases, and residual risk; never claim unsupported coverage.
