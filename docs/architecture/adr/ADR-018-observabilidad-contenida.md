# ADR-018 — Observabilidad contenida en Docker

**Estado:** Aceptado
**Aprobado por:** Usuario — Opción 1 para SEC-BE055-05
**Fecha de aceptación:** 2026-08-01

## Contexto

BE-055 requiere que Prometheus reciba las métricas de outbox que alimentan las
alertas de ADR-005. Exponer el puerto de management en el host deja una
superficie técnica fuera de la red de despliegue y no es necesario para el
scrape local.

## Decisión

El backend y Prometheus se ejecutan como servicios Compose. Ambos comparten la
red interna `observability` con subnet estática `172.30.0.0/29`: Prometheus usa
`172.30.0.2` y el management del backend escucha exclusivamente en
`172.30.0.3`. Prometheus scrapea `backend:9091/actuator/prometheus` por nombre
de servicio. El puerto de management no se publica en el host ni escucha en la
interfaz de la red `infrastructure`.

El endpoint Prometheus sigue siendo la única excepción técnica a la política
deny-by-default de ADR-010. La IP de escucha exclusiva de `observability`
actúa como política de red: una sonda conectada solo a `infrastructure` no
puede abrir el puerto. Fuera de Compose el valor por defecto sigue ligado a
loopback. Prometheus carga las reglas de outbox versionadas y tampoco publica
un puerto al host.

## Alternativas

- Scrape desde `host.docker.internal`: rechazada por ampliar el límite de red
  y depender del comportamiento del host.
- Publicar el puerto management en loopback: rechazada por la decisión humana
  de contener el scrape en Docker.
- Añadir autenticación temporal: rechazada; ADR-010 reserva la estrategia de
  identidad para BE-003 y la red interna reduce la superficie sin inventarla.

## Consecuencias

- El Compose local construye y arranca el monolito junto con sus dependencias.
- Las verificaciones operativas se ejecutan dentro del contenedor Prometheus.
- No cambia la arquitectura hexagonal, el aislamiento tenant ni los contratos
  HTTP o de eventos de negocio.

## Riesgos

- Esta topología es local y no sustituye controles de red, TLS ni autenticación
  de producción. Un despliegue distinto debe preservar la restricción de red y
  ser revisado por Seguridad.
- El primer build descarga dependencias e imágenes; la prueba E2E requiere
  Docker Engine/Compose disponibles.

## Reversión

Eliminar los servicios y red de observabilidad de Compose, el Dockerfile y la
configuración de scrape; restaurar la exposición loopback solo con una nueva
decisión de seguridad. La reversión deja las alertas sin fuente y no es válida
para BE-055 mientras ADR-005 exija observabilidad.
