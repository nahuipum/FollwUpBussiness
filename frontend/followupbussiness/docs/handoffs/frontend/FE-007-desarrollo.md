# FE-007 — Desarrollo

**Estado:** READY_FOR_HANDOFF
**Candidate-ID:** `HEAD 286ad04 + FE007-7f177aa2`

## Cambios

- `src/features/company-sellers/api.ts`, `types.ts`: `PATCH /sellers/{sellerId}/status` con `{status, reason}` y parseo seguro del `Seller` de respuesta.
- `hooks/useSellerStatus.ts`: selección, motivo, progreso, errores, prevención de doble envío, reemplazo de fila solo ante `200` y limpieza al cambiar sesión/empresa.
- `components/SellerStatusDialog.tsx`: confirmación accesible con foco inicial, trampa/retorno de foco, Escape, labels, validación 5–500, anuncios y mensajes recuperables; aviso de revocación al inactivar y sin promesas de restauración al activar.
- `SellerTable.tsx` y página: acción solo para `COMPANY_ADMIN`; `SUPERVISOR`/`SELLER` no la reciben. Se conserva tabla, menú y composición.

## Controles y evidencia

- Éxito y reemplazo de fila; `403`/`404`/`409`/red simulada sin cambio local; doble envío, cancelación y limpieza por empresa: `useSellerStatus.test.tsx`.
- Contrato PATCH y cuerpo: `api.test.ts`.
- Roles y visibilidad de la acción: `SellerTable.test.tsx`.
- Validación, foco y semántica del diálogo: `SellerStatusDialog.test.tsx`.
- Ejecutado: `npm test -- --run ...` (4 archivos, 14 pruebas), `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`; todos correctos.

Referencia visual consultada: patrón de modal/foco de `src/features/company-users/`; no existe `FE-007.html` y no se modificaron mockups.

## Riesgos y reproducción

Backend mantiene autorización y tenant. Para reproducir: iniciar como `COMPANY_ADMIN`, abrir «Más acciones» de un vendedor, elegir Activar/Inactivar, ingresar motivo válido y confirmar; simular `409` conserva diálogo y motivo. Sin pendientes conocidos.
