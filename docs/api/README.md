# Contratos API

`openapi.yaml` es la fuente compartida entre Backend, Frontend, Mobile y QA.

**Estado actual:** `READY_FOR_HANDOFF`. La versión 1.0.0 define el contrato REST
general del MVP y queda disponible para revisión independiente de Backend QA,
Frontend QA, Mobile QA y Ciberseguridad. `READY_FOR_HANDOFF` no equivale a
`PASS`: todavía debe superar esas puertas antes de congelarse como baseline.

La relación entre capacidades, operaciones e historias está en
[`TRACEABILITY.md`](TRACEABILITY.md). Las brechas no REST se controlan en
[`CONTRACT_READINESS.md`](../stories/CONTRACT_READINESS.md).

- Los cambios incompatibles requieren versión o transición.
- Frontend y Mobile derivan tipos del contrato.
- Las colecciones grandes se paginan.
- Operaciones móviles sensibles son idempotentes.
- El tenant no se recibe como autoridad desde el cliente.
- Cada operación tiene `operationId`, seguridad heredada o pública explícita,
  esquemas tipados, errores comunes y `x-story-ids`.
- La autorización concreta se declara mediante `x-required-roles`; el servidor
  además valida pertenencia al tenant, equipo y recurso.
- EN-013 define dos canales de autenticación sin downgrade: WEB conserva el
  refresh exclusivamente en cookie HttpOnly con CSRF; MOBILE lo usa en body
  únicamente fuera de contexto navegador y lo almacena en secure storage.
- Los códigos de error de auth distinguen expiración, rotación/reutilización y
  reset inválido sin revelar si una cuenta existe.

## Validación

```powershell
npx --yes @redocly/cli lint docs/api/openapi.yaml
```

La validación contractual debe ejecutarse en CI y antes de generar clientes.
