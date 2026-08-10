---
name: architecture-review
description: Review FollowUpBussiness architecture changes across domain boundaries, hexagonal layers, applications, and infrastructure. Use for cross-cutting stories, structural diffs, inter-module dependencies, or ADR decisions.
---

# Review Architecture

Read the story/package and target diff once. Identify changed applications, domains, and contracts. Use `rg` on imports/packages/calls before opening only applicable sections of `shared/PROJECT_CONTEXT.md`, `shared/ENGINEERING_RULES.md`, or `docs/architecture/`.

- Keep Backend a modular monolith during MVP and preserve `domain`, `application`, `adapter`, and `config` per domain.
- Domain never depends on Spring, persistence, transport, or messaging. Modules never access another domain's internal repositories/tables; use explicit ports, internal events, or public contracts.
- PostgreSQL remains authoritative; Redis is ephemeral. Enforce tenant segregation in persistence, cache, events, and WebSocket.
- Verify compatibility/versioning for REST, events, and sync.
- Require an ADR only for changed domain boundary, structural library, provider, protocol, persistence, authentication, or tenant strategy.

Run `HexagonalArchitectureTest` and `ModuleBoundaryTest` when Backend packages/dependencies change; avoid the full suite by default. Report findings first with severity, file, and evidence, then reviewed boundaries, validation, ADR decision, and residual risk. Write user-facing output in Spanish and never repeat source documentation.
