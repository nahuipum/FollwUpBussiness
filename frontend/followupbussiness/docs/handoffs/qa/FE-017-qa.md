# FE-017 — QA Frontend

**Estado:** `PASS`  
**Candidate-ID:** `a189f4d+fe017-99dadf74e342`

## Delta de verificación independiente

- **Modal compacto y responsive:** `RoutePublishDialog` usa `route-detail--publish`, sin `route-detail--viewer`; `company-routes.css` limita el ancho con `width: min(100%, 680px)`. Evidencia: revisión estática del componente y CSS.
- **Checkbox accesible y consistente:** control nativo dentro de su `label` (nombre accesible conservado), tamaño `18px`, `accent-color: #176d77`, foco visible y estado `disabled={busy}`; la etiqueta adopta `cursor: wait` al deshabilitarse. Evidencia: `RoutePublishDialog.tsx`, CSS y prueba focalizada por rol/nombre.
- **Comportamiento sin regresión:** al desmarcar notificación se emite `false`; en estado ocupado permanece bloqueada la confirmación. Evidencia: `RoutePublishDialog.test.tsx`.

## Evidencia ejecutada

- `npm test -- --run src/features/company-routes/components/RoutePublishDialog.test.tsx` — 2 pruebas OK.
- `git diff --check` — OK. `HEAD` es `a189f4d`; paquete y handoff de Desarrollo declaran `fe017-99dadf74e342`.

## Regresión y riesgo

Regresión directa cubierta: notificación opcional y bloqueo durante publicación. Sin cambios de permisos, sesión/tenant, mapas o WebSocket. Riesgo residual: `:has()` requiere navegadores modernos; no altera la semántica ni el estado nativo del control.
