# Frontend — Instrucciones locales

## Contexto obligatorio

Antes de modificar el frontend, revisar:

- `../AGENTS.md`
- `../00_CONTRATO_FUNCIONAL.md`
- `../shared/PROJECT_CONTEXT.md`
- `../shared/ENGINEERING_RULES.md`
- La historia correspondiente en `../docs/stories/`
- `../docs/api/openapi.yaml`

Roles relacionados:

- Desarrollo: `../agents/development/frontend-developer.md`
- QA: `../agents/qa/frontend-qa.md`
- Seguridad: `../agents/security/cybersecurity-reviewer.md`
- DoF: `../agents/governance/definition-of-finished.md`

## Stack

- React
- TypeScript estricto
- REST
- WebSocket
- Mapas

## Reglas obligatorias

- No utilizar `any` sin justificación.
- Consumir tipos derivados del contrato OpenAPI.
- Organizar el código por funcionalidades.
- No duplicar reglas de negocio del backend.
- La autorización visual no reemplaza la autorización backend.
- Toda pantalla debe manejar:
  - carga;
  - vacío;
  - error;
  - falta de permisos;
  - datos desactualizados.
- Toda ubicación debe mostrar la última actualización.
- WebSocket debe tener reconexión y fallback.
- El mapa no debe ser la única forma de consultar información.
- No almacenar secretos ni tokens en mecanismos inseguros.
- Limpiar caché y estado al cerrar sesión.

## Comandos

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build