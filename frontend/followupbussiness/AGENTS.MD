# Frontend — Local Instructions

## Language

Keep operational reasoning and instructions in English. Write user-facing replies and canonical context/handoff/review artifacts in Spanish.

## Context

- Apply `../../AGENTS.MD`.
- Read the complete referenced Frontend story only outside an orchestrated flow. In an orchestrated flow, use the package and do not reread primary sources unless ambiguity, contradiction, or new risk requires it.
- During Development, look first for `../../docs/frontendMockups/<HU-ID>.html`. If absent, reuse patterns from existing HTML mockups and optionally create the missing proposal without inventing business rules.
- Open only affected OpenAPI/WebSocket fragments.
- Inspect the diff, feature, and nearby tests first.

## Invariants

- Use strict React/TypeScript; avoid unjustified `any` and derive types from contracts when supported.
- Organize by feature and responsibility. Keep pages/routes as composition; separate components, hooks, API/services, state, types, utilities, and tests only when each has real responsibility or reuse.
- Do not duplicate Backend business rules. UI authorization never replaces server authorization.
- Cover loading, empty, error, forbidden, and stale-data states. Show last update and never present old location as current.
- Provide WebSocket reconnect/fallback and an accessible map alternative when applicable.
- Clear state/cache on logout or company change. Never store tokens insecurely or log personal data.

## Verification

Run focused tests and type-check first. Run full lint/build when risk, a gate, shared composition, or a failure warrants it. Report summarized results only.
