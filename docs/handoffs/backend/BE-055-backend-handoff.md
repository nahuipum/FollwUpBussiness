# Backend Handoff — BE-055

## Estado

READY_FOR_HANDOFF — Correcciones de observabilidad y contención Docker aplicadas
tras hallazgos de QA/Seguridad; sin commit. Snapshot: worktree con cambios
Backend BE-055 sin staged files. Se preservaron cambios ajenos en
`docs/architecture/adr/ADR-005-rabbitmq-asincronia.md`,
`docs/events/README.md`, `docs/handoffs/governance/BE-055-phase0-ready.md` y
`backend/followupbussiness/.m2/`.

La dependencia de infraestructura está documentada como lista en
`docs/handoffs/governance/BE-055-phase0-ready.md`; ADR-005 está aceptado.

## Alcance implementado

- Módulo hexagonal `outbox`, sin productores de eventos de negocio.
- Persistencia PostgreSQL como fuente de verdad, reclamo concurrente con
  `FOR UPDATE SKIP LOCKED`, lease por token y recuperación del lease vencido.
- Estados `PENDING`, `CLAIMED`, `PUBLISHED`, `RETRY_SCHEDULED` y `TERMINAL`;
  máximo de ocho intentos, backoff exponencial con jitter y retención de
  evidencia PUBLISHED/TERMINAL de 30 días.
- Publicación RabbitMQ al menos una vez, con `eventId` estable y envelope
  versionado; vhost `followupbussiness`, `RabbitAdmin` y exchange durable
  `followupbussiness.events` declarados antes de publicar; métricas y logs saneados
  con IDs técnicos/correlationId.
- El diagnóstico persistido usa `PUBLISH_FAILURE`; nunca conserva el mensaje
  crudo de una excepción de transporte.
- Publisher confirms correlacionados, returns y `mandatory` están activos; una
  fila solo pasa a PUBLISHED tras confirmación positiva. NACK, timeout o retorno
  se procesan como fallo reintentable.
- Métricas: gauges `outbox.backlog` y `outbox.oldest_pending_age_seconds`;
  alertar backlog sostenido, antigüedad pendiente alta, fallos de publicación y
  filas terminales.
- Cada fallo de transporte manejado por evento (incluidos broker caído, NACK,
  timeout o return traducidos por el transporte) se contabiliza en
  `outbox.publish.failures`; el scheduler incrementa ese contador por el total
  del lote, que Prometheus expone como `outbox_publish_failures_total` y usa la
  alerta `FollowUpBussinessOutboxPublishFailures`.
- Exportación Prometheus operativa: el registry expone métricas en el puerto de
  management no se publica al host. Compose ejecuta backend y Prometheus en la
  red interna `observability`; Prometheus scrapea `backend:9091` por nombre de
  servicio y carga las reglas outbox. Fuera de Compose, management conserva el
  valor loopback por defecto.
- El management Docker escucha exclusivamente en `172.30.0.3` de la red
  `observability`; Prometheus usa `172.30.0.2`. Una sonda unida solo a
  `infrastructure` recibe rechazo de conexión a `backend:9091`.
- El wiring de outbox queda activo con el datasource real y registra sus
  contadores desde el arranque; los contextos de pruebas sin datasource lo
  deshabilitan explícitamente con `followupbussiness.outbox.enabled=false`.
- SCA: el BOM gestionado fija Netty `4.2.16.Final`, corrigiendo
  CVE-2026-59901 en `netty-codec-compression` transitivo de AMQP; la política
  de dependencias bloquea el mínimo seguro.
- Un lease vencido en el intento 8 pasa a `TERMINAL` antes del reclamo; no se
  incrementa fuera del `CHECK` ni bloquea el lote restante.
- BE-056 conserva DLQ, reproceso y operación avanzada.

## Archivos y migración

