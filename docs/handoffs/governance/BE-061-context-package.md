# Paquete de contexto — BE-061

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `eddddca+98a900eb8d8b`

## Alcance preparado

Consultas de solo lectura: `GET /routes` para administración/supervisión,
`GET /routes/{routeId}` autorizado y `GET /routes/my-route` para el vendedor
autenticado. Tenant, identidad, rol y equipo se derivan de sesión; no hay
escrituras, eventos, auditoría de cambio ni caché nueva.

## Invariantes preparados

- Éxito: tenant/alcance autorizados antes de filtros, conteos, paginación y
  puntos; orden estable y `Route.version` vigente.
- Denegación: un ID o filtro fuera de alcance no revela rutas, puntos,
  clientes, vendedor ni conteos parciales.
- Vendedor: solo una ruta propia `PUBLISHED`/asignada; fecha interpretada en
  la zona horaria de la empresa; observabilidad solo con `correlationId` y
  métricas saneadas.

## Decisiones MVP

- Una sola ruta `PUBLISHED` puede estar asignada a cada `(tenant, vendedor,
  fecha operativa)`. Development debe preservar esta invariante mediante una
  restricción parcial durable; publicación o reasignación que la viole retorna
  `409`. Datos heredados ambiguos no se eligen: `/routes/my-route` retorna
  `409` neutro hasta su corrección administrativa.
- Sin ruta vigente, ruta ajena/no autorizada, vendedor inactivo o cuenta sin
  sesión habilitada: `404` neutro, sin conteos ni detalles. La autenticación
  global puede rechazar antes una credencial revocada.
- La reasignación efectiva cambia inmediatamente la propiedad de lectura: el
  vendedor anterior deja de poder ver la ruta (`404`); el nuevo obtiene la
  misma ruta con su `Route.version` incrementada. Si la jornada ya comenzó,
  se conserva la regla existente de ReassignRoute; esta HU no muta ni inventa
  una transición de jornada.
- `GET /routes/my-route` usa la `date` local solicitada como fecha operativa;
  la empresa provee la zona IANA para cualquier conversión desde instantes.

## Implementación esperada

Actualizar OpenAPI para documentar `409` de asignación ambigua/conflictiva y
mantener `404` neutro. Probar la restricción y todos los casos de denegación;
no modificar datos existentes ni producir eventos.
