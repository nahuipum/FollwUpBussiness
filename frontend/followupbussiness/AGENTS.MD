# Frontend — Instrucciones locales

## Contexto

- Aplicar `../../AGENTS.MD`.
- Leer completa la historia Frontend indicada.
- Buscar primero `../../docs/frontendMockups/<HU-ID>.html`. Si existe, usarlo
  como referencia visual; si no, tomar como patrón los otros mockups HTML y se
  puede crear el de la HU sin introducir reglas de negocio nuevas.
- Abrir solo los fragmentos OpenAPI y contratos WebSocket afectados.
- Inspeccionar primero el diff, la feature y sus pruebas.

## Invariantes

- Usar React y TypeScript estricto; evitar `any` sin justificación.
- Derivar tipos del contrato cuando el proyecto lo permita.
- Organizar por features y no duplicar reglas de negocio del backend.
- La autorización visual no sustituye la autorización del servidor.
- Cubrir carga, vacío, error, falta de permiso y datos desactualizados.
- Mostrar la última actualización; nunca presentar ubicación antigua como actual.
- Proveer reconexión/fallback para WebSocket y alternativa accesible al mapa.
- Limpiar estado y caché al cerrar sesión o cambiar de empresa.
- No guardar tokens en mecanismos inseguros ni registrar datos personales.

## Verificación

Ejecutar pruebas dirigidas y type-check primero. Ejecutar lint y build completos
cuando el cambio, el gate o un fallo lo justifique. Reportar resultados de forma
resumida.
