# Arquitectura de FieldSales CRM

## Componentes

- Backend Java + Spring Boot.
- Panel React + TypeScript.
- Aplicación Flutter.
- PostgreSQL + PostGIS.
- Redis.
- WebSocket.
- RabbitMQ.
- Observabilidad.

## Estilo

El backend es un monolito modular separado por dominios. Cada dominio aplica arquitectura hexagonal:

```text
domain/
application/
adapter/
config/
```

## Dominios iniciales

| Dominio | Responsabilidad |
|---|---|
| tenancy | Empresas, configuración y aislamiento |
| identity-access | Usuarios, roles, permisos y sesiones |
| workforce | Vendedores, supervisores y territorios |
| customers | Clientes, direcciones y coordenadas |
| routing | Rutas, puntos y optimización |
| journeys | Jornadas |
| tracking | Ubicación y presencia |
| visits | Geocerca e interacción de visita |
| catalog | Productos y precios |
| sales | Ventas |
| reporting | Indicadores y reportes |
| imports | Cargas masivas |
| notifications | Notificaciones |
| audit | Auditoría |

## Principios

1. El dominio no depende de frameworks.
2. Los módulos no consumen repositorios internos de otros módulos.
3. PostgreSQL es fuente de verdad.
4. PostGIS resuelve lógica geográfica.
5. Redis contiene estado efímero.
6. Eventos y consumidores son versionados e idempotentes.
7. El tenant se deriva de la sesión.
8. El rastreo existe solo durante jornada activa.
9. REST, eventos, WebSocket y sincronización tienen contrato.
10. Las decisiones estructurales usan ADR.
