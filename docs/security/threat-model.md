# Threat Model inicial

## Activos

Credenciales, sesiones, ubicación, recorridos, clientes, ventas, rutas, archivos, auditoría y secretos.

## Amenazas STRIDE

- Suplantación de usuario o ubicación.
- Manipulación de tenant, ventas o coordenadas.
- Acciones no auditadas.
- Fuga por API, cache, WebSocket, cola o logs.
- Flood de ubicación, importación o WebSocket.
- Escalamiento de privilegios.

## Controles

Autorización por recurso, tenant derivado de sesión, rate limits, idempotencia, cifrado, auditoría, retención, SAST, SCA, DAST y gestión de secretos.

Para ubicación, ADR-016 añade: captura solo en jornada activa cada 60 s;
validación servidor de precisión <=50 m y antigüedad <=5 min; rechazo sin
persistencia/cache/WebSocket/geocerca; telemetría degradada sin coordenadas;
Redis <=15 min e historial exacto con purga física a 90 días. Deben probarse
abuso de filtros de vendedor/equipo, soporte excepcional, logout/revocación,
cola offline y restauración de backups con datos vencidos.

Controles adicionales D9-D12: tolerancia futura de 2 min y vencimiento anclado
a `min(capturedAt, receivedAt)`; una aceptación por ventana de 60 s y presupuesto
multi-device; rechazo de `mocked=true` y estado `UNKNOWN`; binding de
idempotencia de lote al contexto/dispositivo/conjunto ordenado; reautorización
WS inmediata; crypto-erasure, exclusión de backup móvil, cuarentena de restore y
limpieza/compactación local. QA debe cubrir carreras, replay, flood, reloj,
mocking, revocación y recuperación de copias sin registrar coordenadas.
