# Confirmación técnica Mobile — EN-015 para Fase 0 de EN-017

## Estado

`PASS` — consumibilidad técnica Mobile.

Esta es una revisión independiente de consumibilidad Flutter. No aprueba la
gobernanza de EN-015, ADR-015 ni `mobile-sync/v1`; tampoco inicia EN-017.

## Snapshot revisado

- `docs/stories/enablers/EN-015-definir-persistencia-local-y-sincronizacion.md`
- `docs/architecture/adr/ADR-015-persistencia-local-sincronizacion-mobile.md`
- `docs/sync/mobile-sync-contract.md`
- handoffs QA/DoF EN-015 y
  `docs/handoffs/governance/EN-017-phase0-dependency-validation.md`
- `mobile/followupbussiness/`: scaffold Flutter sin persistencia, secure
  storage, sincronización, cola ni tracking implementados.

El único cambio ajeno encontrado fue el handoff no rastreado de Fase 0 de
EN-017. No se modificó código, contrato ni ADR.

## Consumibilidad Flutter confirmada

El diseño es implementable en Flutter mediante Drift/SQLite con SQLCipher,
clave aleatoria en Keychain/Keystore y repositorios siempre acotados por
`tenantId + ownerUserId`. El envelope permite una cola durable con UUID e
`idempotencyKey` estables, recuperación `syncing -> pending`, FIFO por
agregado, dependencias, confirmación del servidor antes de `synced`, conflicto
explícito y conservación de fecha, zona horaria y coordenada originales.

El contrato es transporte-neutral y no presupone rutas REST inexistentes. Para
ubicación, ADR-016 conserva la cola cifrada y segregada, restringe tracking a
jornada activa y exige detenerlo al logout; por tanto no introduce una
incompatibilidad con `mobile-sync/v1` de visitas/ventas.

## Revalidación del ciclo de vida

La contradicción previamente señalada queda resuelta por el cambio limitado de
ADR-016. Su sección final de dependencias ahora homologa el flujo a ADR-015 y
precisa que la limpieza exige una **disposición autorizada y trazable** del
pendiente; si no concluye, el ámbito permanece bloqueado y seguro, sin captura
ni acceso. Además, conserva expresamente la prohibición de descarte silencioso.

Así, Flutter puede conservar la cola cifrada mientras el flujo autorizado no
termine y destruir la clave/datos solo tras esa disposición. Esto es compatible
con ADR-015, con `mobile-sync/v1` y con la conservación de visitas, ventas y
datos originales. No se detecta contradicción material restante en logout,
cambio de tenant/usuario, reinstalación o almacenamiento agotado.

## Evidencia y verificación

- Consulta de arquitectura: `python -m graphify query "How are mobile local
  persistence and synchronization implemented?" --budget 800`; confirmó solo
  el contexto/instrucciones Mobile, sin símbolos de implementación.
- Inspección de `pubspec.yaml` y `lib/`: no hay dependencias ni capas Drift,
  SQLCipher, secure storage, cola o sync existentes; no hay conflicto de código
  que resolver.
- `git diff --check`: PASS en la revisión inicial; esta revalidación solo
  inspecciona el delta documental de ADR-016 y no repite suites por instrucción.

## Flujo online/offline verificable

1. Con sesión de `tenantId/ownerUserId`, crear una visita o venta offline y
   persistirla como `pending`.
2. Sin conectividad, ejecutar logout o cambio de tenant/usuario: detener
   tracking, invalidar contexto y bloquear el ámbito conservando la cola
   cifrada; no hay acceso ni captura hasta terminar el flujo autorizado.
3. Cuando la sincronización recibe acuse o la exportación/resolución autorizada
   deja disposición trazable, limpiar claves/datos del ámbito.
4. Verificar que el comando conserva UUID/idempotency, timestamps y coordenadas
   originales hasta su disposición; no marcar `synced` sin acuse.

## Riesgos y siguiente gate

La integración real de SQLCipher/Drift, Keychain/Keystore, limpieza verificable
de claves, crash recovery, almacenamiento lleno y endpoints INT-015/INT-018
permanece para historias implementadoras y pruebas de dispositivo. Permanece
además el bloqueo de gobernanza de Fase 0: ADR-015 y `mobile-sync/v1` conservan
estado `Propuesto`; esta revisión no lo aprueba ni lo sustituye con un mock.

`PASS` para consumibilidad técnica Mobile; no es aprobación de gobernanza.
