# MAP-MARKER-2026-09-17 — Desarrollo

- Estado: `READY_FOR_HANDOFF`.
- Candidate-ID: `359cc48+c61e503ab5a4`.
- Archivos: `frontend/followupbussiness/src/features/company-clients/styles/company-clients.css` y `frontend/followupbussiness/tests/visual/company-clients-map.visual.spec.ts`.
- Se mantiene `--client-map-marker-contrast`: borde y centro claros en oscuro, sin cambio en claro. El pin activo y la etiqueta «Activo» usan `#267d65` en oscuro; el popup activo combina `#164b3d` y `#e4f7ef`. El selector del pin activo tiene baja especificidad para conservar el azul y anillo del seleccionado. Sin cambios de tamaño ni interacción.
- Referencia consultada: `docs/frontendMockups/FE-010.html`.
- Verificación: contraste blanco sobre etiqueta `5.00:1` y texto de popup `8.94:1`; inspección de especificidad y `git diff --check` OK. La prueba Playwright oscura ahora exige `dark-matter`, usa fondo oscuro y pasó `1/1` con clave de prueba. La captura local fue revisada; el repositorio ignora las capturas PNG.
