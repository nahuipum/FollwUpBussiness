# EN-005 — Configurar Docker Compose con PostGIS, Redis y RabbitMQ

**Tipo:** Enabler técnico

**Estado de desarrollo:** READY_FOR_HANDOFF

## Objetivo

Proporcionar un entorno local mínimo y reproducible con PostgreSQL/PostGIS,
Redis y RabbitMQ. EN-005 no implementa integraciones funcionales con backend,
frontend o mobile.

La definición aprobada en el prompt de EN-005 es la fuente de verdad del
enabler. No depende de que el identificador aparezca en el contrato funcional.

## Alcance implementado

- `docker-compose.yml` en la raíz del repositorio.
- PostgreSQL 17 con PostGIS 3.5.
- Redis 7.4.10 sin persistencia.
- RabbitMQ 4.2.9 con Management.
- Health checks para los tres servicios.
- Red bridge dedicada y volúmenes nombrados donde corresponde.
- Variables locales documentadas mediante `.env.example`.
- Guía reproducible en `infrastructure/README.md`.

## Matriz de aceptación

| Criterio | Evidencia prevista |
|---|---|
| Evidencia reproducible | Comandos y resultados de la sección siguiente |
| Configuración documentada | `infrastructure/README.md` |
| Validaciones aplicables pasan | `docker compose config`, health checks y comprobaciones individuales |

## Evidencia de desarrollo

| Validación | Resultado |
|---|---|
| `docker --version` | PASS — cliente y servidor 27.4.0 |
| `docker compose version` | PASS — v2.31.0-desktop.2 |
| Plataforma de contenedores | PASS — Linux `x86_64` sobre Docker Desktop para Windows |
| Variables obligatorias | PASS — sin `.env`, Compose falla por ausencia de `POSTGRES_PASSWORD` con código 15 |
| `.env` local excluido | PASS — `git check-ignore` resuelve la regla `**/.env` |
| `docker compose config --quiet` | PASS — código 0 |
| Servicios resueltos | PASS — únicamente `postgres`, `rabbitmq` y `redis` |
| `docker compose pull` | PASS — tres imágenes descargadas |
| Arranque y health checks | PASS — tres contenedores `healthy` |
| PostgreSQL | PASS — `pg_isready` devolvió `accepting connections` |
| `SELECT PostGIS_Version()` | PASS — `3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1` |
| Extensiones iniciales | PASS — `postgis 3.5.2` y `pgcrypto 1.3` |
| Redis `PING` | PASS — `PONG`, también después de `docker compose restart redis` |
| Persistencia Redis | PASS — `save` vacío y `appendonly no`; no existe volumen Redis |
| RabbitMQ | PASS — `rabbitmq-diagnostics -q ping` devolvió `Ping succeeded` |
| RabbitMQ `vhost` | PASS — `fieldsales` |
| AMQP | PASS — listener 5672 y conexión TCP desde `127.0.0.1` |
| RabbitMQ Management | PASS — listener 15672 y HTTP 200 autenticado; versión 4.2.9 |
| Puertos del host | PASS — únicamente 5432, 6379, 5672 y 15672 ligados a `127.0.0.1` |
| Usuarios de procesos | PASS — PostgreSQL UID 999, Redis UID 999 y RabbitMQ `_rpc`; ninguno root |
| Revisión de logs | PASS — sin coincidencias de error, fatal, panic, exception o permission denied |
| `docker compose down` | PASS — sin contenedores al finalizar; volúmenes PostgreSQL y RabbitMQ conservados |

Digests resueltos durante la prueba:

```text
postgis/postgis@sha256:77e89c11c4779c394ebeeaac1099dafb77b728abc8cd45dcaf6c4695503a0c37
redis@sha256:e7723ff73d963f5cc6d9c4643ea3d989527a402a319239054e9472a7fb9219a2
rabbitmq@sha256:70f261eb51c4dc58eb79a3c9d9ff0f3b5dad5c76762483329a5758f3f1f053ab
```

Durante la primera ejecución se comprobó que `internal: true` impedía activar
los bindings publicados en Docker Desktop: los cuatro intentos TCP devolvieron
`False`. Se cambió a una red bridge dedicada y se repitió la validación. Los
cuatro puertos devolvieron `True` y permanecieron ligados exclusivamente a
loopback.

La validación cubre Windows con contenedores Linux `x86_64`. La ejecución en
macOS, Linux nativo y equipos ARM queda como validación de compatibilidad
posterior; los comandos reproducibles son los documentados en
`infrastructure/README.md`.

## Fuera del alcance

No incluye contenedores ni Dockerfiles de las aplicaciones, integración con
Spring Boot, migraciones o tablas de negocio, topología funcional de RabbitMQ,
datos de negocio, Kubernetes, Helm, Terraform, CI/CD, observabilidad, proxy,
TLS, alta disponibilidad ni configuración de producción.
