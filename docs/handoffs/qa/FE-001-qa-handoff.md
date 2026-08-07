# FE-001 — QA Frontend (revalidación afectada)

**Estado:** PASS  
**Candidate-ID:** `HEAD 12dd1eb + diff a13dcd39b48e678fee225ce3417d5b090bd94803`.

| Criterio afectado | Implementación | Evidencia | Estado |
|---|---|---|---|
| Tarjeta “Próxima visita” sobre la ruta | `.visit-card` usa `position: absolute; z-index: 2`; la ruta y pines quedan en `z-index: 1` | Inspección de `global.css` y captura `C:\tmp\fe-001-desktop-route-layering.png`: la línea se oculta tras la tarjeta | PASS |

Sin hallazgos reproducibles. No se ejecutaron suites por alcance exclusivo de capas; se conserva la evidencia del handoff Dev para el resto del candidato. Regresión relevante: ilustración desktop; no cambia formulario, accesibilidad, sesión, permisos, mapa ni WebSocket.
