# MAP-MARKER-2026-09-17 — Contexto

- Estado: `READY_FOR_HANDOFF`.
- Candidate-ID: `359cc48+c61e503ab5a4` (digest del árbol de código y pruebas; excluye informes y capturas locales ignoradas).
- Solicitud: conservar la distinción de los marcadores sobre el mapa oscuro y suavizar su relleno verde y el indicador «Activo» de la lista, cuyo fondo actual es demasiado brillante para texto blanco.
- Causa: en oscuro `--visual-success` vale `#6ce9a6`; se usa tanto en el pin activo como en la etiqueta con texto blanco, donde el contraste es insuficiente.
- Alcance: estilos locales del mapa de clientes, sus marcadores compartidos con ubicación y el estado activo de la lista y popup; prueba visual focalizada que simula el fondo oscuro cuando se solicita `dark-matter`. Mantener inactivo, seleccionado, foco, posición, dimensiones e interacciones; evitar cambios globales de `--visual-success` o del mapa de Rutas.
- Decisión visual: verde profundo y menos saturado en oscuro, con texto blanco legible en la etiqueta (objetivo ≥4.5:1). Mantener borde y centro claros del pin, y la apariencia clara actual.
- Referencia: captura adjunta por el usuario y `docs/frontendMockups/FE-010.html` (patrón visual, sin reglas de negocio).
- Seguridad: `NOT_APPLICABLE`; cambio CSS de contraste sin datos, permisos, red ni almacenamiento.
- Delta: el borde y centro claros anteriores permanecen; se amplía el alcance al relleno activo, a las etiquetas activas y a la prueba visual oscura.
- Pendiente: QA visual y DoF del nuevo candidato.
