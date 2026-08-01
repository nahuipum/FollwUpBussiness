# QA Backend — BE-055

## Estado

`PASS`

## Revalidación SCA — snapshot `4a87466`

Revisión independiente del correctivo Netty. La propiedad gestionada
`netty.version` resuelve `netty-codec-compression` en `4.2.16.Final` a través
de AMQP, y la política impide regresar por debajo de ese mínimo.

| Riesgo | Evidencia | Resultado |
|---|---|---|
| Compresión Netty vulnerable | `DependencySecurityPolicyTest` | PASS: 6 pruebas, sin fallos ni errores |
| Resolución efectiva transitiva | `spring-rabbit → amqp-client → netty-codec → netty-codec-compression` | PASS: `4.2.16.Final` |

Comando ejecutado desde `backend/followupbussiness` con JDK 21 y repositorio
temporal fuera del proyecto:

```powershell
& 'C:\WorkSpace\apache-maven-3.9.6\bin\mvn.cmd' `
  "-Dmaven.repo.local=$env:TEMP\codex-be055-m2" `
  '-Dtest=DependencySecurityPolicyTest' test `
  '-Dincludes=io.netty:netty-codec-compression' dependency:tree
```

Resultado: `BUILD SUCCESS`; el árbol efectivo confirmó
`io.netty:netty-codec-compression:4.2.16.Final`. No se aportó ejecución CI
verificable adicional para este snapshot; la evidencia independiente anterior
fue reproducida localmente. `git diff --check`: PASS; no existe
`backend/followupbussiness/.m2`.

Retest independiente final del snapshot sin staged files. Maven con JDK 21,
PostgreSQL y RabbitMQ Testcontainers: 19 pruebas, 0 fallos, 0 errores y 0
omitidas. `git diff --check`: PASS.

| Criterio | Prueba/evidencia | Resultado |
|---|---|---|
| Confirm/return/mandatory y transición PUBLISHED solo tras ACK | `RabbitMqEventTransportTest` y `OutboxRabbitMqIntegrationTest` | PASS; ACK positivo permite publicar; NACK, timeout o return se tratan como fallo |
| Rollback, migración V3 y PostgreSQL fuente de verdad | `TransactionalOutboxMigrationTest` | PASS |
| Lease vencido en intento 8 y continuidad del lote | `expiredEighthAttemptTerminalizesAndDoesNotBlockFollowingReadyEvent` | PASS; termina la fila agotada y reclama la siguiente lista |
| Gauges con persistencia real | prueba de `OutboxConfiguration` contra `JdbcOutboxStore` | PASS; registra `outbox.backlog` y `outbox.oldest_pending_age_seconds` |
| Alertas operativas | `infrastructure/monitoring/alerts/fieldsales-outbox-alerts.yaml` | PASS por inspección: backlog, antigüedad, fallos y terminales |
| Arquitectura y límites de módulo | `HexagonalArchitectureTest`, `ModuleBoundaryTest` | PASS |

Comando ejecutado desde `backend/followupbussiness`:

```powershell
& 'C:\WorkSpace\apache-maven-3.9.6\bin\mvn.cmd' clean '-Dtest=FollowupbussinessApplicationTests,OutboxPublisherTest,RabbitMqEventTransportTest,TransactionalOutboxMigrationTest,OutboxRabbitMqIntegrationTest,HexagonalArchitectureTest,ModuleBoundaryTest' test
```

## Riesgo residual

La carga efectiva de reglas por Prometheus y la calibración operativa de los
defaults técnicos (backlog 100; antigüedad 300 s) no se ejecutaron. ADR-005 no
fija esos valores y no se infiere aprobación humana; son parámetros operativos
a validar durante el despliegue. La concurrencia real de dos workers queda para
integración posterior; el reclamo con lease está cubierto de forma dirigida.

`PASS`
