# Paquete de Contexto de Historia — BE-001 — revisión vigente 19

## Identidad y estado vigente

- **HU:** `BE-001 — Crear una empresa`.
- **Aplicación:** `backend/followupbussiness`.
- **Fase ejecutada:** Seguridad final — cierre `SEC-BE001-F03`.
- **Estado:** `READY_FOR_DOF`.
- **Preflight de Seguridad v1:** `ADVISORY` recibido en `docs/handoffs/security/BE-001-security-preflight.md`.
- **Precheck ADR-022:** `ADVISORY` incorporado append-only en el preflight canónico.
- **Preflight de remediación F01/F02:** `ADVISORY` incorporado append-only en el preflight canónico.
- **Enmienda ADR-022 de denegación tenant-bound:** decisión humana formalizada; preflight requerido.
- **Preflight de enmienda de denegación tenant-bound:** `ADVISORY` incorporado append-only en el preflight canónico.
- **Siguiente gate:** DoF; QA Backend F03 y Seguridad final F03 están en `PASS`.
- **Fases no autorizadas:** ninguna previa a DoF.

**Candidate-ID:** `BE001-CAND-4aa8dcd92b42-1d008a7a2207-27a855431b51`.

## Línea base pre-desarrollo y candidato de implementación

### `BASELINE_PRE_DESARROLLO`

| Campo | Valor |
|---|---|
| SHA completo (`git rev-parse HEAD`) | `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0` |
| Rama / upstream | `feature/first` / `origin/feature/first` |
| Worktree | Solo este paquete de gobernanza sin trackear; 0 rutas funcionales staged y 0 rutas funcionales unstaged |
| Diff contra HEAD | Vacío; SHA-256 de contenido vacío `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Staging | Vacío; SHA-256 de contenido vacío `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Manifiesto funcional inicial | Vacío (excluye `docs/handoffs/**`); SHA-256 de contenido vacío `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Huella del snapshot canónico | SHA-256 `b182299b47cc9f30b70ff5b4326a39ada2b872e2c8cd7dc1a5b9da7e590d9087` sobre HEAD, rama, upstream, estado, staging, diff, manifiesto y exclusión indicados |

La `BASELINE_PRE_DESARROLLO` es válida para el preflight: un preflight de diseño no requiere delta funcional. El candidato de implementación de BE-001 se fijará después de Desarrollo, inmediatamente antes del gate hacia QA; deberá incluir su HEAD/diff/staging/manifiesto funcional y revalidar los controles `SEC-BE001-*` aplicables.

### Candidato de implementación — revisión 19

El candidato es HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0` más el diff no staged SHA-256 `1d008a7a22070e48f86c6325577f3973b77347e213166e5ee16c344840e4e415`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend de 41 rutas SHA-256 `27a855431b5195ca3f1f1d65a19502a0601034983f67a331a463291a73c545a6`, normalizado como `ruta relativa a backend/followupbussiness SHA-256(contenido)` y unido con LF. No se realizó commit. Esta identidad reutiliza el manifiesto estricto único calculado por Desarrollo para la remediación funcional F03.

No se detectaron cambios funcionales ajenos sin commitear (incluido BE-005): staging y diff funcional están vacíos, que es el estado esperado antes de Desarrollo. Los cambios históricos de `feature/first` no se usan como candidato de implementación de esta historia.

## Criterios normalizados

| ID | Criterio verificable antes de aceptar Desarrollo | Fuente |
|---|---|---|
| CA-01 | Un actor de plataforma autorizado crea una empresa con identificador UUID único, estado inicial y respuesta `201`/`Location`; conflictos no crean un segundo tenant. | HU, «Criterios de aceptación»; OpenAPI `POST /platform/companies`, `Company`. |
| CA-02 | La configuración inicial se valida como contrato cerrado: zona horaria, moneda y parámetros admitidos; radio de geocerca fijo `100 m` y frecuencia fija `60 s` del MVP no se flexibilizan. Las entradas inválidas o parciales no persisten configuración. | HU, «Alcance» y «Criterios»; OpenAPI `CreateCompanyRequest`/`CompanySettings`; ADR-016 D1–D2. |
| CA-03 | Empresa, configuración, consultas, cache, mensajes, exportaciones y logs conservan propiedad/alcance de empresa; el tenant no procede del payload y cada acceso evita cruce de tenants. | HU, «Datos, reglas y casos límite»; ADR-002; OpenAPI, reglas globales. |
| CA-04 | Cada intento que alcanza el caso de uso deja auditoría durable mínima de creación/resultado/actor/recurso/hora/correlación; secretos, PII completa, cabeceras y payloads no se registran. La mutación y su auditoría son atómicas cuando corresponda. | HU, «Criterios», «Seguridad y privacidad» y «Observabilidad»; BE-051; ADR-021. |

## Dependencias verificadas

| Predecesora | Estado verificable | Evidencia y contrato reutilizable | Gate |
|---|---|---|---|
| BE-003 — Autenticar usuario | `PASS` | DoF `PASS`; el handoff Backend declara que tenant y rol se derivan exclusivamente de la cuenta persistida y que consulta el estado de empresa. | Satisfecha para identidad autenticada; no autoriza crear empresa sin `PLATFORM_SUPERADMIN`. |
| BE-007 — Gestionar roles y permisos | `PASS` | DoF `PASS`; revalidación final confirma que un principal de plataforma solo es válido con `tenantId` persistido nulo y que una empresa suspendida/inexistente no autentica un principal de empresa. | Satisfecha para separación plataforma/empresa y control de estado. |
| BE-051 — Registrar acciones críticas | `PASS` | DoF `PASS`; handoff Backend ofrece dominio `audit` append-only, puerto y adaptador JDBC, deduplicación por id, y minimización de cambios; revisión final valida origen confiable de hora/actor/tenant/scope. | Satisfecha como capacidad de auditoría; Desarrollo debe consumir el puerto público, no tablas o adaptadores internos. |

Las dependencias no bloquean el preflight. Sus candidatos históricos no se reutilizan como candidato BE-001.

## Contrato y auditoría que deben permanecer listos antes de Desarrollo

- **OpenAPI:** `POST /platform/companies`, `operationId: createCompany`, rol requerido `PLATFORM_SUPERADMIN`, cuerpo `CreateCompanyRequest`, éxito `201` con `Location` y `X-Correlation-Id`; respuestas previstas `400`, `401`, `403`, `409` y `422`.
- **Esquemas usados:** `CreateCompanyRequest` (campos requeridos `legalName`, `code`, `settings`; sin propiedades adicionales), `CompanySettings` (sin propiedades adicionales; `timezone`, `currency`, `geofenceRadiusMeters`, `trackingIntervalSeconds` requeridos), `Company` y `CompanyStatus` (`ACTIVE|SUSPENDED`).
- **Auditoría:** disponibilidad y contrato de integración del dominio `audit` de BE-051 para registrar acción crítica con datos mínimos y sin acceso directo interdominio; la auditoría no puede sustituirse por log/métrica. Toda ampliación del contrato se revisa explícitamente con Backend, consumidores y QA.

