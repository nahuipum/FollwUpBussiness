# MAP-THEME-2026-09-17 — Desarrollo

- Estado: `READY_FOR_HANDOFF`.
- Candidate-ID: `359cc48+6a61f6195d5e`.
- Se centralizó la URL de estilo Geoapify y la observación de `data-theme` en `src/shared/maps/geoapify-map-theme.ts`. Los tres mapas aplican el estilo nuevo con `setStyle`, conservando sus instancias. La carga diferida consulta el tema vigente al crear cada mapa. Rutas recompone la capa vial tras `style.load`.
- Pruebas: 27 casos focalizados OK, incluyendo inicio oscuro, cambio a claro y cambio durante la carga diferida en los tres mapas; `npm run typecheck` y `git diff --check` OK. `npm run lint` y `npm run build` pasaron antes de la corrección focalizada.
- Riesgo residual: el build conserva el aviso preexistente de chunks mayores a 500 kB. No hay cambios de contrato, datos ni permisos.
