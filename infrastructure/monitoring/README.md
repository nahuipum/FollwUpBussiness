# Monitoring

## Logs

JSON estructurado con correlationId, actor, operación, resultado y error. Sin secretos.

## Métricas

- Latencia y errores API.
- Ubicaciones recibidas.
- WebSocket activos.
- Mensajes y reintentos.
- DLQ.
- Sincronizaciones móviles.
- Importaciones.
- Backups.

Para desarrollo local, Prometheus scrapea `backend:9091/actuator/prometheus`
por nombre de servicio en la red interna Docker `observability`. El puerto de
management no se publica en el host; solo `/actuator/prometheus` se expone al
scrape técnico. Las reglas se cargan desde `alerts/`. Ejecutar
`infrastructure/monitoring/verify-observability.ps1` para comprobar target,
serie y regla.

## Trazas

Publicar ruta, iniciar/cerrar jornada, ubicación, check-in, check-out, venta y sync offline.

## Alertas

Base, Redis, broker, DLQ, errores, sincronización atrasada y backup fallido.