## Reglas obligatorias para el preflight y Desarrollo

| Área | Regla verificable |
|---|---|
| Tenant y recurso | El actor, tenant, rol y recurso se derivan/validan en servidor. `PLATFORM_SUPERADMIN` es identidad de plataforma sin empresa (`tenantId`/`company_id` nulo); ningún `tenantId` de entrada concede alcance. Cada consulta, clave y proyección de empresa preserva el aislamiento. |
| Autorización | `POST /platform/companies` exige `PLATFORM_SUPERADMIN`; el rol por sí solo no permite alcance de datos de una empresa. Denegar identidad ausente, revocada, permiso insuficiente, tenant cambiado o recurso inactivo sin revelar datos. |
| Configuración | Validar entrada completa y cerrada conforme al OpenAPI. Radio `100 m`, frecuencia `60 s` y retención de ubicación `90 días` son valores del MVP; modificarlos requiere ADR sustituto. |
| Idempotencia y concurrencia | Definir y probar el comportamiento de repetición/concurrencia antes de implementar: misma intención no duplica empresa, distinta intención conflictiva no muta, y unicidad/versión/transacción protege código e identidad. `409` conserva `correlationId`. No inventar una cabecera de idempotencia no publicada por el contrato. |
| Auditoría y transacción | Usar el puerto público de `audit`; registrar actor técnico, acción de vocabulario controlado, recurso, resultado, hora de servidor y correlación saneada. Nunca incluir secretos, tokens, credenciales, PII completa, cabeceras ni payload HTTP. Cuando creación y auditoría sean críticas, ambas confirman o revierten juntas. |
| Observabilidad | Propagar/devolver `correlationId` en éxito y error. Logs, métricas y eventos contienen resultado/error mínimo saneado, nunca payload, secreto, coordenadas completas ni identificadores personales expuestos. |

## Clasificación de riesgo

**Alta — requiere Preflight de Seguridad.** La superficie crea el límite de confianza de un tenant y combina privilegio de plataforma, autorización por recurso, configuración que gobierna geocerca/tracking, aislamiento transversal y auditoría crítica. Escenarios a convertir en controles `SEC-BE001-*` por el preflight: actor sin rol o con tenant cambiado; payload que intenta imponer tenant; configuración parcial/fuera de constantes; repetición o carrera que duplica empresa; empresa suspendida o recurso inactivo; fallo de auditoría/transacción; y filtración de datos sensibles o de `correlationId` ausente.

## Registro de gates

