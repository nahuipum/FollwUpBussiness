# FE-009 — QA Frontend

**Estado:** `PASS`  
**Candidate-ID:** `b049d77+7e2ac573`

- Posición/teclado: la comprobación queda tras Ubicación (mapa y confirmación) y antes de Cancelar/Crear; el orden de tab coincide con DOM.
- Disponibilidad: exige nombre/dirección, opcionales/frecuencia válidos, WGS84 real confirmado y ausencia de `busy`; sin coordenadas no invoca contrato ni usa `0,0`. En edición conserva `excludeCustomerId`.
- Creación/advertencia: Crear funciona sin comprobación; duplicados siguen informativos/no bloqueantes. Doble envío continúa bloqueado.
- Responsive/accesibilidad: bloque flexible y botón ancho completo en móvil, consistente con Sellers; foco, Tab/Shift+Tab y retorno pasan.
- Permisos, sesión/caché y mapa: sin cambios ni regresión contractual.

## Validaciones

- `ClientFormDialog.test.tsx`: PASS, 12 pruebas.
- `git diff --check`: PASS.

Sin hallazgos reproducibles. Riesgo residual: validaciones de identidad son de formato; tenant/autorización efectiva sigue bajo Backend.
