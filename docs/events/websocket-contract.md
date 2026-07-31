# Contrato WebSocket `tracking/v1`

## Canal lógico

`/company/{companyId}/tracking`

Conocer el identificador no autoriza la suscripción. El servidor deriva tenant e
identidad de la sesión y valida cada recurso: `COMPANY_ADMIN` puede suscribirse
a vendedores de su tenant; `SUPERVISOR`, solo a su equipo vigente. `companyId` o
un filtro `sellerId` nunca amplían autoridad. Suscripción no autorizada falla
cerrada sin snapshot ni mensajes parciales.

## Mensajes

- `seller.location.updated`
- `seller.status.changed`
- `visit.status.changed`

## Envelope tipable

Todo `seller.location.updated` usa este esquema estable:

```json
{
  "messageId": "uuid",
  "type": "seller.location.updated",
  "version": 1,
  "occurredAt": "date-time",
  "tenantId": "uuid",
  "correlationId": "uuid",
  "resourceVersion": 12,
  "sequence": 45,
  "payload": {
    "sellerId": "uuid",
    "journeyId": "uuid",
    "capturedAt": "date-time",
    "receivedAt": "date-time",
    "location": { "latitude": -12.0, "longitude": -77.0 },
    "accuracyMeters": 20,
    "integrityStatus": "DECLARED_NOT_MOCKED",
    "stale": false
  }
}
```

Campos obligatorios: todos los del ejemplo. `messageId`, `tenantId`,
`correlationId`, `sellerId` y `journeyId` son UUID; `version` es `1`;
`resourceVersion` y `sequence` son enteros positivos. `location` usa WGS84,
`accuracyMeters` está entre 0 y 50, `integrityStatus` es
`DECLARED_NOT_MOCKED|UNKNOWN` y los timestamps son ISO 8601.

Solo se publica una muestra aceptada de jornada activa, no vencida y con
antigüedad de captura <=5 min al recibirla. `stale` lo calcula el servidor y el
cliente no lo sobreescribe. EN-016 no fija su umbral: el contrato de presencia
de BE-030 debe definirlo y revisarlo con FE-020/QA antes de implementar. Una
muestra inválida o estado técnico degradado no usa este tipo, no lleva
coordenadas y no crea historial de ubicación.

## Reglas

- Heartbeat.
- Reconexión exponencial.
- Snapshot REST al reconectar.
- La autorización se revalida fail-closed antes de cada publicación y snapshot,
  y al recibir señales de logout, revocación/expiración de sesión, cambio de
  rol, equipo, tenant o recurso, cierre administrativo de jornada o suspensión
  de empresa/usuario. La pérdida de cualquiera cierra inmediatamente la
  suscripción afectada y cancela mensajes en carrera todavía no entregados.
- Un contexto revocado no puede reconectar, re-suscribirse ni obtener snapshot.
  El cierre es observable mediante `reasonCode` sanitizado
  `TRACKING_SESSION_REVOKED`, `TRACKING_AUTHORIZATION_REVOKED` o
  `TRACKING_JOURNEY_CLOSED`, sin coordenadas. FE-020 elimina estado/cache del
  recurso y solo reintenta tras una nueva sesión y autorización completas.
- Orden por `tenantId + sellerId + journeyId`: `sequence` crece estrictamente;
  `resourceVersion` identifica la versión de presencia del vendedor.
- `messageId` repetido se ignora. Un `sequence` menor o igual al último aplicado
  no sustituye estado; un salto obliga a pausar actualizaciones de ese recurso y
  recuperar snapshot REST antes de continuar.
- Un cambio incompatible requiere `version: 2` y revisión coordinada de
  productor, FE-020, QA y Seguridad.
- No existe suscripción cruzada entre empresas.
