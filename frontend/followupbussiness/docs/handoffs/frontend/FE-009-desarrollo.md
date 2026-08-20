# FE-009 — Desarrollo

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `b049d77+7e2ac573`

## Ajuste UX de comprobación de duplicados

- El botón se movió desde Nombre a un bloque secundario final: después de ubicación, mapa y confirmación, antes de Cancelar/Crear. El orden DOM/tab es campos → ubicación → comprobación → footer.
- El bloque comunica que es una advertencia informativa y no condiciona guardar. En móvil ocupa el ancho disponible y conserva el orden visual.
- Solo se habilita con nombre/dirección válidos, opcionales y frecuencia válidos, WGS84 válido confirmado y sin `busy`. Su handler no invoca el contrato si faltan coordenadas; no hay fallback `0,0`.
- No cambiaron API/hooks/contratos, mapa/proveedor, permisos, sesión/empresa, doble envío ni mockups. Crear continúa disponible sin comprobar.

## Evidencia

- `npm test -- src/features/company-clients/components/ClientFormDialog.test.tsx` — PASS (1 archivo, 12 pruebas).
- `npm run typecheck` — PASS.
- `npm run lint` — PASS sin errores; 2 advertencias preexistentes ajenas al delta.
- `npm run build` — PASS; advertencia informativa por tamaño del chunk MapLibre.
- `git diff --check` — PASS.

## Riesgo y reproducción

Archivos: `ClientFormDialog.tsx`, `company-clients.css`, `ClientFormDialog.test.tsx` y artefactos FE-009. Riesgo residual: validación local de identidad solo por formato. Para QA: verificar habilitación completa, request contractual con coordenadas reales y exclusión en edición, orden de tabulación y que crear no requiere comprobar.
