# Sincronización Mobile

**Estado actual:** `CHANGES_REQUIRED`. Este documento define el envelope y los
estados, pero cada comando debe cerrar payload, dependencias causales,
respuestas, conflictos y compatibilidad de versión según EN-015.

## Comando local

```json
{
  "clientGeneratedId": "uuid",
  "deviceId": "uuid",
  "schemaVersion": 1,
  "commandType": "visit.check-in",
  "createdAtDevice": "date-time",
  "timezone": "America/Lima",
  "payload": {}
}
```

## Estados

- pending
- syncing
- synced
- retryable_error
- permanent_error
- conflict

## Reglas

- No eliminar antes de confirmación.
- Reintentos con backoff.
- Un UUID no crea duplicados.
- Preservar fecha original y registrar fecha servidor.
- Ordenar comandos dependientes.
- Segregar por usuario y empresa.