| Revisión | Gate | Estado | Evidencia | Acción necesaria |
|---|---|---|---|---|
| 3 | Preflight de Seguridad v1 | `ADVISORY` | `docs/handoffs/security/BE-001-security-preflight.md`, baseline `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`, matriz inicial `SEC-BE001-01..06`. | Reutilizable como diseño. |
| 5 | Decisión Producto/Arquitectura — `SEC-BE001-05` | `RESUELTA` | ADR-022 aceptado, SHA-256 `2532147205a95e909eb438729103d822b944a6812b946aea64afe05390d7c45e`. | Aplicado al candidato; controles afectados revalidados por precheck. |
| 6 | Precheck de Seguridad — ADR-022 | `ADVISORY` | Sección append-only del preflight: `SEC-BE001-05` revisado y `SEC-BE001-07..08` añadidos; `SEC-BE001-01..04,06` vigentes. | Reutilizar la matriz completa para QA. |
| 7 | Desarrollo Backend — remediación `SEC-BE001-06` | `READY_FOR_HANDOFF` | Sección append-only de `docs/handoffs/backend/BE-001-development-handoff.md`, SHA-256 `00f078231f9ace23fa9bfbde60c8161672307adccd9d5d52d8d5bb02d4dbc0b2`; normalización única de correlación y pruebas MVC/PostgreSQL. | QA de revalidación sobre candidato revisión 7. |
| 7 | Candidato de implementación y gate hacia QA | `QA_REVALIDATION_REQUIRED` | HEAD/diff/staging sin cambio; manifiesto Backend (28 rutas) actualizado a `6a42c21d1dcfdacbb1d79c3de22e79215fa39846bb6ea4b436a9f753670bee5e`. | Mantener identidad intacta y revalidar hallazgo CA-04/`SEC-BE001-06` de QA. |
| 7 | QA, Seguridad final, DoF | `NOT_STARTED` | QA previa `CHANGES_REQUIRED` revisó el manifiesto `a6cccc…`; remediación produce candidato distinto. | QA de revalidación no iniciada; Seguridad final y DoF no autorizados. |
| 7 | QA Backend afectado — CA-04/`SEC-BE001-06` | `PASS` | Última sección append-only de `docs/handoffs/backend/BE-001-backend-qa.md`, SHA-256 `be7b1a5d50d735b70c82ce911bcd4151e927727e02bf632ae40ad384425d7d81`; candidato/manifiesto de revisión 7. | Evidencia independiente vigente sólo para la remediación de correlación y regresión mínima. |
| 8 | Seguridad final | `BLOCKED` | `docs/handoffs/security/BE-001-security-review.md`, SHA-256 `977dadd30ec888adaeaa3efaafb2087d8c97481d2833d03de1814ed14134610d`; hallazgos `SEC-BE001-F01` HIGH y `SEC-BE001-F02` MEDIUM. | No autoriza DoF; preparar únicamente preflight de Seguridad de remediación. |
| 8 | Siguiente gate | `PREFLIGHT DE SEGURIDAD DE REMEDIACIÓN REQUERIDO` | Superficies afectadas delimitadas en la revisión 8. | El preflight definirá los controles y la evidencia de la ruta de remediación. |
| 8 | Preflight de Seguridad de remediación F01/F02 | `ADVISORY` | Sección append-only de `docs/handoffs/security/BE-001-security-preflight.md`, SHA-256 `b7cedf426942a614d1d01e633420b9a8ef1a22545c3cb5fe7cf5e20fcb80741a`; `SEC-BE001-03,05,07,08` afectados. | Desarrollo de remediación acotado autorizado. |
| 9 | Desarrollo Backend de remediación F01/F02 | `READY_FOR_HANDOFF` | Sección append-only de `docs/handoffs/backend/BE-001-development-handoff.md`, SHA-256 `e6562e3872d12db217446bf6310162ba66f83fd97a050777b3d992ef8eebed5c`; pruebas PostgreSQL/Flyway dirigidas `PASS`. | QA Backend de remediación independiente sobre candidato revisión 9. |
| 9 | Candidato y gate hacia QA de remediación | `QA_REVALIDATION_REQUIRED` | HEAD/diff/staging fijados; manifiesto Backend de 31 rutas `21e5aa97645fef9e54e43859bd786f4a71cd6d305ee7bf41110e9c9b787354af`. | Conservar identidad y revalidar F01/F02 y controles `SEC-BE001-03,05,07,08` afectados. |
| 9 | Seguridad final de revalidación y DoF | `NOT_STARTED` | Seguridad final previa fue `BLOCKED`; el nuevo candidato requiere QA independiente antes de cualquier nueva revisión de Seguridad. | No autorizados. |
| 9 | QA Backend de remediación F01/F02 | `CHANGES_REQUIRED` | Última sección de `docs/handoffs/backend/BE-001-backend-qa.md`, SHA-256 `b571ba06da2634c47f312ed54e7332271aaa570f757d552c475d4d923f6cfed2`; F02 esperaba una auditoría `DENIED` y obtuvo cero por rollback. | Desarrollo acotado exclusivamente a la durabilidad de F02. |
| 10 | Desarrollo Backend de remediación F02 | `READY_FOR_HANDOFF` | Última sección de `docs/handoffs/backend/BE-001-development-handoff.md`, SHA-256 `e1fcd94ab2129ed5bd432d2881752e3c89776b132818af46044b0f5ac19f3c76`; confirma el rechazo auditado antes de entregar `403`. | QA independiente F02 sobre candidato revisión 10. |
| 10 | Candidato y gate hacia QA F02 | `QA_REVALIDATION_REQUIRED` | HEAD/diff/staging fijados; manifiesto Backend de 31 rutas `9d2e3168a5f8a0b69714759f1e1340457cd757232f1bd9971ae296335cba9374`. | Revalidar rechazo tenant-bound durable, fallo del escritor y regresión de atomicidad de éxito. |
| 10 | QA Backend afectado F02 | `CHANGES_REQUIRED` | Última sección de `docs/handoffs/backend/BE-001-backend-qa.md`, SHA-256 `6c72d7f92dff69566f093aad740af63d103f4be977412b2cb0a42aaaf5c36c96`; protección del proveedor rechaza actor tenant-bound, en contradicción con el uso F02. | No tratar la protección como prueba obsoleta; detener Desarrollo. |
| 11 | Contradicción arquitectónica F02 | `BLOCKED` | ADR-022, preflight de remediación y QA afectado; el puerto de plataforma no representa de forma veraz una denegación de actor tenant-bound. | Decisión humana, enmienda ADR-022 y nuevo preflight antes de reanudar Desarrollo. |
| 12 | Decisión humana y enmienda ADR-022 — auditoría de denegación | `RESUELTA` | Enmienda MVP en `docs/architecture/adr/ADR-022-auditoria-transaccional-creacion-empresa-plataforma.md`, SHA-256 `20c7566ef523e678c70daf821cbd29977c87b5aa95120aa5fb025be72e0804d1`. | Requiere preflight de Seguridad antes de Desarrollo. |
| 12 | Siguiente gate | `PREFLIGHT DE SEGURIDAD DE REMEDIACIÓN REQUERIDO` | La enmienda cambia contrato público de `audit`, matriz scope/tenant y persistencia de denegaciones. | Definir controles y evidencia aplicables; no autoriza Desarrollo por sí sola. |
| 13 | Preflight de enmienda MVP de denegación tenant-bound | `ADVISORY` | Sección append-only de `docs/handoffs/security/BE-001-security-preflight.md`, SHA-256 `d58aad501f79957256991477b4f3cc782fbc72c8ddaa9979241626cebc3f9a63`; sustituye F02 sólo en `SEC-BE001-05` y extiende `07/08`. | Desarrollo acotado al contrato `RecordCompanyDenialAuditUseCase`. |
| 13 | Desarrollo, QA, Seguridad final y DoF de la enmienda | `NOT_STARTED` | Candidato de 31 rutas sin cambio; no existe evidencia de implementación del nuevo puerto. | Desarrollo autorizado; QA/Security final/DoF no autorizados. |
| 14 | Desarrollo Backend de enmienda de denegación | `READY_FOR_HANDOFF` | Última sección de `docs/handoffs/backend/BE-001-development-handoff.md`, SHA-256 `dd3c6e2ca0917ed11f359c830bad3d8cd6d402a683fd3aa21adee0ee65146546`; puerto separado, V16 y pruebas PostgreSQL/Flyway. | QA independiente sobre candidato revisión 14. |
| 14 | Candidato y gate hacia QA de enmienda | `QA_REVALIDATION_REQUIRED` | HEAD/diff/staging fijados; manifiesto Backend de 40 rutas `d761488aece4868ea0e723f2f284d8260ce61ce16a36a4cc85e9348b2352918a`. | Revalidar contrato real, matriz scope/tenant, denegación durable, fallo, minimización e invariantes de plataforma. |
| 15 | Gate QA Backend afectado | `BLOCKED` | El handoff de Desarrollo declara manifiesto Backend de 41 rutas `4132505871d1dfe807b8d9be7321e2218184bf1e4d8245c83743c7310264b00f`, pero el paquete vigente conserva el de 40 rutas. | Reconciliar el candidato en el paquete antes de invocar QA. |
| 16 | Reconciliación de candidato y gate QA | `QA BACKEND DE REMEDIACIÓN AUTORIZADA` | HEAD/diff/staging y 41 hashes de ruta verificados contra el handoff de Desarrollo. | QA independiente de allowlist V16 y gestor transaccional. |
| 17 | Recepción documental de Seguridad final F03 | `BLOCKED` | `docs/handoffs/security/BE-001-security-review.md`, sección «Recepción de revisor solo lectura — F03 — 2026-08-05»; no existe en disco ni en el contexto disponible el dictamen estructurado F03 completo para transcripción literal. | Aportar el dictamen estructurado completo de `cybersecurity_reviewer`; hasta entonces no se valida `CHANGES_REQUIRED` ni se habilita/rastrea la ruta `Dev F03 → QA F03 → Seguridad final`. |
| 18 | Seguridad final focalizada F03 | `CHANGES_REQUIRED` | `docs/handoffs/security/BE-001-security-review.md`, sección «Recepción de revisor solo lectura — F03 — 2026-08-05 — FINAL»; Candidate-ID `BE001-CAND-4aa8dcd92b42-01f5c2d14d09-4132505871d1`, firma rápida `PASS`. | Remediación acotada de `SEC-BE001-F03`; no autoriza DoF ni fases posteriores hasta el flujo correspondiente. |
| 19 | Desarrollo Backend — remediación F03 y sincronización de ledger | `READY_FOR_HANDOFF` | Última sección append-only de `docs/handoffs/backend/BE-001-development-handoff.md`; Candidate-ID `BE001-CAND-4aa8dcd92b42-1d008a7a2207-27a855431b51`, diff `1d008a7a…`, manifiesto Backend de 41 rutas `27a85543…`. | QA Backend afectado F03 puede invocarse posteriormente; no se inicia en esta transición. Seguridad final y DoF no autorizados. |

## Solicitud de decisión — Producto/Arquitectura

**Estado:** `RESUELTA` — decisión humana formalizada en ADR-022; el siguiente gate es `PRECHECK DE SEGURIDAD REQUERIDO`.

### Evidencia concreta

