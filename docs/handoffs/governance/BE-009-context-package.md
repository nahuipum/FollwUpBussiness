# Paquete de contexto — BE-009 Editar vendedor

Estado: `PASS`  
Candidate-ID: `HEAD eaa8cf5 + BE-009 PATCH seller update, tenant/ETag/audit/advisory-lock`.

## Puerta de predecesoras

`BE-008` y `BE-059` están terminadas y con contrato estable: ambos DoF `PASS` y sin hallazgos abiertos. No bloquean esta historia.

## Alcance y contrato confirmado

Implementar solo `PATCH /sellers/{sellerId}` (`operationId: updateSeller`) conforme a `docs/api/openapi.yaml`. Solo `COMPANY_ADMIN`; tenant exclusivamente desde sesión. `UpdateSellerRequest` permite únicamente `displayName` (2–160), `phone` (máximo 30) y `employeeCode` (máximo 50), con `additionalProperties: false` y `minProperties: 1`. Requiere `If-Match` y `CorrelationId`; respuestas: `200`, `400`, `403`, `404`, `409`.

Fuera de alcance: supervisor, territorios, estado, identidad/acceso, correo, credenciales, invitaciones, eliminación e historial/relaciones. No modificar OpenAPI ni reglas de negocio ajenas.

## Invariantes

1. Actor/recurso: solo `COMPANY_ADMIN` del tenant del vendedor; `SUPERVISOR`, `SELLER`, superadmin, otros roles y anónimo se deniegan. Un recurso externo no se revela.
2. Éxito: se cambian únicamente los tres campos contractuales; se preservan identidad, relaciones, historial y demás datos.
3. Denegación/validación: request vacío, campos desconocidos, límites inválidos, duplicados y acceso no autorizado no escriben ni auditan ni producen efectos secundarios.
4. Conflicto: `If-Match` obligatorio y válido; versión obsoleta o concurrencia devuelve `409`, sin sobrescritura ni cambio parcial.
5. Fallo/observabilidad: operación atómica; auditoría mínima no sensible y `correlationId` solo en éxito. Logs, eventos, métricas, auditoría y evidencia omiten PII completa y secretos.

Puertos alcanzables a preservar: entrada REST de Sellers, caso de uso de edición, puertos de persistencia/versionado, auditoría y observabilidad/correlación. Confirmar en código, sin añadir superficies no requeridas.

## Entregables y fases

Development crea `docs/handoffs/backend/BE-009-development-handoff.md` (`READY_FOR_HANDOFF` o `BLOCKED`) y luego el orquestador fija un único Candidate-ID. QA independiente crea `docs/handoffs/qa/BE-009-qa-handoff.md`; Seguridad es aplicable y crea `docs/handoffs/security/BE-009-security-review.md`; DoF crea `docs/handoffs/dof/BE-009-dof.md`. No commits, push ni PR.

## Delta Development

Development `READY_FOR_HANDOFF`: implementación y pruebas focalizadas aprobadas; `mvn -q verify` aprobó tras expirar `clean verify`. Añadió la restricción única tenant-scoped de `employeeCode` para el requisito de duplicados; QA debe confirmar su compatibilidad con datos existentes y la ausencia de efectos parciales.

## Delta QA

QA `CHANGES_REQUIRED`: V28 crea directamente el índice único y puede impedir el despliegue si existen duplicados históricos de `employeeCode` por tenant. La corrección debe preservar íntegros los registros existentes, mantener rechazo de duplicados aplicables y ausencia de cambios parciales, y demostrarlo focalizadamente. Revalidación QA limitada al hallazgo y regresión directa.

## Delta de remediación

Development retiró V28. Para cambios que incluyen `employeeCode`, serializa por tenant+código mediante bloqueo asesor transaccional PostgreSQL, verifica duplicidad y mantiene el update condicionado por versión; cambios solo de nombre/teléfono no alteran duplicados históricos. Prueba focalizada aprobada; se reutiliza la validación completa previa porque no cambió contrato ni composición compartida.

## Delta Seguridad

Seguridad `PASS`: reprodujo intento con `SUPERVISOR` y `COMPANY_ADMIN` de otro tenant, con ID y versión válidos; confirmó cero escrituras y cero auditorías. La concurrencia PostgreSQL real queda como riesgo residual `NOT_EXECUTED`, mitigado por bloqueo asesor transaccional y versionado, sin hallazgo abierto.

## Cierre DoF

DoF `PASS`: los artefactos Development, QA y Seguridad coinciden con el Candidate-ID vigente; las validaciones declaradas aplican y `git diff --check` no reporta errores. No hay hallazgos abiertos.
