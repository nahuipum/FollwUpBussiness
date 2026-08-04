# Trazabilidad del contrato OpenAPI general

**Contrato:** `openapi.yaml` 1.0.0  
**Estado:** `READY_FOR_HANDOFF`

Cada operación REST declara `x-story-ids`. Esta matriz resume la cobertura por
capacidad; el archivo OpenAPI es la fuente exacta para una operación concreta.

| Capacidad | Operaciones principales | HUs cubiertas |
|---|---|---|
| Autenticación e identidad | `/auth/*`, `/me` | EN-013, BE-003..007, FE-001..004, MOB-001..002, INT-002..003 |
| Onboarding de empresa | `/platform/companies*` | BE-001..002, BE-057, INT-001, INT-038 |
| Operación de plataforma | `/internal/outbox/dlq/{eventId}/reprocess` | BE-056 |
| Usuarios y configuración | `/company/users*`, `/company/settings` | BE-007, BE-054, BE-058, FE-004, FE-033, INT-033 |
| Territorios y vendedores | `/territories*`, `/sellers*` | BE-008..012, BE-059, BE-062, FE-005..007, FE-037, INT-004, INT-033 |
| Clientes y cartera | `/customers*`, `/customer-assignments/batch` | BE-013..017, BE-060, FE-008..011, FE-036, INT-005, INT-034 |
| Importación | `/customers/import-template`, `/customer-imports*` | BE-018..020, FE-012..013, INT-006 |
| Rutas | `/routes*` | EN-018, BE-021..027, BE-053, BE-061, FE-014..019, MOB-004..005, MOB-029, INT-007..009, INT-039 |
| Jornada y tracking | `/journeys*`, `/tracking/active-sellers` | BE-028..033, FE-020..022, MOB-007..010, MOB-024..026, INT-010..012, INT-023 |
| Visitas y geocerca | `/visits*` | BE-034..040, FE-023..025, FE-038, MOB-011..018, INT-013..016, INT-036 |
| Catálogo | `/products*` | BE-041, FE-035, MOB-019, INT-035 |
| Ventas | `/sales*` | BE-042..046, FE-026..029, MOB-020..023, MOB-031..032, INT-017..021, INT-037 |
| Reportes y auditoría | `/reports*`, `/report-exports*`, `/audit-entries` | BE-047..052, FE-030..032, INT-022, INT-025, INT-040 |
| Dispositivos y offline | `/devices*`, `/mobile/bootstrap`, `/mobile/sync/commands` | BE-053, MOB-004..005, MOB-009..010, MOB-014, MOB-019, MOB-022, MOB-025, MOB-027..029, INT-015, INT-018 |

## Historias sin operación REST propia

No toda HU debe crear un endpoint. Las siguientes se validan mediante otro
contrato o mediante criterios no funcionales:

- BE-055: outbox transaccional y contratos de eventos.
- MOB-003, MOB-006, MOB-026 y MOB-030: permisos, navegación e indicadores del
  dispositivo; comportamiento de la aplicación.
- FE-034: manejo transversal de errores y permisos; consume el error común.
- INT-024 y INT-028..032: aislamiento, correlación, resiliencia, rendimiento,
  retención y seguridad; pruebas y controles transversales.
- INT-026 e INT-027: degradación de Redis y mensajería; operación interna.

## Reglas transversales verificables

1. El tenant se deriva del token y nunca de un `tenantId` de entrada.
2. Las operaciones privadas heredan `bearerAuth`; las públicas declaran
   `security: []`.
3. `x-required-roles` expresa el rol mínimo y no sustituye la autorización por
   pertenencia a tenant, equipo o recurso.
4. Los comandos reintentables usan `Idempotency-Key` y los eventos mobile
   incluyen un identificador estable generado por el cliente.
5. Las mutaciones concurrentes relevantes usan `If-Match`.
6. Los errores siguen `application/problem+json` e incluyen `correlationId`.
7. Importes se representan como decimal y se recalculan en el servidor.
8. Fechas usan ISO 8601 y la fecha operativa usa la zona horaria de la empresa.
9. EN-013 fija access JWT RS256 de 10 minutos y familias refresh opacas de 30
   días con rotación, detección de reutilización y revocación inmediata.
10. Auth WEB entrega refresh solo mediante cookie `__Host-fs-refresh` HttpOnly y
    exige CSRF; MOBILE lo entrega/recibe solo en body fuera de contexto
    navegador. `X-Auth-Client` nunca es autoridad y no permite downgrade.
11. Reset/activación usa token opaco de un uso; la solicitud es neutral y un
    reset exitoso revoca todas las familias de la cuenta.

## Puertas pendientes

1. Backend QA valida implementabilidad, estados HTTP y reglas de dominio.
2. Frontend QA y Mobile QA validan que los flujos puedan generarse/consumirse.
3. Ciberseguridad valida autenticación, autorización, datos personales y GPS.
4. DoF permite fijar la versión como baseline solo después de los pasos previos.