- BE-001 crea una empresa mediante un actor `PLATFORM_SUPERADMIN`, identidad de plataforma obligatoriamente sin tenant (`tenantId == null`).
- El contrato público actual de `audit` rechaza ese actor/contexto sin tenant y su vocabulario `AuditResourceType` no incluye el recurso `COMPANY`; no existe una acción/recurso de plataforma para la creación.
- `AuditConfiguration` crea el escritor `JdbcAuditEntryStore` con `DataSource` separado; no hay contrato que garantice que la escritura de `tenancy_company` y la auditoría confirmen o reviertan juntas.
- CA-04 y `SEC-BE001-05` exigen creación auditada, durable y atómica. No es admisible sustituirla por logs, auditoría asíncrona ni acceso directo a tablas/adaptadores internos de otro dominio.

### Decisión solicitada

Producto y Arquitectura deben resolver explícitamente:

1. **Contrato público de auditoría:** cómo un caso de uso de plataforma sin tenant entrega actor, acción, resultado, recurso, hora y `correlationId` confiables al dominio `audit`, sin aceptar identidad, tenant o rol declarados por cliente.
2. **Modelo de recurso:** el vocabulario y las reglas de `COMPANY` para la creación de empresa de plataforma, incluidos los datos mínimos auditables y la política de saneamiento.
3. **Atomicidad:** la estrategia transaccional que garantiza que crear empresa/configuración en `tenancy` y registrar la auditoría crítica confirmen o reviertan de forma conjunta.

La decisión aprobada modificó un límite de dominio, persistencia y transacción; queda registrada en ADR-022. Antes de reanudar Desarrollo, Seguridad debe revalidar el diseño afectado. QA, Seguridad final y DoF permanecen no autorizados.

## Fuentes verificadas y hashes SHA-256

| Fuente | Sección usada | SHA-256 |
|---|---|---|
| `docs/stories/backend/BE-001-crear-una-empresa.md` | Historia, alcance, criterios, seguridad, observabilidad y trazabilidad | `10dc609c0becff16aa85a9a7293f0041e97a76b3557cf47183f02476eba2b36c` |
| `backend/followupbussiness/AGENTS.MD` | Invariantes | `4bea3fd0fbde2b106f0e8444976421b65f70628a9d35c2f598bff1476913a4c1` |
| `docs/api/openapi.yaml` | Reglas globales; `POST /platform/companies`; `CreateCompanyRequest`, `CompanySettings`, `Company`, errores | `8957594b552d75588dcf24ca1adac906aeba7b7ee1a18b7722436875050792d9` |
| `docs/architecture/adr/ADR-002-aislamiento-multiempresa.md` | Decisión | `f2e5c4b0e2e6b63ef39a439bd6d23be03f38219eb083a998c52c3660a1cb624c` |
| `docs/architecture/adr/ADR-012-bootstrap-superadministrador-plataforma.md` | Contexto, decisión, auditoría y consecuencias | `8deb6b91fd650163b5fcc30c4ec73928631d887c76abb77ffef6d64a188fab45` |
| `docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md` | D1–D5, D10, operación y observabilidad | `42fc37af3beaf646c9cd4efd4a17d33056cf683e3b081d4966725c91ce305815` |
| `docs/architecture/adr/ADR-021-auditoria-autenticacion-anonima-transaccional.md` | Contexto, decisión y consecuencias | `0eaddbebb6220481ca31b1be7c6916f16a5205821926b7e5e6fe1357f492bb93` |
| `docs/architecture/adr/ADR-022-auditoria-transaccional-creacion-empresa-plataforma.md` | Decisión aprobada, límites, atomicidad y alternativas | `2532147205a95e909eb438729103d822b944a6812b946aea64afe05390d7c45e` |
| `docs/handoffs/backend/BE-003-backend-handoff.md` | Estado, identidad/tenant y contrato de estado de empresa | `72dda6e56570381a0684c3e4e901ed5b7100746fff9dc905a9e07ca53f935c9e` |
| `docs/handoffs/governance/BE-003-dof.md` | Resultado final | `f68d0c93cb0e60f9903ceea9605ed6a4e7fef6ef7bd1c12e1e9762958b657211` |
| `docs/handoffs/development/BE-007-security-remediation-handoff.md` | Separación de principal plataforma/empresa | `c217dbe42bc8ede7851405e3ee67f89880a03f6607994570069b5e49e6fccd42` |
| `docs/handoffs/security/BE-007-security-revalidation-handoff.md` | Autorización, sesión y empresa activa | `181298c030ce0ee6d90af6660242676dee928b2648b63229993173d5390350d3` |
| `docs/handoffs/dof/BE-007-dof-handoff.md` | Resultado final | `afee2cece6cee827eefabb216d8c95a6c6bd2a4963f6515ec30b47c11cf1b5d9` |
| `docs/handoffs/backend/BE-051-development-handoff-v2.md` | Puerto/auditoría append-only, deduplicación y minimización | `fab34f85b224bbc231d144c65a59b392f24b79b3634a5f9d367f85280ef63e95` |
| `docs/handoffs/security/BE-051-security-handoff-v3.md` | Contexto confiable, controles y resultado | `0ec3c231683b6508d2dff942c62fa1fb2c7af6427277cdef8f28d360ea9d4b8b` |
| `docs/handoffs/dof/BE-051-dof-handoff.md` | Resultado final | `3a022a1da8e31d143281015e4dffca8ab5e346c003255e1dce4a8ac023acbf9b` |

## Registro append-only de revisiones

### Revisión 1 — 2026-08-05

- **Causa:** creación inicial de Fase 0 solicitada para BE-001.
- **Candidato:** no fijado; snapshot registrado únicamente para demostrar que no existe candidato aislado.
- **Alcance invalidado:** cualquier avance a Preflight, Desarrollo, QA, Seguridad final o DoF.
- **Evidencia reutilizable al desbloquear:** criterios, dependencias `PASS`, contrato OpenAPI, reglas y clasificación de riesgo de esta revisión, siempre que sus hashes sigan coincidiendo.

### Revisión 2 — 2026-08-05

- **Causa:** corrección del modelo de Fase 0. El bloqueo de la revisión 1 se debió únicamente a exigir erróneamente un diff funcional/candidato de implementación antes del preflight.
- **`BASELINE_PRE_DESARROLLO`:** `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0` (salida completa de `git rev-parse HEAD`). Staging vacío y diff funcional vacío son el estado esperado pre-Desarrollo; no son un bloqueo.
- **Vigencia verificada:** los hashes de dependencias, OpenAPI, ADR y reglas registrados en esta revisión siguen coincidiendo; por ello el gate pasa a `AUTORIZADO PARA PREFLIGHT`.
- **Preflight v1:** definirá controles de diseño `SEC-BE001-*` sobre autorización de plataforma, tenant/recurso, aislamiento, configuración, idempotencia/concurrencia, auditoría y observabilidad. No implementa ni aprueba código.
- **Candidato posterior:** se fijará después de Desarrollo y antes de QA. Los controles del preflight se revalidarán frente a ese candidato; solo se actualizarán si el candidato cambia la superficie de riesgo.

