# Security Review — BE-055

## Estado

`PASS`

Snapshot: worktree sin archivos staged, posterior a la remediación final de
observabilidad contenida, al cierre de CVE-2026-59901 en Netty y al `PASS`
independiente de QA. El E2E Compose de QA agotó su límite de 364 segundos,
limpió los recursos exactos y se conserva como `NOT_EXECUTED`; se reutilizó el
E2E `PASS` de Desarrollo sobre el mismo snapshot.

## Superficie y modelo de abuso

Se revisaron outbox PostgreSQL, publisher RabbitMQ con confirms/returns/mandatory,
envelope multiempresa, lease/replay/retry, logs, métricas, alertas Prometheus,
secretos/configuración, migración V3, dependencias AMQP/Actuator/Prometheus,
Dockerfile y redes Compose. Activos: integridad y entrega de eventos,
aislamiento tenant, disponibilidad del backlog, métricas operativas y
credenciales. Los límites revisados son dominio → `OutboxStore` → PostgreSQL,
scheduler → `RabbitTemplate` → RabbitMQ y Micrometer → Prometheus dentro de la
red interna `observability`.

Los actores considerados fueron productores internos, workers concurrentes,
PostgreSQL, RabbitMQ, Prometheus, operadores del entorno y contenedores unidos a
redes no autorizadas. Los abusos revisados incluyeron tenant manipulado,
replay/duplicado, lease ajeno o vencido, mensaje venenoso, fuga por payload/log,
degradación silenciosa y acceso al endpoint de management desde host o desde la
red `infrastructure`.

## Hallazgos cerrados

| Hallazgo | Severidad previa | Evidencia de cierre |
|---|---:|---|
| `SEC-BE055-01` publicación silenciosamente perdida | High | `application.yaml` activa confirms correlacionados, returns y mandatory; `RabbitMqEventTransport` espera ACK y falla ante NACK, timeout o return. `OutboxPublisher` solo marca `PUBLISHED` tras retorno exitoso. La prueba de mensaje no enrutable demuestra que no queda publicado. |
| `SEC-BE055-02` configuración Spring no resolvible | High | `OutboxConfiguration` inyecta `OutboxStore`; QA ejecutó compilación limpia y contexto Spring. |
| `SEC-BE055-03` lease agotado bloquea lote | Medium | El reclamo excluye intento 8; las leases vencidas agotadas pasan a `TERMINAL` antes del lote. La prueba PostgreSQL prueba que la fila siguiente se reclama. |
| `SEC-BE055-04` observabilidad de backlog incompleta | Medium | Gauges `outbox.backlog` y `outbox.oldest_pending_age_seconds`; reglas Prometheus para backlog, antigüedad, fallos y terminales en `infrastructure/monitoring/alerts/fieldsales-outbox-alerts.yaml`. |
| `SEC-BE055-05` scrape Prometheus incompatible con binding loopback | Medium | ADR-018 contiene backend y Prometheus en `observability` (`internal: true`, `172.30.0.0/29`). Management escucha solo en `172.30.0.3`; Prometheus usa `172.30.0.2`, scrapea `backend:9091` y ninguno publica puerto al host. El E2E de Desarrollo comprobó target `UP`, serie `outbox_publish_failures_total`, regla cargada y rechazo de una sonda conectada solo a `infrastructure`. |
| `SEC-BE055-NETTY` denegación de servicio por CVE-2026-59901 | High | El BOM gestionado fija Netty `4.2.16.Final`, versión corregida de `netty-codec-compression`. QA verificó el árbol efectivo en `4.2.16.Final` y `DependencySecurityPolicyTest` en `PASS` con 6 pruebas y 0 fallos; todos los módulos Netty del classpath reciente resuelven uniformemente esa versión. No se encontró uso directo de `Bzip2Decoder` o bzip2 en código de aplicación. |

## Controles y evidencia

- `tenantId` no nulo y consistente entre cuerpo y headers; el lease token condiciona toda finalización.
- Reintento máximo de ocho, diagnóstico persistido saneado `PUBLISH_FAILURE`, y logs sin payload ni secretos.
- El registry Prometheus publica la serie real por el único endpoint Actuator expuesto; la excepción `permitAll` es exacta para `/actuator/prometheus` y el resto conserva deny-by-default.
- `docker-compose.yml` no publica `8080`, `9091` ni `9090`; backend y Prometheus comparten únicamente la red interna de observabilidad para el scrape. Backend también participa en `infrastructure`, pero management se liga exclusivamente a la IP de `observability`.
- `infrastructure/monitoring/verify-observability.ps1` comprueba target, serie, regla y sonda negativa, y elimina proyecto y volúmenes en `finally`.
- Credenciales obligatorias por variables de entorno; el E2E genera valores efímeros sin imprimirlos. El Dockerfile multistage copia al runtime solo el JAR y no incorpora el repositorio Maven del host.
- Migración aditiva, sin acceso a tablas de otros dominios. DLQ/reproceso avanzado sigue fuera de alcance de BE-055 y pertenece a BE-056.
- ADR-018 fue aceptado y declara que la topología Compose local no sustituye TLS, autenticación ni políticas de red productivas.
- Evidencia dirigida reutilizada: pruebas HTTP/serie Prometheus, contador por evento, matriz Security deny-by-default y límites modulares en `PASS`; `git diff --check` en `PASS` y cero directorios `.m2` bajo `backend`.
- Evidencia QA reutilizada para dependencias: `DependencySecurityPolicyTest` en
  `PASS` (6 pruebas, 0 fallos) y árbol Maven efectivo con
  `io.netty:netty-codec-compression:4.2.16.Final`. Los reportes Surefire antiguos
  que contienen `4.2.15.Final` son artefactos históricos anteriores al cambio,
  no la resolución efectiva del snapshot revisado.

## Controles no aplicables

No cambian geolocalización, almacenamiento local, WebSocket, Redis, archivos ni
APIs de negocio. BE-055 no incorpora productores ni consumidores de eventos;
DLQ y reproceso operativo permanecen en BE-056.

## Riesgo residual

`NOT_EXECUTED` por Seguridad: repetición del E2E Compose, SCA/SBOM, escaneo y pin
por digest de imágenes, calibración/semántica temporal de alertas, concurrencia
real con dos workers y rollback productivo de migración. El E2E de QA también se
mantiene `NOT_EXECUTED` por timeout; no contradice el E2E `PASS` de Desarrollo
del mismo snapshot.

Riesgos Low: el contenedor backend usa el usuario predeterminado y aún no aplica
`read_only`, `cap_drop` o `no-new-privileges`; la subnet estática puede colisionar
con una red local/VPN; `OUTBOX_ENABLED=false` exige control operativo porque
desactiva publisher y series; las variables Compose no sustituyen un gestor de
secretos productivo. El comparador de la política de dependencias elimina los
calificadores de versión, por lo que una versión hipotética `4.2.16.Alpha` o
`4.2.16.RC` podría compararse como equivalente a `Final`; no bloquea este cierre
porque el POM y el classpath efectivo usan exactamente `4.2.16.Final`, pero debe
endurecerse con comparación Maven o validación explícita de releases finales. Un
despliegue fuera de Compose debe conservar la restricción de red de ADR-018,
añadir TLS/autenticación según su modelo y pasar nueva revisión de Seguridad.

Los productores futuros deben derivar `tenantId` del contexto autorizado,
validar tipo/esquema y limitar payload; los consumidores deduplican por
`eventId`. Un timeout de confirmación puede causar duplicado, coherente con la
garantía al menos una vez.

No quedan hallazgos Critical, High o Medium abiertos.
