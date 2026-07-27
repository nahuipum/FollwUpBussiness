# Contrato de sincronización

## visit.check-in

Requiere sesión, jornada, cliente autorizado, ubicación reciente y ausencia de otra visita activa.

## visit.check-out

Requiere visita activa, resultado obligatorio y comentarios cuando la regla lo exija.

## sale.create

Requiere cliente, visita por defecto, importes válidos y productos activos cuando exista catálogo.

## Resolución

- Duplicado: devolver referencia existente.
- Estado incompatible: `conflict`.
- Regla definitivamente inválida: `permanent_error`.
- Fallo técnico temporal: `retryable_error`.