### Revisión 3 — 2026-08-05

- **Causa:** cierre de la fase de Desarrollo Backend con handoff `BLOCKED` en `docs/handoffs/backend/BE-001-development-handoff.md`; se reconcilia además el encabezado del paquete con su revisión vigente.
- **Identidad de candidato:** no existe candidato de implementación. Se conserva únicamente `BASELINE_PRE_DESARROLLO` `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging, diff funcional y manifiesto funcional continúan vacíos (SHA-256 de contenido vacío `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`).
- **Bloqueo determinante:** el puerto público actual de `audit` rechaza un actor `PLATFORM_SUPERADMIN` sin `tenantId`, no ofrece recurso `COMPANY` y usa un `DataSource` de escritura separado. Implementar una vía local, fabricar tenant o sustituir la auditoría por logs infringiría límites de dominio, trazabilidad y atomicidad de `SEC-BE001-05`.
- **Acción requerida:** una decisión/ADR y ampliación explícita del contrato de `audit` para operaciones de plataforma sin tenant, vocabulario/recurso de empresa, contexto de correlación confiable y participación transaccional común con `tenancy`. Debe revisar consumidores y, si cambia la superficie de riesgo, actualizar únicamente los controles `SEC-BE001-*` afectados.
- **Evidencia reutilizable:** baseline, hashes de fuentes, criterios CA-01..04, preflight `ADVISORY` y controles de diseño; `CompanyAccessStatusMigrationTest` pasó sobre la baseline y verifica la migración/consulta vigente de estado de empresa, no BE-001 implementada.
- **Evidencia inválida o ausente:** implementación, migraciones, pruebas de BE-001, matriz de evidencia de CA-01..04, ejecución de `SEC-BE001-01..06`, candidato de implementación y toda entrada de QA/Seguridad final/DoF. Ninguna fase posterior queda autorizada.

### Revisión 4 — 2026-08-05

- **Causa:** el bloqueo de Desarrollo por `SEC-BE001-05` persiste; se formaliza la solicitud de decisión a Producto/Arquitectura sin abrir una fase ni crear un artefacto adicional.
- **Decisión requerida:** contrato público de auditoría para plataforma sin tenant, recurso `COMPANY` y estrategia de transacción común entre `tenancy` y `audit`.
- **Límites no aceptables:** logs, auditoría asíncrona, tenant fabricado y acceso directo a tablas o adaptadores internos de otro dominio no satisfacen CA-04 ni `SEC-BE001-05`.
- **Condición de reanudación:** si la decisión cambia límites, persistencia o transacción, ADR aprobado; después, actualizar paquete/preflight solo para la superficie afectada y reanudar únicamente Desarrollo.

### Revisión 5 — 2026-08-05

- **Decisión humana aprobada:** ADR-022, `docs/architecture/adr/ADR-022-auditoria-transaccional-creacion-empresa-plataforma.md`, SHA-256 `2532147205a95e909eb438729103d822b944a6812b946aea64afe05390d7c45e`.
- **Contrato y límites fijados:** `audit` expone `RecordPlatformCompanyAuditUseCase`; el contexto confiable deriva actor/rol `PLATFORM_SUPERADMIN`, `tenantId = null`, hora y `correlationId`; `COMPANY`/`CRITICAL_MUTATION`/`PLATFORM` son vocabularios cerrados y `tenantId` solo es nullable para ese scope.
- **Atomicidad fijada:** el escritor crítico comparte `DataSource` y `PlatformTransactionManager` con `tenancy`; empresa, configuración y auditoría confirman o revierten en una transacción. El purgador conserva conexión separada.
- **Cambio de estado:** `SEC-BE001-05` deja de ser bloqueo arquitectónico y pasa a **requiere revalidación de preflight**. El siguiente gate es `PRECHECK DE SEGURIDAD REQUERIDO`; no se autoriza Desarrollo hasta su resultado.
- **Evidencia reutilizable/inválida:** se reutilizan CA-01..04, baseline, preflight v1 y `SEC-BE001-01..04,06`; `SEC-BE001-05` y todo control de contrato/atomicidad afectado requieren precheck. No existe candidato de implementación ni evidencia de QA/Seguridad final/DoF.

### Revisión 6 — 2026-08-05

- **Candidato fijado:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `b4947b96ee6f039c2a5aeca0bfecbafefa479071c4b14c17779f525638a5c4bd`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend de 28 rutas SHA-256 `a6cccc5eea3fecb36c6929f538908851ffb97b1c042e865cb72affd44d2a24c9`.
- **Desarrollo validado:** handoff `READY_FOR_HANDOFF` SHA-256 `fbde7e26f5cb9d96c24d2fb82106361492e3c21d66f9e3188738f8b23fd59d6d`; `git diff --check`, compilación y suite dirigida de creación, REST, contexto de auditoría, migraciones, transacción y arquitectura: `PASS`.
- **Evidencia reutilizable:** matriz completa CA-01..04 y `SEC-BE001-01..08`; pruebas de autorización/tenant, DTO cerrado y correlación, validación de configuración, conflicto/unicidad, scope plataforma, atomicidad/rollback y fronteras hexagonales. ADR-022 y precheck `ADVISORY` quedan vigentes sobre el mismo candidato.
- **Evidencia inválida o pendiente:** no hay evidencia QA independiente, Seguridad final ni DoF. QA deberá repetir selectivamente negativos HTTP, conflicto/carrera concurrente y atomicidad sobre este candidato sin modificar su identidad.

### Revisión 7 — 2026-08-05

- **Causa:** remediación acotada de CA-04/`SEC-BE001-06` por el hallazgo QA alto de correlación divergente entre respuesta y `audit_entry`.
- **Candidato actualizado:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `b4947b96ee6f039c2a5aeca0bfecbafefa479071c4b14c17779f525638a5c4bd`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend (28 rutas) SHA-256 `6a42c21d1dcfdacbb1d79c3de22e79215fa39846bb6ea4b436a9f753670bee5e`.
- **Remediación y evidencia:** controlador normaliza una sola vez y conserva el UUID saneado en la solicitud; respuesta, validación y proveedor de auditoría reutilizan el valor. Pruebas MVC, contexto de auditoría, transacción PostgreSQL/Flyway/Testcontainers y arquitectura/módulos: `PASS`; `git diff --check`: `PASS`.
- **Evidencia reutilizable:** ADR-022, preflight `ADVISORY`, CA-01..04 y `SEC-BE001-01..05,07..08` no cambiaron; la matriz y pruebas de Desarrollo siguen reutilizables salvo el alcance de correlación modificado.
- **Evidencia inválida o pendiente:** el handoff QA `CHANGES_REQUIRED` y su candidato/manifiesto `a6cccc5e…` no autorizan avance sobre el nuevo candidato. Requiere QA de revalidación independiente de CA-04/`SEC-BE001-06`, tanto para cabecera inválida como UUID válido, y confirmación de que no se regresó la transacción afectada. Seguridad final y DoF permanecen no autorizados.

### Revisión 8 — 2026-08-05 — preparación de remediación de Seguridad

- **Causa y fuente:** Seguridad final dejó `BLOCKED` en `docs/handoffs/security/BE-001-security-review.md`, SHA-256 `977dadd30ec888adaeaa3efaafb2087d8c97481d2833d03de1814ed14134610d`. No se inicia una fase mediante esta revisión.
- **Candidato verificado sin cambio:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `b4947b96ee6f039c2a5aeca0bfecbafefa479071c4b14c17779f525638a5c4bd`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend de 28 rutas SHA-256 `6a42c21d1dcfdacbb1d79c3de22e79215fa39846bb6ea4b436a9f753670bee5e`.
- **`SEC-BE001-F01` — HIGH:** V14 impide auditar y revocar sesiones de `PLATFORM_SUPERADMIN` sin tenant; un fallo de logout puede revertir la revocación y mantener activa la sesión privilegiada. La superficie afectada comprende auditoría crítica, migración V14, sesiones/logout de plataforma y su transacción.
- **`SEC-BE001-F02` — MEDIUM:** un rechazo tenant-bound dentro del caso de uso no deja auditoría durable. La superficie afectada comprende el rechazo tenant-bound, el límite de auditoría crítica y su relación transaccional.
- **Evidencia invalidada únicamente:** quedan invalidadas para avance las conclusiones de Seguridad final y la evidencia asociada a `SEC-BE001-03`, `SEC-BE001-05` y `SEC-BE001-07` en las superficies anteriores, incluida la ausencia de prueba de abuso de carrera real identificada en el informe. La evidencia de QA/Desarrollo no debe reutilizarse para afirmar que esas superficies están resueltas.
- **Evidencia que permanece vigente:** el candidato identificado, ADR-022, preflight `ADVISORY`, CA-01..04 y la evidencia de BE-001 que no toque las superficies afectadas permanecen trazables; en particular, la remediación de `SEC-BE001-06` y su QA `PASS` de correlación, la validación de configuración, la autorización/aislamiento ya demostrados fuera de los rechazos tenant-bound, y la atomicidad de creación de empresa/configuración/auditoría no quedan invalidadas por esta revisión.
- **Gate:** `PREFLIGHT DE SEGURIDAD DE REMEDIACIÓN REQUERIDO`. El preflight de remediación deberá definir controles y evidencia aplicables; esta revisión no inventa controles técnicos ni una solución, y no autoriza Desarrollo, QA, otra Seguridad final ni DoF.

### Revisión 9 — 2026-08-05 — Desarrollo de remediación F01/F02

- **Causa y entrada:** el preflight de remediación quedó `ADVISORY` en `docs/handoffs/security/BE-001-security-preflight.md`, SHA-256 `b7cedf426942a614d1d01e633420b9a8ef1a22545c3cb5fe7cf5e20fcb80741a`; la entrega de Desarrollo está `READY_FOR_HANDOFF` en `docs/handoffs/backend/BE-001-development-handoff.md`, SHA-256 `e6562e3872d12db217446bf6310162ba66f83fd97a050777b3d992ef8eebed5c`.
- **Candidato actualizado:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `9df4c4b0176b9be6a4f4ccd7d000592254d2920167a2a9f31683c05069284ca0`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend de 31 rutas SHA-256 `21e5aa97645fef9e54e43859bd786f4a71cd6d305ee7bf41110e9c9b787354af`, calculado con rutas relativas a `backend/followupbussiness` y contenido SHA-256 unido con LF.
- **Superficie implementada y pruebas declaradas:** matriz cerrada V14 para auditoría de sesión derivada en servidor; refresh/logout de plataforma sin tenant; estado seguro ante fallo final de auditoría; auditoría `DENIED` mínima para rechazo tenant-bound; y carrera PostgreSQL/Flyway real de creación. El handoff declara `PASS` para los comandos dirigidos y `git diff --check`.
- **Evidencia reutilizable:** permanecen reutilizables el ADR-022, el preflight `ADVISORY`, los controles sin cambio `SEC-BE001-01,02,04,06`, y la evidencia previa de correlación CA-04/`SEC-BE001-06` en la medida en que no toque la nueva superficie. La evidencia de QA anterior sobre el candidato de 28 rutas sigue siendo histórica y no aprueba esta revisión.
- **Evidencia invalidada o pendiente:** las conclusiones del informe de Seguridad `BLOCKED` no se cierran por Desarrollo; requieren QA independiente sobre el candidato de 31 rutas para F01/F02 y `SEC-BE001-03,05,07,08`, incluidos upgrade V13→V14, refresh/logout tenantless, rechazo tenant-bound, fallo transaccional y carrera concurrente. Seguridad final de revalidación y DoF permanecen no autorizados.

### Revisión 10 — 2026-08-05 — Desarrollo de remediación F02

- **Causa:** QA independiente dejó `CHANGES_REQUIRED` para F02 en `docs/handoffs/backend/BE-001-backend-qa.md`, SHA-256 `b571ba06da2634c47f312ed54e7332271aaa570f757d552c475d4d923f6cfed2`: el rechazo tenant-bound intentaba escribir `DENIED`, pero la excepción revertía `audit_entry` y la integración obtuvo cero registros.
- **Compatibilidad de límites:** el handoff de Desarrollo declara que ADR-022 y el preflight permiten confirmar el rechazo como resultado de la misma transacción y convertirlo en `AccessDeniedException` sólo después del commit. No se declara ni autoriza `REQUIRES_NEW`, un segundo `PlatformTransactionManager` o un segundo `DataSource`.
- **Candidato actualizado:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `da573f0dfd4b6aedc021a499f713519a41a21039d1bc0990ed6bff53bb0f616c`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend de 31 rutas SHA-256 `9d2e3168a5f8a0b69714759f1e1340457cd757232f1bd9971ae296335cba9374`, calculado con rutas relativas a `backend/followupbussiness` y contenido SHA-256 unido con LF.
- **Evidencia declarada por Desarrollo:** rechazo tenant-bound sin empresa/configuración y una única auditoría `PLATFORM`/`DENIED` mínima, tenant nulo y correlación segura; fallo del escritor no se presenta como rechazo auditado; la prueba de commit conjunto/rollback conserva la atomicidad de éxito. Maven dirigido PostgreSQL/Flyway/Testcontainers, MVC, arquitectura/módulo, `git diff --check` y `graphify update` figuran `PASS` en el handoff.
- **Evidencia reutilizable:** se mantienen como evidencia histórica las comprobaciones F01, V14, refresh/logout tenantless, carrera de creación, y los controles `SEC-BE001-01,02,04,06` que no fueron modificados por este delta. La evidencia previa de creación/auditoría de éxito se reutiliza sólo como regresión, no como aprobación de F02.
- **Evidencia invalidada o pendiente:** el `CHANGES_REQUIRED` de QA sobre el manifiesto `21e5aa…` no aprueba el nuevo candidato `9d2e3168…`. QA debe revalidar F02 de manera independiente: auditoría `DENIED` durable/saneada, cero mutación, fallo del escritor sin falso rechazo auditado y conservación de la atomicidad de éxito. Seguridad final de revalidación y DoF permanecen no autorizados.

### Revisión 11 — 2026-08-05 — contradicción arquitectónica F02

- **Causa y evidencia:** QA dejó `CHANGES_REQUIRED` en `docs/handoffs/backend/BE-001-backend-qa.md`, SHA-256 `6c72d7f92dff69566f093aad740af63d103f4be977412b2cb0a42aaaf5c36c96`. `SecurityContextPlatformAuditTrustedContextProviderTest#rejectsTenantBoundOrNonPlatformActors` exige rechazar a un `PLATFORM_SUPERADMIN` con `tenantId` no nulo; esta es una protección vigente de contexto confiable, no una prueba desactualizada.
- **Contradicción:** ADR-022 define `RecordPlatformCompanyAuditUseCase` para una operación de plataforma cuyo contexto se deriva como actor/rol `PLATFORM_SUPERADMIN`, `tenantId = null` y scope `PLATFORM`. Por tanto, el puerto debe rechazar actores tenant-bound. El preflight de remediación y la implementación F02 intentaron registrar ese actor real como `PLATFORM_SUPERADMIN`/scope `PLATFORM` para conservar una auditoría `DENIED`; dicha suplantación de plataforma es incorrecta aunque descarte el tenant presentado.
- **Superficie y evidencia invalidada:** queda invalidada exclusivamente la construcción F02 que reutiliza `RecordPlatformCompanyAuditUseCase`/scope `PLATFORM` para un rechazo tenant-bound, junto con su evidencia de Desarrollo/QA de auditoría `DENIED` bajo identidad sustituida. La definición F02 del preflight de remediación requiere reemplazo; el estado `READY_FOR_HANDOFF` de esa remediación no autoriza avance. No se invalida por esta contradicción la evidencia F01, V14, refresh/logout tenantless, la creación exitosa atómica, correlación, validación de configuración ni los controles no afectados `SEC-BE001-01,02,04,06`.
- **Candidato sin cambio:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `da573f0dfd4b6aedc021a499f713519a41a21039d1bc0990ed6bff53bb0f616c`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend de 31 rutas SHA-256 `9d2e3168a5f8a0b69714759f1e1340457cd757232f1bd9971ae296335cba9374`.
- **Decisión humana requerida:** definir un contrato público y específico de auditoría de denegación que conserve la identidad real derivada del servidor: actor, tenant y scope reales; recurso objetivo `COMPANY`; resultado `DENIED`; sin payload, cabeceras, token ni datos de identidad aportados por el cliente, y sin suplantar una operación de plataforma.
- **Condición de reanudación:** esta decisión requiere una enmienda de ADR-022 y, una vez aprobada, un preflight de Seguridad que defina los controles aplicables antes de reanudar Desarrollo. Hasta entonces, el gate queda `BLOCKED` y no se inicia Desarrollo, QA, Seguridad final ni DoF.

