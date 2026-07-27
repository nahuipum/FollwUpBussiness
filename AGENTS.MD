# FieldSales CRM — Instrucciones globales

## Fuentes de verdad

Antes de trabajar, revisar:

1. `00_CONTRATO_FUNCIONAL.md`
2. La historia correspondiente en `docs/stories/`
3. `shared/PROJECT_CONTEXT.md`
4. `shared/ENGINEERING_RULES.md`
5. `shared/TEAM_WORKFLOW.md`
6. Los contratos relacionados en `docs/api/`, `docs/events/`,
   `docs/websocket/` o `docs/sync/`

## Organización

Este repositorio contiene tres aplicaciones:

- `backend/`: Java y Spring Boot.
- `frontend/`: React y TypeScript.
- `mobile/`: Flutter.

La infraestructura compartida está en:

- `docker-compose.yml`
- `infrastructure/`

## Principios generales

- El proyecto utiliza un monorepo.
- Cada historia debe conservar trazabilidad.
- No se deben inventar reglas de negocio.
- Los cambios de arquitectura requieren un ADR.
- Ningún agente aprueba su propio trabajo.
- Desarrollo implementa.
- QA valida.
- Ciberseguridad revisa riesgos.
- DoF decide el cierre.
- No se deben incluir secretos en el repositorio.
- Todo cambio debe respetar el aislamiento multiempresa.

## Flujo obligatorio

1. Historia refinada.
2. Contratos definidos.
3. Implementación.
4. Pruebas de desarrollo.
5. QA independiente.
6. Revisión de seguridad cuando aplique.
7. Validación DoF.

## Estados permitidos

- `READY_FOR_HANDOFF`
- `PASS`
- `CHANGES_REQUIRED`
- `BLOCKED`
- `NOT_APPLICABLE`

## Git

- Una rama por historia.
- Commits separados por aplicación.
- Pull requests trazables.
- No realizar cambios fuera del alcance sin documentarlos.