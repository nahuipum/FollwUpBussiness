# Infraestructura local

EN-005 proporciona PostgreSQL con PostGIS, Redis y RabbitMQ para desarrollo
local. La configuración está en `docker-compose.yml`, en la raíz del
repositorio.

Esta configuración no representa un entorno de producción. Las credenciales
de `.env.example` son valores públicos de desarrollo y nunca deben reutilizarse
en un entorno real.

## Requisitos

- Contenedores Linux.
- Docker Engine 24.0 o posterior.
- Docker Compose plugin 2.20 o posterior.
- En Windows y macOS, Docker Desktop 4.25 o posterior.
- En Linux, Docker Engine con el plugin Compose v2.
- Puertos locales disponibles: `5432`, `6379`, `5672` y `15672`, salvo que se
  cambien en `.env`.

Se debe utilizar `docker compose`; el binario legado `docker-compose` no forma
parte de la configuración soportada.

## Versiones

| Servicio | Imagen |
|---|---|
| PostgreSQL/PostGIS | `postgis/postgis:17-3.5` |
| Redis | `redis:7.4.10-alpine` |
| RabbitMQ Management | `rabbitmq:4.2.9-management-alpine` |

No se utilizan etiquetas `latest`.

## Preparar las variables locales

Desde la raíz del repositorio, crear `.env` a partir del ejemplo.

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS o Linux:

```bash
cp .env.example .env
```

Después, reemplazar en `.env` las contraseñas de ejemplo por valores exclusivos
del entorno local. `.env` está excluido de Git.

| Variable | Propósito | Valor de ejemplo o predeterminado |
|---|---|---|
| `POSTGRES_DB` | Base inicial | `fieldsales` |
| `POSTGRES_USER` | Usuario PostgreSQL local | `fieldsales_local` |
| `POSTGRES_PASSWORD` | Contraseña PostgreSQL requerida | Solo en `.env` |
| `POSTGRES_PORT` | Puerto PostgreSQL en loopback | `5432` |
| `REDIS_PASSWORD` | Contraseña Redis requerida | Solo en `.env` |
| `REDIS_PORT` | Puerto Redis en loopback | `6379` |
| `RABBITMQ_USER` | Usuario RabbitMQ local | `fieldsales_local` |
| `RABBITMQ_PASSWORD` | Contraseña RabbitMQ requerida | Solo en `.env` |
| `RABBITMQ_VHOST` | Virtual host inicial | `fieldsales` |
| `RABBITMQ_AMQP_PORT` | Puerto AMQP en loopback | `5672` |
| `RABBITMQ_MANAGEMENT_PORT` | Puerto de Management en loopback | `15672` |

Compose rechaza la configuración si falta alguna contraseña requerida.

## Validar y levantar

```text
docker --version
docker compose version
docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps
```

Esperar hasta que `postgres`, `redis` y `rabbitmq` aparezcan como `healthy`.

## Estado, logs y ciclo de vida

```text
docker compose ps
docker compose logs
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f rabbitmq
docker compose restart redis
docker compose stop
docker compose down
```

- `stop` detiene los servicios y conserva los contenedores.
- `down` elimina contenedores y la red, pero conserva los volúmenes nombrados.
- `restart <servicio>` reinicia únicamente `postgres`, `redis` o `rabbitmq`.

Para eliminar también todos los datos persistentes:

```text
docker compose down --volumes
```

**Advertencia:** `down --volumes` elimina definitivamente la base PostgreSQL y
el estado local de RabbitMQ. En el siguiente arranque PostgreSQL ejecutará de
nuevo los scripts de `infrastructure/postgres/init/`.

## Validar PostgreSQL y PostGIS

Los siguientes comandos usan `POSTGRES_USER=fieldsales_local` y
`POSTGRES_DB=fieldsales`, que son los valores documentados en `.env.example`.
Si se cambian, se deben sustituir también en los comandos.

Comprobar disponibilidad:

```text
docker compose exec -T postgres pg_isready -U fieldsales_local -d fieldsales
```

Comprobar realmente la extensión PostGIS:

```text
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U fieldsales_local -d fieldsales -tAc "SELECT PostGIS_Version();"
```

Comprobar las extensiones iniciales:

```text
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U fieldsales_local -d fieldsales -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('postgis','pgcrypto') ORDER BY extname;"
```

## Validar Redis

```text
docker compose exec -T redis sh -c 'REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli ping'
```

La respuesta esperada es `PONG`. Redis no utiliza volumen y tiene RDB y AOF
deshabilitados, de acuerdo con su uso como estado efímero.

## Validar RabbitMQ

```text
docker compose exec -T rabbitmq rabbitmq-diagnostics -q ping
docker compose exec -T rabbitmq rabbitmqctl list_vhosts name
docker compose exec -T rabbitmq rabbitmq-diagnostics -q listeners
```

El `vhost` esperado es `fieldsales`. El listener AMQP debe estar en `5672` y
Management en `15672`. La interfaz local está disponible en:

```text
http://127.0.0.1:15672
```

Se accede con `RABBITMQ_USER` y `RABBITMQ_PASSWORD` del `.env` local.

## Red, puertos y volúmenes

- Proyecto Compose: `fieldsales-crm`.
- Red bridge dedicada: `fieldsales-crm_infrastructure`.
- Volumen PostgreSQL: `fieldsales-crm_postgres-data`.
- Volumen RabbitMQ: `fieldsales-crm_rabbitmq-data`.
- PostgreSQL: `127.0.0.1:5432`.
- Redis: `127.0.0.1:6379`.
- RabbitMQ AMQP: `127.0.0.1:5672`.
- RabbitMQ Management: `127.0.0.1:15672`.

Los puertos solo se publican en loopback. La red bridge pertenece al proyecto y
la comparten únicamente los tres servicios de Compose. No se usa red de host,
modo privilegiado ni puertos adicionales. No se marca la red como
`internal: true`, porque Docker Desktop no activa los puertos publicados de una
red interna; la restricción frente a la red del host se aplica con
`127.0.0.1`.

## Directorios existentes

- `postgres/`: fuente de verdad transaccional y geográfica.
- `redis/`: cache, presencia e idempotencia temporal.
- `rabbitmq/`: procesos asíncronos.
- `monitoring/`: documentación futura; EN-005 no agrega observabilidad.

## Limitaciones

- Es una configuración de una sola instancia, únicamente para desarrollo.
- No incluye TLS, backups de producción, alta disponibilidad ni secretos
  administrados.
- Redis es deliberadamente efímero.
- RabbitMQ Management está habilitado solo para inspección local.
- La imagen mantenida `postgis/postgis` documenta soporte oficial `amd64`;
  equipos ARM pueden requerir emulación y validación adicional.
- Los scripts de inicialización de PostgreSQL solo se ejecutan cuando el
  volumen de datos está vacío.
- No se crean tablas, colas, exchanges, bindings ni datos funcionales.
