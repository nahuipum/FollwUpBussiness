# MAP-THEME-2026-09-17 — Contexto

- Estado: `READY_FOR_HANDOFF`.
- Candidate-ID: `359cc48+6a61f6195d5e` (digest del cambio de código y pruebas; excluye estos informes).
- Solicitud: los mapas web deben usar el mismo estilo cartográfico según el tema activo y actualizarse al cambiarlo.
- Criterios: Rutas, mapa general de Clientes y mapa de ubicación del cliente usan `dark-matter` en modo oscuro y `osm-bright` en modo claro; el cambio conserva puntos, marcadores, selección y ubicación; permanecen los estados de carga, error y alternativa textual/manual.
- Causa: `RouteSequenceMap` tenía lógica propia para `data-theme`; `ClientMap` y `ClientLocationMap` fijaban `osm-bright`. Solo compartían MapLibre y el auxiliar de imágenes del estilo.
- Alcance: `frontend/followupbussiness/src/shared/maps/geoapify-map-theme.ts` y los tres componentes de mapa con sus pruebas focalizadas.
- Referencias visuales: `docs/frontendMockups/FE-010.html` y `docs/frontendMockups/FE-014.html`. No definen nuevas reglas de negocio.
- Seguridad: los mapas manejan ubicaciones ya autorizadas. Verificar que el cambio de estilo no amplíe consultas, permisos, exposición de coordenadas ni registros de datos.
- Delta del candidato: la carga diferida consulta el tema vigente al crear el mapa y Rutas registra la reposición de la capa vial antes de cualquier cambio de estilo.
- Pendiente: revalidación QA de la corrección, Security y DoF del mismo candidato.