| Ruta | Cambio |
|---|---|
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/outbox/` | Dominio, puertos, publicador, adaptadores JDBC/RabbitMQ/scheduler y configuración |
| `backend/followupbussiness/src/main/resources/db/migration/V3__create_transactional_outbox.sql` | Tabla, checks de estado, índices de claim/lease/retención |
| `backend/followupbussiness/pom.xml` | AMQP, Actuator/Micrometer y registry Prometheus |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/security/DependencySecurityPolicyTest.java` | Política de mínimo seguro para Netty compression |
| `backend/followupbussiness/src/main/resources/application.yaml` | Propiedades RabbitMQ/outbox, flag técnico y management configurable |
| `backend/followupbussiness/Dockerfile` | Imagen Java 21 multistage sin repositorio Maven del host |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/config/SecurityConfiguration.java` | Deny-by-default; excepción única para Prometheus en el puerto técnico |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/outbox/` | Pruebas de publicador, envelope, migración/JDBC y RabbitMQ limpio |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/config/PrometheusMetricsEndpointTest.java` | Scrape HTTP de `outbox_publish_failures_total` por el endpoint técnico |
| `infrastructure/monitoring/alerts/followupbussiness-outbox-alerts.yaml` | Reglas Prometheus versionadas para backlog, edad, fallos y terminales |
| `infrastructure/monitoring/prometheus/prometheus.yml`, `docker-compose.yml` | Backend/Prometheus contenidos, red interna y scrape por nombre de servicio sin puertos publicados |
| `infrastructure/monitoring/verify-observability.ps1` | E2E aislada: target, serie, regla y sonda negativa desde `infrastructure` |
| `docs/architecture/adr/ADR-018-observabilidad-contenida.md` | Decisión humana de contención Docker de SEC-BE055-05 |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/architecture/ModuleBoundaryTest.java` | Registro de `outbox` como módulo |

## Contratos

No se crea endpoint ni evento de negocio. Se añade únicamente la superficie
técnica `GET /actuator/prometheus`, limitada a métricas no sensibles, expuesta
solo en la red interna Compose conforme ADR-010 y ADR-018. Se consume el envelope existente de
`docs/events/README.md`: `eventId`, `eventType`, `version`, `occurredAt`,
`tenantId`, `correlationId`, `causationId` y payload. La decisión aplicable es
`docs/architecture/adr/ADR-005-rabbitmq-asincronia.md`; ADR-018 documenta el
despliegue de observabilidad aprobado.

## Matriz de criterios

| Criterio | Evidencia | Estado |
|---|---|---|
| Commit crea outbox | `OutboxStore.append` JDBC y prueba transaccional de migración | PASS con PostgreSQL Testcontainers |
| Rollback no publica | `TransactionalOutboxMigrationTest.appendingInsideRolledBackTransactionLeavesNoOutboxEvent` | PASS con PostgreSQL Testcontainers |
| Publicador idempotente | `eventId` estable, claim con lease token, actualización condicional y pruebas de publicación/retry/terminal | PASS |
| Errores observables | Logs sin payload, correlationId, counters `outbox.*`, estado/diagnóstico constante; pruebas de scheduler/Prometheus y E2E Compose | PASS; dos fallos de transporte incrementan el counter; E2E confirma target `UP`, serie, regla y rechazo desde red no autorizada |
| Broker limpio | vhost `followupbussiness`, exchange durable y publicación a queue enlazada | PASS con RabbitMQ Testcontainers |

## Comandos y resultados