### Revisión 12 — 2026-08-05 — decisión humana y enmienda ADR-022

- **Decisión humana formalizada:** se aprueba un puerto público y específico `RecordCompanyDenialAuditUseCase`, separado de `RecordPlatformCompanyAuditUseCase`. Registra recurso `COMPANY`, acción `CRITICAL_MUTATION`, resultado `DENIED` e identificador de intento generado por el servidor; el contexto confiable deriva actor, tenant y scope reales `TENANT_BOUND_DENIAL`. No acepta identidad, tenant, scope, payload, cabeceras, token, PII ni tiempos del cliente.
- **Matriz y transacción decididas:** `TENANT_BOUND_DENIAL` exige tenant real no nulo; `PLATFORM` conserva tenant nulo. La denegación confirma una única evidencia sin empresa/configuración mediante el mismo `DataSource` y `PlatformTransactionManager`, y sólo después se traduce a `403`; un fallo de auditoría no se presenta como denegación auditada. Se prohíben `REQUIRES_NEW`, segundo gestor/DataSource, auditoría asíncrona, logs como sustituto y acceso directo entre dominios.
- **ADR actualizado:** `docs/architecture/adr/ADR-022-auditoria-transaccional-creacion-empresa-plataforma.md`, enmienda MVP, SHA-256 `20c7566ef523e678c70daf821cbd29977c87b5aa95120aa5fb025be72e0804d1`.
- **Candidato sin cambio:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `da573f0dfd4b6aedc021a499f713519a41a21039d1bc0990ed6bff53bb0f616c`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend de 31 rutas SHA-256 `9d2e3168a5f8a0b69714759f1e1340457cd757232f1bd9971ae296335cba9374`.
- **Evidencia reutilizable/inválida:** continúan reutilizables F01, V14, refresh/logout tenantless, correlación, validación de configuración, creación exitosa atómica y los controles no afectados `SEC-BE001-01,02,04,06`. Permanece inválida la evidencia F02 que usó `RecordPlatformCompanyAuditUseCase`/scope `PLATFORM` para un principal tenant-bound; el preflight F02 anterior debe sustituirse sólo en esa superficie.
- **Gate:** `PREFLIGHT DE SEGURIDAD DE REMEDIACIÓN REQUERIDO`. La enmienda no autoriza Desarrollo, QA, Seguridad final ni DoF hasta que Seguridad defina el control y la evidencia verificable de este nuevo contrato.

