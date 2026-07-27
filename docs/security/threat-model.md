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