| Comando | Resultado |
|---|---|
| Maven con JDK 21: `-Dtest=OutboxPublisherTest,RabbitMqEventTransportTest,HexagonalArchitectureTest,ModuleBoundaryTest test` | PASS: 8 pruebas dirigidas; publicador, envelope y arquitectura |
| Maven con JDK 21 y repo temporal `C:\tmp\be055-maven-repo`: `-Dtest=OutboxPublisherTest,OutboxPublishingSchedulerTest,ModuleBoundaryTest test` | PASS: 6 pruebas; dos fallos por evento incrementan el contador que alimenta `outbox_publish_failures_total` y se conserva el límite modular |
| Maven con JDK 21 y repo temporal `C:\tmp\be055-maven-repo`: `-Dtest=PrometheusMetricsEndpointTest,OutboxPublishingSchedulerTest,SecurityConfigurationTest test` | PASS: 31 pruebas; endpoint Prometheus separado, serie outbox y matriz deny-by-default |
| Maven con JDK 21 y repo temporal `C:\tmp\be055-maven-repo`: `-Dtest=FollowupbussinessApplicationTests,PrometheusMetricsEndpointTest,OutboxPublishingSchedulerTest,SecurityConfigurationTest,ModuleBoundaryTest test` | PASS: 34 pruebas; contexto sin datasource, límites, endpoint y seguridad |
| Maven con JDK 21 y repo temporal `C:\tmp\be055-maven-repo`: `-Dtest=PrometheusMetricsEndpointTest,SecurityConfigurationTest,OutboxPublishingSchedulerTest,ModuleBoundaryTest test` | PASS: 32 pruebas; exposición técnica, seguridad, fallos por evento y límites |
| Maven con JDK 21 y repo temporal `C:\tmp\be055-maven-repo`: `-Dtest=DependencySecurityPolicyTest test` | PASS: 6 pruebas; Tomcat, pgJDBC, Jackson y Netty compression cumplen mínimos |
| Maven con JDK 21 y repo temporal `C:\tmp\be055-maven-repo`: `-Dincludes=io.netty:netty-codec-compression dependency:tree` | PASS: resolución efectiva `io.netty:netty-codec-compression:4.2.16.Final` |
| `docker compose -f docker-compose.yml config -q` con credenciales de validación efímeras | PASS (exit 0); servicios, mounts de reglas y scrape config válidos |
| E2E Compose aislada | PASS: target `UP`, serie y regla presentes; puertos `8080/9091` no publicados y sonda solo en `infrastructure` rechazada; recursos temporales eliminados |
| Maven con JDK 21: `clean -Dtest=FollowupbussinessApplicationTests,OutboxPublisherTest,RabbitMqEventTransportTest,TransactionalOutboxMigrationTest,OutboxRabbitMqIntegrationTest,HexagonalArchitectureTest,ModuleBoundaryTest test` | PASS: 17 pruebas; compilación limpia JDK 21, contexto Spring, PostgreSQL y RabbitMQ Testcontainers |
| `git diff --check` | PASS |
| `python -m graphify update .` | PASS; grafo actualizado |

## Riesgos y reproducción

- Los productores futuros deben invocar `OutboxStore.append` dentro de la misma
  transacción de negocio; este alcance no inventa eventos ni los produce.
- RabbitMQ debe estar disponible según Fase 0 y las credenciales se suministran
  mediante variables `RABBITMQ_*`, sin secretos en repositorio. Para comprobar
  alertas locales ejecutar `infrastructure/monitoring/verify-observability.ps1`;
  crea y elimina un proyecto Compose aislado. En un despliegue no local, la red
  equivalente debe conservar el aislamiento de ADR-018 y revisarse con
  Seguridad.

Con Docker/infraestructura Fase 0 activos, desde `backend/followupbussiness`:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
& 'C:\WorkSpace\apache-maven-3.9.6\bin\mvn.cmd' `
  '-Dtest=OutboxPublisherTest,RabbitMqEventTransportTest,TransactionalOutboxMigrationTest,OutboxRabbitMqIntegrationTest,HexagonalArchitectureTest,ModuleBoundaryTest' test
```

## Siguiente QA

Revisar el diff objetivo y ejecutar la suite dirigida anterior solo si cambia.
Validar rollback, exclusión de lease ajeno, recuperación del lease vencido,
límites retry/terminal, aislamiento tenant en filas y headers/envelope RabbitMQ.
