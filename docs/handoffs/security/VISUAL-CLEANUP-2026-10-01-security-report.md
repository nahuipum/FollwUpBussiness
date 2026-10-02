# VISUAL-CLEANUP-2026-10-01 · revisión Security final

- **Estado:** `PASS`
- **Candidate-ID:** `359cc48+b43fa14876fd`
- **Gate:** paquete y handoff QA coinciden en Candidate-ID; QA previo en `PASS`.

## Superficie revisada

Diff de producción y pruebas afectadas en `frontend/followupbussiness`: presentación de rutas y roles, logout/sustitución de sesión, estados globales `401/403`, login/tema y mapas con ubicación/estilo Geoapify. No se reabrieron fuentes primarias.

## Controles y evidencia

- **PASS — actor/recurso:** `canAccessPath` y los guards de `App` mantienen la separación de `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER`; el diff no amplía rutas, acciones ni tenant. El Backend continúa siendo la autoridad.
- **PASS — éxito y denegación:** la migración visual no cambia llamadas ni efectos. Ante `403`, `App` retorna el estado forbidden y desmonta el contenido protegido; el payload de error no se presenta. Se reutiliza la cobertura QA de rutas/roles y el caso existente que descarta el detalle del Backend.
- **PASS — falla/stale y ubicación:** el cambio de tema actualiza el estilo sobre la misma instancia de mapa; no refetchea, persiste ni transmite coordenadas adicionales. La geometría de ruta se repone tras `style.load` y los estados degradados existentes permanecen.
- **PASS — sesión/ámbito:** logout conserva `logout()` seguido de navegación al login; no cambió la implementación de sesión ni caché. Reproducción Security: `npm exec -- vitest run src/app/App.test.tsx --environment jsdom -t "revoca el detalle del tenant anterior al reemplazar la sesión"` — 1 prueba OK; elimina correo, vendedor y código del tenant anterior antes de mostrar el nuevo ámbito.
- **PASS — secretos/datos:** no se añadieron logs, almacenamiento de credenciales ni exposición de datos personales. La preferencia de tema es el único dato nuevo en `localStorage`. El identificador `VITE_GEOAPIFY_TILE_KEY` sigue usándose solo para obtener el estilo público del mapa; no se incorporan coordenadas en esa URL.

## Hallazgos

Sin hallazgos de seguridad nuevos ni abuso reproducible pendiente de cierre.

## Controles no aplicables y riesgo residual

- **NOT_EXECUTED / no aplicable al diff:** WebSocket, Redis/caché servidor, mensajería, archivos, dependencias e infraestructura.
- Riesgo residual: una clave `VITE_*` es observable por diseño en el navegador; sus restricciones de origen/cuota en Geoapify no son verificables en este diff. Los guards del Frontend son defensa de presentación y no sustituyen autorización/tenant isolation del Backend.