### Revisión 13 — 2026-08-05 — preflight de enmienda MVP de denegación

- **Entrada y resultado:** `docs/handoffs/security/BE-001-security-preflight.md` agregó un `ADVISORY` para la enmienda ADR-022, SHA-256 `d58aad501f79957256991477b4f3cc782fbc72c8ddaa9979241626cebc3f9a63`. No inspeccionó implementación ni ejecutó pruebas.
- **Controles vigentes:** `SEC-BE001-01,02,03,04,06` permanecen vigentes; `SEC-BE001-05` queda sustituido parcialmente y extendido sólo para F02 con `RecordCompanyDenialAuditUseCase`; `SEC-BE001-07` añade `TENANT_BOUND_DENIAL + tenant real no nulo`; `SEC-BE001-08` añade commit de denegación antes de `403` y fallo del escritor sin falso rechazo auditado.
- **Candidato sin cambio:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `da573f0dfd4b6aedc021a499f713519a41a21039d1bc0990ed6bff53bb0f616c`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend de 31 rutas SHA-256 `9d2e3168a5f8a0b69714759f1e1340457cd757232f1bd9971ae296335cba9374`.
- **Evidencia reutilizable/inválida:** siguen reutilizables F01, V14/autenticación tenantless, correlación, validación, carrera de creación y creación exitosa atómica mientras el nuevo diff no afecte esas rutas. La evidencia F02 anterior que usa `PLATFORM`/tenant nulo para una identidad tenant-bound continúa inválida y no se reutiliza.
- **Gate:** Desarrollo Backend queda autorizado exclusivamente para `RecordCompanyDenialAuditUseCase`, la matriz/persistencia `TENANT_BOUND_DENIAL`, la traducción commit→`403`, la minimización y las pruebas PostgreSQL exigidas. QA, Seguridad final y DoF permanecen no autorizados.

