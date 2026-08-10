---
name: frontend-mockup-guidance
description: Apply or evolve FollowUpBussiness HTML visual mockups when implementing or visually changing a React/TypeScript story such as FE-001 or FE-002. Use during Frontend Development only, not QA, Security, or DoF.
---

# Apply Frontend Mockups

1. Use the exact mockup path identified in the context package. Outside an orchestrated flow, locate it first by story ID under `docs/frontendMockups/`.
2. Read it once as the visual reference for composition, hierarchy, spacing, typography, color, components, responsive behavior, and represented states. Implement in React/TypeScript; never copy mockup HTML into production.
3. If no exact file exists, inspect only the closest existing mockup patterns and optionally create the missing static proposal.
4. Acceptance criteria, contracts, and accessibility override mockups. Never infer permissions, flows, data, or business rules from visual design.
5. Do not modify an existing mockup as an implementation side effect. Record only the consulted/created path in the Spanish handoff.
6. When scope explicitly asks one story to adopt another mockup's visual shell, list protected regions/states first and change only unprotected visual composition/tokens; preserve behavior and overlays outside scope.
