# FE-042 — Consulta de auditoría de plataforma

**Área:** Frontend  
**Tipo:** Historia de usuario  
**Épica:** Auditoría de plataforma  
**Prioridad:** Must Have  
**Fase:** MVP

## Historia

**Como** superadministrador de plataforma  
**Quiero** consultar las acciones auditadas realizadas en la plataforma  
**Para** tener trazabilidad sobre la administración de empresas y operaciones internas

## Alcance

Crear una vista exclusiva de plataforma, separada de FE-032 y de la auditoría del tenant. Permitirá consultar entradas inmutables de alcance `PLATFORM`, filtrables y paginadas, una vez exista un endpoint dedicado autorizado solo para `PLATFORM_SUPERADMIN`.

## Criterios de aceptación

1. Solo `PLATFORM_SUPERADMIN` accede a la ruta y a la consulta; FE-032 y `/audit-entries` permanecen exclusivos del `COMPANY_ADMIN` dentro de su tenant.
2. La vista lista entradas de alcance `PLATFORM` con paginación y filtros contractuales por intervalo, operación, actor, empresa/recurso y `correlationId` cuando correspondan.
3. Cada entrada muestra solo los datos permitidos: fecha, actor identificado de forma mínima, operación, tipo e identificador de recurso, resultado, motivo permitido y `correlationId`.
4. No muestra contraseñas, tokens, enlaces de activación, sesiones, documentos completos, coordenadas ni contenido libre no aprobado.
5. Distingue lista vacía, carga, error recuperable, permiso denegado y respuesta obsoleta; logout o cambio de sesión limpia filtros, resultados y errores.
6. La interfaz es de consulta: no permite alterar, borrar, reprocesar ni restaurar entradas de auditoría.

## Referencias

- Tipos de usuario 6.4
- RN-001, RN-002
- RF-AUD-002
- ADR-022
- FE-032

## Seguridad y privacidad

- Requiere un endpoint de plataforma independiente; no reutiliza ni amplía desde el cliente `/audit-entries` del tenant.
- La autorización, el alcance `PLATFORM` y los filtros se derivan y validan en servidor; ningún `tenantId` recibido concede visibilidad.
- El soporte excepcional a datos operativos de tenants no forma parte de esta historia.

## Observabilidad

- Propagar y mostrar `correlationId` según FE-034 cuando aplique.
- No registrar los contenidos de las entradas ni datos sensibles en cliente.

## Evidencia mínima para DoF

- Pruebas de filtro, paginación, lista vacía, `403`, aislamiento frente a auditoría tenant y limpieza por cambio de sesión.
- QA independiente y revisión de seguridad.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 9 — Dashboard, reportes, auditoría y estabilización.
- **Predecesoras obligatorias:** nueva capacidad Backend de consulta de auditoría de plataforma y su OpenAPI; `FE-003` — Gestión de sesión; `FE-034` — Manejo global de errores y permisos.
- **Historias consecuentes que habilita:** validación E2E de auditoría de plataforma por definir junto con el contrato Backend.
- **Validación vertical:** no iniciar hasta que exista endpoint de lectura y validación E2E con aislamiento de scopes.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** endpoint de lectura de auditoría de plataforma, modelo de filtro/paginación, matriz de datos visibles y política de retención.
- El actual `GET /audit-entries` no satisface esta historia: exige `COMPANY_ADMIN` y consulta únicamente el tenant.
- El contrato no puede modificarse silenciosamente para acomodar una implementación.

## Datos, reglas y casos límite

- **Datos mínimos:** scope `PLATFORM`, actor, operación, recurso, resultado, fecha y `correlationId` permitidos.
- Casos mínimos: sin registros, permiso denegado, filtro inválido, paginación, identidad con tenant indebido y cambio de sesión.

## Fuera de alcance

- Auditoría del tenant (FE-032), edición/eliminación de auditoría, soporte con acceso a datos operativos, gestión de DLQ y visualización de secretos o PII no permitida.

## Puerta de Ready para esta historia

- Se aprueba primero la nueva capacidad Backend y el OpenAPI de plataforma; sin ello, la historia queda bloqueada y no se implementa una pantalla simulada.
- La matriz criterio → prueba incluye aislamiento estricto entre scopes `PLATFORM` y tenant.
<!-- delivery-traceability:end -->