### Revisión 14 — 2026-08-05 — Desarrollo de enmienda MVP de denegación

- **Entrada y resultado:** la sección vigente de Desarrollo quedó `READY_FOR_HANDOFF` en `docs/handoffs/backend/BE-001-development-handoff.md`, SHA-256 `dd3c6e2ca0917ed11f359c830bad3d8cd6d402a683fd3aa21adee0ee65146546`; declara la implementación del puerto público separado, la migración V16 y pruebas dirigidas `PASS`.
- **Candidato actualizado:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `488d3105072f4b27ddff29dc8b78f9ff69a1e367bbcee8c627c6b1a61d2cb8ba`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend de 40 rutas SHA-256 `d761488aece4868ea0e723f2f284d8260ce61ce16a36a4cc85e9348b2352918a`, calculado con rutas relativas a `backend/followupbussiness` y contenido SHA-256 unido con LF.
- **Evidencia declarada:** `RecordCompanyDenialAuditUseCase` conserva actor/tenant reales con scope `TENANT_BOUND_DENIAL`; V16 cierra la matriz; la denegación confirma una evidencia antes de `403`, falla sin falso rechazo auditado y conserva creación exitosa atómica. El puerto de plataforma permanece restrictivo para principal tenant-bound.
- **Evidencia reutilizable/inválida:** F01, autenticación tenantless, correlación, validación, carrera de creación y creación exitosa atómica siguen reutilizables sólo como regresión si QA confirma que el nuevo candidato no las afectó. La evidencia F02 que simulaba la identidad como `PLATFORM` continúa inválida y no autoriza avance.
- **Gate:** QA Backend independiente debe validar el contrato real de denegación, campos saneados, idempotencia del intento, matriz scope/tenant, mismo `DataSource`/gestor sin `REQUIRES_NEW`, fallo transaccional y regresión de creación de plataforma. Seguridad final y DoF permanecen no autorizados.

### Revisión 15 — 2026-08-05 — bloqueo de identidad previo a QA

- **Causa:** `docs/handoffs/backend/BE-001-development-handoff.md`, SHA-256 `21707424c9136f64aa3d39a8b1930ee29753d70f19d79dbb082cd8ec4270bb71`, declara un candidato posterior de 41 rutas con manifiesto `4132505871d1dfe807b8d9be7321e2218184bf1e4d8245c83743c7310264b00f`; el paquete aún fija el manifiesto de 40 rutas `d761488aece4868ea0e723f2f284d8260ce61ce16a36a4cc85e9348b2352918a`.
- **Estado:** `BLOCKED`. QA no puede validar un candidato no fijado en el paquete; no se invocó QA, Seguridad final ni DoF.
- **Acción necesaria:** el Orquestador debe reconciliar HEAD, diff, staging, manifiesto y evidencia reutilizable/inválida del candidato de 41 rutas en el paquete canónico antes de reabrir el gate de QA.

### Revisión 16 — 2026-08-05 — reconciliación de candidato

- **Identidad fijada y verificada:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `01f5c2d14d09845dfcd40b24d1697036ca18f5f3da6e726e905e9a6eb8bee60e`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto de 41 rutas SHA-256 `4132505871d1dfe807b8d9be7321e2218184bf1e4d8245c83743c7310264b00f`. Cada ruta y hash de contenido reproduce el manifiesto del handoff.
- **Alcance:** el delta se limita a allowlist V16/`AuditEntry` y reutilización del `PlatformTransactionManager`; ADR-022/enmienda y preflight vigente permanecen aplicables.
- **Evidencia:** se invalida la QA anterior sólo para allowlist cerrada y gestor transaccional; F01/F02, creación atómica, correlación y demás evidencia no afectada sigue reutilizable como regresión.
- **Gate:** `QA BACKEND DE REMEDIACIÓN AUTORIZADA`. No se inicia Seguridad final ni DoF.

### Revisión 17 — 2026-08-05 — ledger administrativo de candidato

- **Candidate-ID asignado una vez:** `BE001-CAND-4aa8dcd92b42-01f5c2d14d09-4132505871d1`, derivado de HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`, diff `01f5c2d14d09845dfcd40b24d1697036ca18f5f3da6e726e905e9a6eb8bee60e` y firma `4132505871d1dfe807b8d9be7321e2218184bf1e4d8245c83743c7310264b00f`.
- **Firma rápida:** paquete, Desarrollo y QA declaran la misma identidad; no se rehízo el manifiesto de 41 rutas sin discrepancia ni riesgo nuevo.
- **Gate:** Seguridad final autorizada; DoF no autorizado.

### Revisión 19 — 2026-08-05 — sincronización de ledger tras remediación F03

- **Causa:** recepción del handoff canónico de Desarrollo `READY_FOR_HANDOFF` para la remediación exclusiva de `SEC-BE001-F03`.
- **Candidate-ID asignado:** `BE001-CAND-4aa8dcd92b42-1d008a7a2207-27a855431b51`, derivado de HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`, diff `1d008a7a22070e48f86c6325577f3973b77347e213166e5ee16c344840e4e415` y firma `27a855431b5195ca3f1f1d65a19502a0601034983f67a331a463291a73c545a6`.
- **Firma rápida:** staging vacío y los valores de diff/manifiesto declarados en el handoff de Desarrollo. No se recalculó el manifiesto: se reutiliza el único manifiesto estricto de 41 rutas producido por el cambio funcional.
- **Alcance reconciliado:** el bypass posterior a fallo de auditoría queda limitado a `PLATFORM_SUPERADMIN` tenantless derivado por servidor; tenant-bound y MOBILE pending revierten ante fallo. Sin cambios de contratos, migraciones, `DataSource` ni gestor transaccional.
- **Gate:** Desarrollo cerrado; QA Backend afectado F03 queda pendiente, sin invocación en esta transición. Seguridad final y DoF continúan no autorizados.

### Registro administrativo — pre-gate DoF — 2026-08-06

- **Decisión:** `RESUELTO`; DoF queda autorizado.
- **Identidad rápida actual:** `PASS` — HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`, staging vacío SHA-256 `e3b0c442…`, diff SHA-256 `1d008a7a22070e48f86c6325577f3973b77347e213166e5ee16c344840e4e415`; coincide con el Candidate-ID vigente `BE001-CAND-4aa8dcd92b42-1d008a7a2207-27a855431b51`.
- **Corrección documental:** QA F03 y Seguridad final F03 declaran `PASS`; la enmienda administrativa del handoff Dev F03 referencia este paquete, revisión 19 y el mismo Candidate-ID. No cambian alcance, código, pruebas ni candidato.
- **Acción siguiente:** DoF debe efectuar el cierre estricto de commit/PR/CI con este mismo candidato.
