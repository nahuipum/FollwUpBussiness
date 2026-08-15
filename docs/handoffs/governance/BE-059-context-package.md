# Paquete de contexto — BE-059 Listar y consultar vendedores

Estado: `COMPLETED` — DoF `PASS`.  
Candidate-ID: `HEAD 59bc372 + BE-059 seller-read 9abcd2d`.

## Predecesora

BE-008 está terminada y estable: DoF `PASS` (mismo Candidate-ID `HEAD c38dad7 + BE-008 rollback-audit-integration/pruebas`), con Development, QA y Seguridad `PASS`. No bloquea.

## Alcance y contrato

Implementar únicamente `GET /sellers` y `GET /sellers/{sellerId}` conforme a `docs/api/openapi.yaml`: paginación y orden estable; filtros combinables `status`, `supervisorId`, `territoryId`, `search`; respuestas `200`, `400`, `403`, `404`; `correlationId`. No modificar contratos silenciosamente ni las relaciones BE-009..012.

## Autorización e invariantes

- Tenant exclusivamente desde sesión. `COMPANY_ADMIN`: todos los vendedores del tenant. `SUPERVISOR`: solo equipo vigente; filtros, página y tamaño nunca amplían ni revelan alcance. `SELLER`: `GET /sellers` denegado y detalle solo propio. Sin autenticación, `PLATFORM_SUPERADMIN` u otros roles: sin acceso transversal.
- Detalle/rechazos no revelan existencia, PII innecesaria, credenciales, tokens o secretos. Respuesta separa usuario de acceso, perfil vendedor y estado.
- Recursos/relaciones inactivos se tratan según contrato y filtro, sin cambiar históricos. Rechazos/no-op no escriben, publican eventos ni auditan indebidamente; errores observables sin datos sensibles.

## Invariantes de control → prueba

1. Actor/recurso: actor autenticado y tenant/identidad/rol/equipo válidos antes de leer respuesta.
2. Éxito: admin por tenant; supervisor por equipo; seller por su propio detalle.
3. Denegación: listado seller/no autorizado, detalle ajeno/cross-tenant/equipo ajeno sin datos parciales.
4. Conflicto/filtro: filtros ajenos o manipulados no enumeran ni amplían resultados; parámetros inválidos `400`.
5. Fallo/no-op: cero escrituras, eventos o auditoría; `correlationId` propagado.

## Superficies y evidencia inicial

- Historia: `docs/stories/backend/BE-059-listar-vendedores.md`.
- Contrato: `docs/api/openapi.yaml`, rutas `/sellers`, `/sellers/{sellerId}`, `/territories`; autorización por `x-required-roles` y sesión.
- Artefactos esperados: `docs/handoffs/backend/BE-059-development-handoff.md`, `docs/handoffs/qa/BE-059-qa-handoff.md`, `docs/handoffs/security/BE-059-security-review.md`, `docs/handoffs/dof/BE-059-dof.md`.

No commits, push ni PR. Candidate-ID se calcula una vez tras Development.
