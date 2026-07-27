# Contexto técnico compartido — FieldSales CRM

## 1. Producto

SaaS multiempresa para:

- Registrar clientes geolocalizados.
- Planificar y optimizar rutas.
- Asignar rutas a vendedores.
- Rastrear vendedores únicamente durante su jornada.
- Validar visitas mediante geocerca.
- Registrar ventas.
- Consultar resultados diarios e históricos.
- Operar con conectividad intermitente.
- Mantener trazabilidad y aislamiento entre empresas.

La fuente funcional es `00_CONTRATO_FUNCIONAL.md`.

---

## 2. Stack aprobado

### Backend

- Java.
- Spring Boot.
- Monolito modular separado por dominios.
- Arquitectura hexagonal dentro de cada dominio.
- PostgreSQL como base transaccional.
- PostGIS para información y consultas geoespaciales.
- Redis para información efímera, cache, presencia y coordinación técnica.
- WebSocket para actualizaciones en tiempo real.
- Cola para procesos asíncronos.

### Frontend administrativo

- React.
- TypeScript obligatorio.
- Cliente HTTP generado o tipado desde OpenAPI.
- Cliente WebSocket para información en vivo.
- Proveedor de mapas desacoplado de los componentes de negocio.

### Aplicación móvil

- Flutter.
- Persistencia local.
- Operación offline-first.
- Sincronización idempotente.
- Ubicación en segundo plano únicamente durante jornada activa.
- Almacenamiento seguro de credenciales.

---

## 3. Decisiones arquitectónicas base

### 3.1 Monolito modular

No se crearán microservicios durante el MVP.

Los módulos se comunican mediante:

1. Puertos de aplicación explícitos.
2. Eventos internos.
3. Contratos públicos controlados.

Queda prohibido acceder directamente a tablas o repositorios internos de otro dominio.

### 3.2 Arquitectura hexagonal por dominio

Estructura conceptual:

```text
<domain>/
├── domain/
│   ├── model/
│   ├── service/
│   ├── event/
│   └── exception/
├── application/
│   ├── port/in/
│   ├── port/out/
│   ├── usecase/
│   └── dto/
├── adapter/
│   ├── in/
│   │   ├── rest/
│   │   ├── websocket/
│   │   └── messaging/
│   └── out/
│       ├── persistence/
│       ├── redis/
│       ├── messaging/
│       └── external/
└── config/
```

El dominio:

- No depende de Spring.
- No conoce controladores.
- No conoce JPA.
- No conoce Redis.
- No conoce WebSocket.
- No conoce el broker.

### 3.3 Dominios sugeridos

| Dominio | Responsabilidad |
|---|---|
| tenancy | Empresas, configuración y aislamiento |
| identity-access | Usuarios, roles, permisos y sesiones |
| workforce | Vendedores, supervisores y territorios |
| customers | Clientes, direcciones y coordenadas |
| routing | Rutas, puntos, secuencia y optimización |
| journeys | Jornadas y estados de vendedor |
| tracking | Ubicaciones y presencia en tiempo real |
| visits | Geocerca, inicio, cierre y resultado |
| catalog | Productos y precios |
| sales | Ventas y detalle |
| reporting | Consultas y proyecciones de lectura |
| notifications | Notificaciones y avisos |
| audit | Trazabilidad de acciones |
| imports | Cargas masivas y validación de archivos |

La división definitiva debe documentarse mediante ADR si cambia.

---

## 4. Reglas de persistencia

### PostgreSQL

Es la fuente de verdad para:

- Empresas.
- Usuarios.
- Clientes.
- Rutas.
- Jornadas.
- Visitas.
- Ventas.
- Auditoría.
- Historial persistente de ubicación, según política.

### PostGIS

Debe utilizarse para:

- Puntos geográficos.
- Distancias.
- Geocercas.
- Búsquedas por radio.
- Índices espaciales.
- Validaciones geográficas.

No se almacenarán latitud y longitud únicamente como texto.

### Redis

No es fuente de verdad de negocio.

Usos permitidos:

- Última ubicación de vendedores activos.
- Presencia y estado efímero.
- Cache.
- Rate limits.
- Idempotencia temporal.
- Locks técnicos con expiración.
- Fan-out o soporte de WebSocket si se requiere.

Toda información indispensable debe poder recuperarse desde PostgreSQL o regenerarse.

---

## 5. Tiempo real

WebSocket se utilizará para:

- Ubicación reciente.
- Cambio de estado del vendedor.
- Inicio y cierre de visita.
- Actualización de métricas operativas necesarias.

Reglas:

- Autenticación obligatoria al conectar.
- Autorización por empresa y equipo.
- Suscripciones segregadas por tenant.
- Reconexión controlada.
- Heartbeat.
- Indicador de última actualización.
- La interfaz nunca presentará una ubicación antigua como “en tiempo real”.

---

## 6. Procesos asíncronos

La cola se utilizará para:

- Importaciones masivas.
- Generación de reportes.
- Notificaciones.
- Procesamiento de eventos.
- Persistencia o consolidación no crítica de telemetría.
- Reintentos de integraciones.

Reglas obligatorias:

- Eventos versionados.
- Consumidores idempotentes.
- Reintentos limitados.
- Backoff.
- Dead-letter queue.
- Correlation ID.
- Observabilidad.
- Outbox transaccional cuando un evento dependa de una transacción de negocio.

Propuesta por defecto para el MVP: RabbitMQ. Cualquier cambio debe quedar en ADR.

---

## 7. Contratos

### REST

- OpenAPI como contrato.
- Errores estandarizados.
- Paginación.
- Filtros explícitos.
- Versionado de cambios incompatibles.
- Idempotency key para operaciones móviles sensibles.

### Eventos

Cada evento debe incluir como mínimo:

- eventId.
- eventType.
- version.
- occurredAt.
- tenantId.
- correlationId.
- causationId.
- payload.

### Sincronización móvil

Cada comando offline debe incluir:

- clientGeneratedId.
- deviceId.
- createdAtDevice.
- timezone.
- sequenceNumber, cuando aplique.
- payload.
- schemaVersion.

---

## 8. Reglas críticas de negocio

- Aislamiento estricto por empresa.
- Rastreo solo con jornada activa.
- Geocerca configurable.
- Una sola visita activa por vendedor.
- Venta vinculada a cliente y vendedor.
- Venta vinculada a visita por defecto.
- Conservación de fecha y coordenada originales al sincronizar.
- Idempotencia para visitas y ventas móviles.
- Eliminación lógica para entidades con historial.
- Auditoría para cambios críticos.
- Permisos explícitos para excepciones administrativas.

---

## 9. Principios de implementación

- No introducir infraestructura sin necesidad demostrada.
- No colocar reglas de negocio en controladores o componentes visuales.
- No duplicar reglas entre backend, frontend y mobile; el backend es la autoridad.
- Frontend y mobile pueden anticipar validaciones para UX, pero el servidor las repite.
- No exponer entidades de persistencia directamente.
- No realizar cambios incompatibles sin migración y estrategia de despliegue.
- No mezclar datos de tenants en cache, mensajes, logs o WebSocket.
- No aprobar una historia sin evidencia.
