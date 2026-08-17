# Paquete de contexto — BE-012 Asignar territorios

**Estado actual:** `PASS`  
**Candidate-ID:** `HEAD 8bfd410 + BE-012 territorios/autorización/auditoría/HTTP+cross-tenant-404`.

## Predecesoras y contrato

- `BE-059`: DoF `PASS` en `docs/handoffs/dof/BE-059-dof.md`; consulta/listado y filtro `territoryId` disponibles.
- `BE-062`: DoF `PASS` en `docs/handoffs/dof/BE-062-dof.md`; catálogo de territorios disponible y estable.
- OpenAPI estable: `PUT /sellers/{sellerId}/territories`, exclusivo `COMPANY_ADMIN`, `AssignTerritoriesRequest.territoryIds` obligatorio, UUID y `uniqueItems`; reemplaza el conjunto vigente. Respuestas: `200`, `400`, `403`, `404`, `422`.

## Alcance y controles

Implementar sólo la asignación/reemplazo de uno o más territorios vigentes de un vendedor. El tenant proviene exclusivamente de sesión. `COMPANY_ADMIN` sólo actúa sobre vendedor y territorios de su tenant; `SUPERVISOR`, `SELLER`, no autenticado, `PLATFORM_SUPERADMIN` y otros roles se rechazan.

Invariantes: validar actor/recurso/tenant antes de escribir; rechazar duplicados, inactivos, inexistentes y cross-tenant sin relación, auditoría, evento ni alteración parcial; reemplazar, no agregar; preservar vendedor, territorios, rutas, visitas, ventas e historial; auditar actor, vendedor y diferencia anterior/nueva sin PII/secreto; propagar `correlationId` y registrar resultado/error seguro. Reintentos/no-op y concurrencia no producen efectos indebidos. Los filtros/listados de BE-059 deben reflejar el conjunto final.

## Puertos y validación esperada

Superficies: REST/autenticación, caso de uso, puertos de vendedor/territorio y relación, transacción/persistencia, consultas/filtros BE-059, auditoría y observabilidad. Reusar reglas de BE-062; no cambiar OpenAPI ni reglas de catálogo. Desarrollo añade pruebas focalizadas y ejecuta validación CI-equivalente si toca autorización, transacción, persistencia, caché, configuración, serialización, dependencias o fixtures compartidos.

## Flujo y artefactos

Desarrollo remedió la cobertura HTTP del candidato inicial; este Candidate-ID lo reemplaza. QA revalida únicamente el hallazgo. Seguridad aplicable genera `docs/handoffs/security/BE-012-security-review.md`; DoF genera `docs/handoffs/dof/BE-012-dof.md`. No hay commits, push, PR ni cambios fuera de BE-012.

## Bloqueo actual

Seguridad `CHANGES_REQUIRED` fue remitida: la resolución cross-tenant ahora devuelve `404` genérico antes de escribir, con prueba HTTP de cero efectos. QA revalida el cierre; Seguridad debe reabrirse porque cambió un control decisivo. No procede DoF hasta ambos `PASS`.
