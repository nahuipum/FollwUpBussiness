# Paquete de contexto — BE-010

## Estado y candidato

- Historia: `BE-010 — Activar o inactivar vendedor`.
- Estado actual: `READY_FOR_DEVELOPMENT`.
- Candidate-ID: `HEAD d63e4bc + BE-010 status/tenant-CAS/revocación BE-005/guard de asignación` (reemplaza el candidato previo tras la única remediación QA; no se realizarán commits).
- Delta: guard de dominio reutilizable para impedir asignar a un vendedor inactivo y prueba sin escritura; no existe hoy productor de rutas/asignaciones alcanzable. `git diff --check HEAD` pasa.

## Predecesoras verificadas

- `BE-005`: contrato de revocación/cierre disponible y cierre DoF `PASS` para su candidato vigente; reutilizar su puerto/caso de uso, sin duplicar lógica.
- `BE-008`: DoF `PASS` (`HEAD c38dad7 + BE-008 rollback-audit-integration/pruebas`); creación de vendedor estable.

## Contrato y alcance

- OpenAPI: `PATCH /sellers/{sellerId}/status`, `x-required-roles: [COMPANY_ADMIN]`, body `ChangeEntityStatusRequest` con `additionalProperties: false`, `status` (`EntityStatus`) y `reason` obligatorio de 5 a 500; respuestas `200`, `400`, `403`, `404`, `409`.
- Cambio lógico únicamente. Conservar perfil, usuario, supervisor, territorios, rutas, visitas, ventas y auditoría histórica. No editar perfil/supervisor/territorios, ni crear/reasignar rutas, ni nómina/asistencia.
- Autorización/tenant: sólo `COMPANY_ADMIN` del mismo tenant. `SUPERVISOR`, `SELLER`, no autenticado, `PLATFORM_SUPERADMIN` y demás roles son denegados; otro tenant no debe modificar ni inferir existencia.

## Invariantes y efectos prohibidos

1. Éxito: transición válida, auditada con motivo y datos mínimos no sensibles; propaga `correlationId` y registra resultado/error sin secretos ni PII completa.
2. Denegación/no-op: respuesta contractual y cero escrituras, revocaciones, eventos o auditoría.
3. Al inactivar: revocar/cerrar todas las sesiones, refresh tokens y tickets vigentes mediante BE-005; access previo deja de ser utilizable; no puede iniciar sesión ni recibir nuevas rutas/asignaciones prohibidas.
4. Reactivar: no restaura sesiones revocadas, rutas previas ni privilegios; habilita sólo el flujo de autenticación vigente.
5. Consistencia: impedir repetición/estado incompatible y concurrencia; `409` cuando aplique, sin efectos parciales ni rollback incompleto.

## Puertos/superficies alcanzables

- Entrada REST de vendedores y caso de uso/puertos workforce para estado, autorización por recurso, persistencia, auditoría y asignación de rutas.
- Puerto público de identidad para revocación BE-005; autenticación, refresh, tickets y login deben observar la revocación/estado sin filtrar datos.
- Fragmentos OpenAPI consultados: `/sellers/{sellerId}/status`, autenticación/sesiones y asignación de rutas. No modificar contratos silenciosamente.

## Fases

- Development: implementar y probar exclusivamente BE-010; emitir `docs/handoffs/backend/BE-010-development-handoff.md` en español, máximo 300 palabras, estado `READY_FOR_HANDOFF` o `BLOCKED`.
- QA, Security y DoF usarán este paquete, el Candidate-ID y el handoff inmediato previo. Seguridad aplica por identidad, autorización, revocación y tenant isolation.
