# ADR-015 — Persistencia local y sincronización móvil
**Estado:** Propuesto para revisión independiente
**Fecha:** 2026-07-31

## Relación con ADR-016

ADR-016 es la autoridad de privacidad, frecuencia, validez, acceso y retención
de ubicaciones. Este ADR solo define persistencia local y confirmación: la cola
de ubicación permanece cifrada y segregada hasta confirmación o resolución
autorizada, no conserva muestras inválidas según ADR-016 ni sustituye la purga
física remota de 90 días. No duplica ni modifica dicha política.

## Contexto

EN-015 necesita una base local durable para operación offline-first. Las visitas,
ventas y comandos pendientes no pueden perderse por cierre forzoso. EN-010 fija
que la seguridad HTTP aún no habilita endpoints de negocio; EN-013 fija el
canal MOBILE con refresh opaco en secure storage, pero no implementa endpoints.
Este ADR define la frontera documental para Mobile, Backend y QA, sin crear
funciones productivas ni asumir rutas backend.

## Decisión

- **Motor:** Drift sobre SQLite como acceso tipado y migraciones versionadas.
  El cifrado de la base se realizará con SQLCipher en la integración móvil
  aprobada; la clave no se guarda en SQLite, preferencias ni logs.
- **Clave:** una clave aleatoria por instalación y ámbito de sesión, protegida
  por Keychain (iOS) / Android Keystore. El acceso a la base requiere el
  contexto activo `tenantId` + `userId`; la clave no se deriva de la contraseña.
  Si el secure storage no está disponible, se bloquea la escritura sensible.
- **Migraciones:** forward-only, transaccionales, con `schemaVersion`; nunca se
  elimina una columna con datos sin una migración explícita y retención definida.
  Una migración fallida conserva la base anterior y deja la app en modo seguro.
- **Segregación:** `tenantId` y `ownerUserId` son obligatorios en entidades,
  caché y cola durable. Todas las lecturas/escrituras incluyen ambos campos y
  las consultas se rechazan sin contexto coincidente. El cambio de tenant o
  usuario invalida el contexto y limpia datos/cache/cola del ámbito anterior.
- **Cola:** cada comando tiene `clientGeneratedId` UUID estable, `idempotencyKey`
  estable, `correlationId`, `causationId`, `sequenceNumber` por agregado,
  `createdAtDevice`, `timezone` y payload inmutable. El UUID nunca se regenera
  al reintentar.
- **Estados:** `pending -> syncing -> synced | error | conflict`. `error` se
  clasifica como transitorio o definitivo; un dato solo pasa a `synced` después
  de la confirmación del servidor. `conflict` y error definitivo bloquean el
  reintento automático hasta resolución explícita.
- **Cierre forzoso:** antes de enviar se persiste `syncing`. Al iniciar, todo
  `syncing` sin acuse de servidor vuelve a `pending`, conserva el intento y se
  reenvía con la misma idempotencia. La respuesta desconocida nunca se marca
  como `synced`.
- **Orden:** se procesa FIFO por `tenantId + ownerUserId + aggregateType +
  aggregateId`; las dependencias declaradas deben estar confirmadas antes del
  comando dependiente. Agregados distintos pueden concurrir con límite de
  workers; un mismo agregado no. El servidor conserva la autoridad final.
- **Tiempo y ubicación:** se conservan `createdAtDevice`, `timezone`, fecha/hora
  de negocio y coordenadas originales con su precisión; se añade la fecha de
  recepción/confirmación del servidor sin sustituir el valor original. El
  servidor valida geocerca.
- **Reintentos:** solo errores de red, timeout, 5xx y rate limit elegible se
  reintentan con backoff exponencial acotado y jitter, máximo 8 intentos. 4xx de
  regla, autenticación revocada, esquema incompatible y conflictos no se
  reintentan automáticamente. Agotado el máximo: `error` definitivo, alerta
  operativa y acción manual sin borrar el comando.
- **Conflictos:** el servidor responde `conflict` con código estable, versión
  remota y referencia segura; no se aplica merge silencioso. Se congela el
  agregado, se muestra resolución y el nuevo comando de resolución obtiene UUID
  e idempotencyKey propios. No se registran payloads completos.
- **Sesión y ciclo de vida:** token vencido pausa la cola y solicita refresh por
  el contrato EN-013; token revocado cierra el ámbito y requiere login. Logout,
  cambio de tenant/usuario y reinstalación destruyen claves y datos locales del
  ámbito; antes de limpiar se ofrece sincronizar o exportar solo por flujo
  autorizado. Si no hay almacenamiento, se conserva lo ya escrito, se detiene
  la captura sensible y se informa al usuario; no se descarta silenciosamente.
- **Retención:** cache descargable puede podarse por política y espacio; visitas,
  ventas, auditoría local mínima y comandos no confirmados se conservan hasta
  confirmación o resolución. No se hace borrado físico de historial de negocio.
- **Privacidad/observabilidad:** nunca se registran tokens, documentos ni
  coordenadas completas. Logs y métricas usan IDs técnicos truncados/hasheados,
  `correlationId`, operación, resultado y tipo de error. La telemetría no lleva
  payload ni ubicación precisa.
- **Evolución:** el contrato es `mobile-sync/v1`; cambios aditivos son
  compatibles. Un cambio incompatible requiere nueva versión, adaptador de
  lectura/escritura y plan de migración coordinado antes de activar productores.

## Alternativas descartadas

- SharedPreferences/JSON: no ofrece transacciones, consultas ni cola durable
  suficientes para visitas y ventas.
- Hive/almacenamiento no relacional sin cifrado y migración acordados: dificulta
  invariantes, orden causal y auditoría de comandos.
- Borrar la cola al logout o reinstalación sin tratamiento: puede perder ventas
  o visitas pendientes y rompe la trazabilidad.
- Marcar `synced` al enviar: confunde aceptación local con confirmación del
  servidor y permite pérdida ante cierre o respuesta desconocida.

## Consecuencias

La implementación futura requiere una integración SQLCipher/Drift, secure
storage nativo, migraciones y pruebas de reinicio, concurrencia, aislamiento,
reintento y contrato. El backend deberá publicar respuestas compatibles con
`docs/sync/mobile-sync-contract.md` antes de habilitar productores reales.

## Riesgos y pendientes

- El backend aún no implementa endpoints de negocio; sus rutas, códigos y
  payloads de respuesta quedan pendientes de las historias INT-015/INT-018.
- La disponibilidad/licencia de la integración SQLCipher debe validarse antes
  de añadir dependencias al proyecto Flutter.
- La resolución UX de conflictos y la política concreta de retención requieren
  decisión de producto; este ADR fija el comportamiento seguro por defecto.

## Reversión

No se revierte eliminando datos ni migraciones aplicadas. Se desactiva la
sincronización por flag, se conserva la cola durable y se publica una migración
compatible/adaptador. Retirar el motor solo después de exportar y migrar los
datos pendientes con evidencia de integridad.
