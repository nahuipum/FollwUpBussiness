# Paquete de contexto — BE-023

**Estado:** `PASS`  
**Candidate-ID:** `HEAD+ff8fac1 BE023-7f735f969c32`

## Alcance

`PUT /routes/{routeId}/points/order`: reordenar la permutación completa de puntos de una ruta, con autorización por tenant/equipo, `If-Match`, auditoría y observabilidad segura. Se excluyen publicación, notificaciones, reasignación, optimización automática y tráfico en tiempo real.

## Invariantes preparados

- Éxito: misma colección de puntos, secuencia determinista `1..n`, estimaciones recalculadas y versión posterior al éxito.
- Denegación: actor, tenant o equipo no autorizados no generan lecturas posteriores, escrituras, auditoría de éxito ni eventos.
- Conflicto/rechazo/fallo: versión obsoleta, estado no editable, permutación inválida o fallo de cálculo/persistencia/evento no dejan efectos parciales.
- Observabilidad: correlationId y datos técnicos mínimos; se omiten coordenadas, PII, tokens e IDs de clientes.

## Decisiones de MVP

1. **Estado editable: solo `DRAFT`.** Es la única ruta aún no entregada al vendedor; `PUBLISHED`/`IN_PROGRESS` son operativas y una modificación exige el flujo `route.modified`; `COMPLETED` y `CANCELLED` son históricas. Esta decisión evita cambiar la ruta del día sin sincronización ni notificación, y no amplía el alcance de BE-023.
2. **Estimaciones: no se fabrican ni se recalculan mediante una llamada nueva.** La política EN-018 exige reutilizar matriz, pero el MVP actual conserva solo su hash en propuestas; las rutas y puntos no persisten matriz, duración de servicio, ventana operativa, llegada o salida. Para una estimación correcta y disponible se requiere un enabler que persista un snapshot autorizado de esos datos y un puerto de recálculo que lo reutilice. Si no existe snapshot, el endpoint no puede confirmar cambios. No se aceptan distancia lineal, duración cero, tráfico ni fallback silencioso.
3. **Notificación: no corresponde a `DRAFT`.** El contrato vigente no dice que esté prohibido avisar. Al contrario, `route.modified` v1 ya obliga a avisar al vendedor si cambia una ruta publicada/asignada. No requiere modificar contrato para ese futuro flujo; requiere implementar previamente outbox/notificaciones (BE-055/BE-053). BE-023 no emite evento ni notifica porque solo altera `DRAFT`.

## Gate de reanudación

`EN-022` fue confirmado `PASS` por Producto el 2026-08-25. Development puede
materializar exclusivamente el snapshot/puertos/contratos aprobados por ese
enabler; no puede inventar ETA, proveedor, límite ni fallback. La edición se
restringe a `DRAFT`; no emite `route.*` ni notifica.

## Delta Development

- Se añadió el caso de uso transaccional de reordenamiento con bloqueo de ruta/snapshot, `If-Match`, autorización tenant/equipo, permutación completa, cálculo exclusivo desde snapshot y auditoría saneada.
- V45 incorpora ETAs por punto y snapshots PostgreSQL tenant-scoped; el éxito crea una revisión `VALID` y marca la previa `SUPERSEDED`. No hay llamada a proveedor, evento ni notificación para `DRAFT`. La creación conserva el límite contractual de 500 puntos.
- Corrección QA Major: se restauró 500 en OpenAPI y validación de creación, con prueba de borde de 500. Validación focal: `mvn -q "-Dtest=CreateRouteServiceTest,ReorderRoutePointsServiceTest" test` y `git diff --check` pasaron.

## Delta QA

`PASS` tras remediación: se restableció el máximo de 500 en OpenAPI y
validación, con prueba de borde focalizada. Candidate-ID consistente;
`CreateRouteServiceTest` y `git diff --check` pasaron.

## Delta Security

`PASS`: autorización por rol y alcance, aislamiento por `tenant_id`, orden de
controles previo al snapshot y ausencia de efectos en denegación verificados.
El snapshot queda ligado a tenant/ruta/versión en consultas y restricciones;
auditoría, métricas y errores omiten coordenadas, PII y tokens. El abuso focal
de `SUPERVISOR` fuera de equipo pasó sin snapshot, escritura ni auditoría.

## Próximo gate

Ninguno. DoF `PASS`, sin commits.

## Delta DoF

`PASS`: Development `READY_FOR_HANDOFF`, QA y Seguridad aplicable `PASS`,
Candidate-ID coincidente y validaciones declaradas trazables. `git diff --check`
pasó en la compuerta final; no hay hallazgos pendientes.
