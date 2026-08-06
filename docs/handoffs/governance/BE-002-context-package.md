# BE-002 — Paquete de contexto

## Alcance y fuera de alcance

- **Alcance:** `PATCH /platform/companies/{companyId}/status` para que un
  `PLATFORM_SUPERADMIN` tenantless suspenda o reactive una empresa; estado
  durable, control inmediato de autenticación/operaciones y auditoría atómica.
- **Fuera de alcance:** listado/creación de empresas, autoservicio público,
  facturación/planes, borrado o restauración de datos, y cambios de clientes o
  de arquitectura no exigidos por esta capacidad.

## Criterios normalizados — cinco controles

1. **Actor y recurso.** Solo un `PLATFORM_SUPERADMIN` autenticado con
   `tenantId = null` actúa sobre la empresa identificada por `companyId`; actor
   tenant-bound o sin permiso recibe `403`, no muta la empresa y deja una
   denegación durable, mínima y saneada. Empresa inexistente conserva el `404`
   de OpenAPI.
2. **Transiciones.** `ACTIVE -> SUSPENDED` y `SUSPENDED -> ACTIVE` devuelven
   `200` con el estado durable actualizado; historial y datos permanecen
   intactos. `ACTIVE -> ACTIVE` y `SUSPENDED -> SUSPENDED` devuelven `200` con
   el estado vigente como no-op idempotente: cero escritura, evento y nueva
   auditoría de cambio. Autorización y trazabilidad general de la petición sí
   aplican. La HU y sus fuentes no definen una condición de negocio observable
   que produzca `409`; este caso queda `NOT_APPLICABLE` para BE-002 en el MVP y
   no se inventará un conflicto para satisfacer una prueba. Los conflictos que
   definan historias o contratos futuros quedan fuera de alcance. La
   concurrencia no puede duplicar mutación ni auditoría.
3. **Efecto de acceso.** Suspendida, la empresa no admite login (`401`
   neutral), renovación ni operaciones con sesión/token ya emitidos porque el
   estado durable se revalida por petición; otros tenants no se afectan.
   Reactivada, vuelve a ser elegible para autenticación y operación sin
   restauración manual, sujeto al estado todavía válido de cuenta/sesión.
4. **Atomicidad y auditoría.** Cada transición exitosa conserva actor técnico,
   empresa, acción/resultado, antes/después permitidos, motivo saneado y
   `correlationId`, sin PII, secretos ni payload completo. Mutación y auditoría
   confirman juntas; un fallo de auditoría u otra dependencia revierte el
   cambio. Un rechazo relevante solo se presenta como `403` auditado si su
   evidencia durable confirmó, siempre con cero mutación. Los errores técnicos
   o transaccionales no se convierten artificialmente en `409` y conservan la
   atomicidad y el rollback correspondientes.
5. **Propiedad y fuente de verdad.** PostgreSQL/`tenancy` es autoridad del
   estado `ACTIVE|SUSPENDED`; `identityaccess` consume el puerto público y no
   tablas internas. No se elimina historial, no se acepta tenant/actor/estado
   previo desde el cliente y no se usa cache positiva para autorizar.

## Rutas y secciones aplicables

- `docs/stories/backend/BE-002-suspender-y-reactivar-empresa.md`: Alcance,
  Criterios, Seguridad, Contratos/superficies, casos límite y predecesoras.
- `00_CONTRATO_FUNCIONAL.md`: §6.4, autoridad del superadministrador.
- `docs/api/openapi.yaml`: `/platform/companies/{companyId}/status`,
  `ChangeCompanyStatusRequest`, `CompanyStatus`, `Company` y respuestas
  `401/403/404/409`.
- `docs/architecture/adr/ADR-008-autenticacion-sesiones.md`: validación durable
  por petición y login neutral ante empresa suspendida.
- `docs/architecture/adr/ADR-020-retencion-auditoria-mvp.md`: D1, D2 y D5
  (minimización, denegaciones/fallos y rollback de mutación crítica).
- `docs/architecture/adr/ADR-022-auditoria-transaccional-creacion-empresa-plataforma.md`:
  Decisión y enmienda de denegación tenant-bound; puertos públicos de auditoría,
  contexto confiable y transacción compartida.
- `docs/stories/enablers/EN-019-fundacion-empresas-y-estado-acceso.md`: alcance,
  criterios y contrato público de estado durable.
- `docs/stories/integration/INT-038-suspension-de-empresa-e2e.md`: alcance y
  criterios de login/renovación, aislamiento, reactivación e historial.
