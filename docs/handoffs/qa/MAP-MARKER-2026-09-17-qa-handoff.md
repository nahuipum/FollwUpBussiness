# MAP-MARKER-2026-09-17 — QA Frontend

- Estado: `PASS`.
- Candidate-ID: `359cc48+c61e503ab5a4`, contrastado con el paquete, el handoff de Desarrollo y el diff de los dos archivos afectados; no hay deriva dentro del alcance.

| Criterio | Implementación | Prueba / evidencia |
|---|---|---|
| Activo oscuro legible | El pin y la etiqueta activa usan `#267d65`; la etiqueta conserva `var(--visual-on-brand)` (blanco). | Contraste blanco/verde: 5.00:1; captura oscura local revisada. |
| Popup activo coherente | En oscuro usa fondo `#164b3d`, texto `#e4f7ef` y borde verde. | Contraste texto/fondo: 8.94:1; reglas locales revisadas. |
| Estados distintos | Inactivo conserva advertencia; seleccionado conserva azul `--visual-brand-strong`; foco conserva `--visual-focus-ring`. | La regla del activo oscuro usa `:where(...)` y pierde ante `.map-marker--selected`; foco aplica su anillo después. |
| Tema claro sin cambio | Los valores base de pin, estado y popup siguen siendo los anteriores. | Los tres overrides nuevos exigen `[data-theme="dark"]`. |

- Validación: `$env:VITE_GEOAPIFY_TILE_KEY='qa-dummy-key'; npm run test:visual -- company-clients-map.visual.spec.ts --grep "mapa de clientes oscuro"` — `1/1` aprobada; confirma solicitud `dark-matter`. `git diff --check` aprobado.
- Regresión directa: captura `company-clients-map-dark-win32.png` revisada; no se modifica el PNG ignorado. Permisos/acceso directo, sesión o caché de tenant, formularios, WebSocket y mapa de Rutas no tienen superficie afectada por CSS/prueba local.
- Riesgos: ninguno dentro del alcance. Seguridad: `NOT_APPLICABLE` por cambio exclusivo de CSS y prueba visual.
