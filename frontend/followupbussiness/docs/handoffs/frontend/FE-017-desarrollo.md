# FE-017 — Desarrollo Frontend

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `a189f4d+fe017-99dadf74e342`

## Entregado

- `company-routes` publica solo borradores desde Admin/Supervisor, tras confirmación de ruta, vendedor, fecha, estado y disponibilidad activa. La lista paginada de vendedores entrega `displayName` y `status`, sin N+1.
- El diálogo de confirmación queda compacto (680 px) y su checkbox usa el mismo tratamiento visual y accesible de las confirmaciones ya existentes; se eliminó la variante de visor de 1200 px que no correspondía a este contenido.
- POST `/routes/{routeId}/publish` usa `X-Correlation-Id`, `Idempotency-Key`, `If-Match`, CSRF y `{ notifySeller }`; doble clic queda bloqueado. Éxito actualiza detalle/listado y muestra confirmación reutilizable.
- Errores 400/403/404/409/422/red son recuperables; 409 recarga sin sobrescribir estado local. Selección, solicitud y resultado se limpian al cambio de sesión/tenant.

## Archivos

- `src/features/company-routes/{api.ts,types.ts,CompanyRoutesPage.tsx}`; `hooks/{useRoutes,useRouteDetail,useRoutePublish}.ts`; `components/{RouteDetailDialog,RoutePublishDialog}.tsx` y pruebas asociadas.

## Contrato y evidencia

- Se abrió el fragmento de `docs/api/openapi.yaml` por una ambigüedad nueva: `Seller.status` confirma disponibilidad en `/sellers`; no se añadieron consultas por vendedor. No se releyeron historia ni contratos primarios completos.

## Validación

- `npm test -- src/features/company-routes/api.test.ts src/features/company-routes/hooks/useRoutePublish.test.tsx src/features/company-routes/components/RoutePublishDialog.test.tsx src/features/company-routes/components/RouteDetailDialog.test.tsx` — 17 pruebas OK.
- `npm run typecheck` — OK; `npm test` — 326 pruebas OK; `npm run build` — OK; `git diff --check` — OK.
- `npm run lint` — sin errores; 2 advertencias preexistentes fuera de FE-017 (`useTerritoryForm.test.tsx`, `VisualSelect.tsx`). Build conserva advertencia preexistente de tamaño de chunk.
- Ajuste visual: `npm test -- --run src/features/company-routes/components/RoutePublishDialog.test.tsx` — 2 pruebas OK; `npm run typecheck` y `git diff --check` — OK.

## Criterios/riesgos/reproducción

- Reproducir: abrir una ruta `DRAFT` con vendedor `ACTIVE`, elegir **Publicar ruta**, desmarcar notificación opcional y confirmar; verificar `PUBLISHED` y versión devuelta. Responder 409 y verificar recarga.
- Riesgo residual: disponibilidad local es un filtro UX; Backend conserva autorización, tenant, equipo y validación final.