- Símbolos localizados, sin revisar implementación: `tenancy/domain/model/Company.java`,
  `CompanyStatus.java`, `application/port/in/CompanyAccessStatusQuery.java`,
  `adapter/out/persistence/JdbcCompanyAccessStatusQuery.java`,
  `identityaccess/application/{LoginService,RefreshService,ResourceAccessAuthorizer}.java`
  y los puertos/contextos `RecordPlatformCompanyAuditUseCase` y
  `RecordCompanyDenialAuditUseCase` bajo `audit/`.
- Predecesoras: `docs/handoffs/governance/BE-001-dof.md`,
  `docs/handoffs/governance/BE-005-dof.md` y
  `docs/handoffs/dof/BE-051-dof-handoff.md`: dictamen vigente `PASS`.

## Candidate-ID inicial

`BE002-PREDEV-4308ce97d4f8-a56521d81d68`

- Rama `feature/first`; HEAD
  `4308ce97d4f8c5616866b56cc45cc65cb161e8c5`.
- Digest de `git diff --binary HEAD`: `a56521d81d688687f70cdb7a619a2afa4b3339df`;
  staging vacío. El diff contiene ocho modificaciones tracked preexistentes y
  ajenas; todavía no existe cambio funcional BE-002 y no se tocó ninguno de
  esos archivos.
- Desarrollo debe fijar una sola vez el Candidate-ID funcional cuando cambie
  código y preservar los cambios ajenos.

## Riesgos

- Una comparación no atómica puede convertir carreras en escrituras, eventos o
  auditorías duplicadas, o clasificar incorrectamente un no-op como conflicto.
- Confusión de actor de plataforma con tenant-bound y auditoría con alcance
  falso; riesgo de mutación cross-tenant.
- Estado obsoleto en autenticación/cache, estados parciales por transacción
  dividida y filtración de PII en `reason`, auditoría u observabilidad.

## Preflight de Seguridad

**Estado: `ADVISORY`; sin contradicciones.** Revisión limitada a los cinco
controles y a la decisión de no-op:

- actor/recurso: contexto confiable tenantless; `403` tenant-bound, cero
  mutación y denegación durable saneada;
- transiciones: autorizar y resolver estado durable antes de responder; el
  no-op retorna `200` sin `UPDATE`, evento ni auditoría de cambio, incluso ante
  carrera; `409` queda `NOT_APPLICABLE` porque BE-002 no define una condición
  de negocio observable que lo produzca;
- acceso: suspensión falla cerrada en login, renovación y peticiones existentes
  sin afectar otros tenants ni confiar en cache positiva;
- atomicidad/auditoría: transición real y auditoría confirman o revierten en la
  misma transacción; el no-op conserva solo correlación/observabilidad general
  saneada, y un rechazo no se declara auditado si la evidencia no confirmó;
- propiedad: `tenancy` conserva el estado durable e `identityaccess` usa el
  puerto público, sin aceptar autoridad del cliente ni cruzar tablas internas.

## Estado vigente

**Gate: remediación Dev focal autorizada únicamente para `QA-BE002-002`.**
Candidate-ID vigente
`BE002-CAND-4308ce97d4f8-b77da2843959-8daeedfc05f3`, sin cambio porque todavía
no se modifica código. `QA-BE002-001` requiere revalidación contra el alcance
contractual aclarado: el caso `409` es `NOT_APPLICABLE` y no requiere
implementación. `QA-BE002-002` permanece pendiente: añadir una prueba explícita
de que refresh rechaza una empresa suspendida sin rotar ni emitir credenciales.
No se autoriza ningún otro cambio de Desarrollo. Después de la remediación, QA
revalidará la prueba de refresh y que `409` ya no forma parte del alcance.

Delta de contexto: Desarrollo abrió únicamente
`docs/api/openapi.yaml`, secciones
`/platform/companies/{companyId}/status`, `ChangeCompanyStatusRequest`,
`CompanyStatus` y `Company`, porque el paquete no incluía los nombres exactos
del body ni el esquema de la respuesta. No hubo contradicción ni cambio de
contrato.

## Prompt mínimo para Desarrollo

Agente: `backend_developer`; `fork_turns: "none"`.

«BE-002, remediación Dev focal. Entrada:
`docs/handoffs/governance/BE-002-context-package.md`; Candidate-ID
`BE002-CAND-4308ce97d4f8-b77da2843959-8daeedfc05f3`; handoff previo:
`docs/handoffs/backend/BE-002-qa-handoff.md`. Atiende únicamente
`QA-BE002-002`: añade una prueba explícita de que refresh rechaza una empresa
suspendida sin rotar ni emitir credenciales. No implementes `409`; es
`NOT_APPLICABLE`. Ejecuta solo las pruebas dirigidas necesarias, actualiza el
Candidate-ID al cambiar el diff y reemplaza el handoff Dev vigente.»
