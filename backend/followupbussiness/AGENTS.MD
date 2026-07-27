# Backend — Instrucciones locales

## Contexto obligatorio

Antes de modificar el backend, revisar:

- `../AGENTS.md`
- `../00_CONTRATO_FUNCIONAL.md`
- `../shared/PROJECT_CONTEXT.md`
- `../shared/ENGINEERING_RULES.md`
- La historia correspondiente en `../docs/stories/`
- El contrato en `../docs/api/openapi.yaml`

El rol específico será proporcionado mediante uno de estos archivos:

- Desarrollo: `../agents/development/backend-developer.md`
- QA: `../agents/qa/backend-qa.md`
- Seguridad: `../agents/security/cybersecurity-reviewer.md`
- Cierre: `../agents/governance/definition-of-finished.md`

## Stack

- Java
- Spring Boot
- PostgreSQL
- PostGIS
- Redis
- WebSocket
- RabbitMQ
- Maven

## Arquitectura

El backend es un monolito modular separado por dominios.

Cada dominio utiliza arquitectura hexagonal:

```text
domain/
application/
adapter/
config/