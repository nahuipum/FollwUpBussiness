# Revisión de Ciberseguridad — EN-015

## Estado

`PASS`

Revisión independiente posterior a QA `PASS`. La revisión aplica por cifrado,
sesión, aislamiento multiempresa, datos personales y geolocalización.

## Superficie y hallazgos

| Superficie | Evidencia | Resultado |
|---|---|---|
| Cifrado y claves | ADR-015 fija SQLCipher, clave por instalación/ámbito y Keychain/Keystore; no deriva la clave de password | PASS documental |
| Tenant/usuario y sesión | `tenantId` + `ownerUserId` obligatorios; logout/cambio de ámbito destruyen clave y datos; token vencido pausa y revocado cierra | PASS |
| Tokens, PII y coordenadas | Envelope no incluye token; logs/telemetría excluyen tokens, documentos, payloads y coordenadas completas | PASS |
| Replay/manipulación | UUID e idempotencyKey estables, deduplicación por repetición y servidor como autoridad; conflicto bloquea reintento | PASS |
| Recuperación de cola | `syncing` sin acuse vuelve a `pending`; no se marca `synced` sin confirmación | PASS |
| Migraciones/reinstalación/borrado | Migraciones forward-only; reinstalación/logout destruyen clave y ámbito; pendientes no se descartan silenciosamente | PASS |

No se encontraron hallazgos `CHANGES_REQUIRED` en el alcance documental.

## Riesgo residual aceptado como pendiente de implementación

Antes de liberar código real deben probarse en dispositivo la configuración
SQLCipher/secure storage, borrado seguro de la clave, recuperación ante crash,
protección frente a extracción del dispositivo y los endpoints de resolución de
conflictos. Es un requisito de implementación posterior, no una aprobación de
esas pruebas.

## Recomendación

Mantener bloqueada la implementación productiva hasta que INT-015/INT-018
publiquen contratos backend compatibles y se ejecuten pruebas de abuso,
aislamiento, replay y almacenamiento lleno. Para EN-015 documental, el control
es suficiente.

`PASS`
