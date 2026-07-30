# ADR-014 — Motor de rutas y límites del MVP

- **Estado:** Aceptado
- **Fecha:** 2026-07-30
- **Historia:** EN-018
- **Propietario:** dominio `routing`
- **Decisión previa:** ADR-013

## Registro de aceptación

Aceptado el 2026-07-30 después de `PASS` independiente de Backend QA, con
`BQ-EN018-001` y `BQ-EN018-002` cerrados, y de Ciberseguridad, sin hallazgos
Critical, High ni Medium. Los gates de dependencia productiva, integración,
autorización, aislamiento y operación se trasladan a BE-022. DoF permanece
pendiente y esta aceptación documental no autoriza por sí sola el runtime.

## Contexto

RF-RUT-002 exige que la propuesta automática reciba vendedor, fecha, zona,
clientes, inicio, final, horario disponible, duración estimada de visita,
prioridad y ventanas horarias cuando existan. RF-RUT-003 exige distancia,
secuencia, inicio, final y un máximo de clientes. HU-021 permite edición humana,
impide publicación automática y solicita distancia y duración estimadas cuando
estén disponibles.

El piloto contempla entre 5 y 30 vendedores. ADR-013 eligió MapLibre y
Geoapify para presentación/geocodificación, mantuvo PostGIS como autoridad y
dejó el motor de rutas a EN-018. El MVP excluye tráfico en tiempo real y
optimización avanzada. Esta decisión no implementa BE-022, FE-016, endpoints,
migraciones, configuración runtime ni un solver productivo.

## Fuerzas de decisión

- cubrir todas las entradas contractuales, no solo un TSP;
- factura directa estimada USD 0 bajo el máximo declarado del piloto;
- conservar edición manual y reproducción auditable;
- evitar acoplar dominio, API o persistencia a un proveedor;
- degradar a planificación manual sin fabricar estimaciones;
- permitir sustituir la matriz sin reescribir las reglas del solver.

## Alternativas evaluadas

### Mapbox Optimization API v1

Ofrece 100,000 solicitudes mensuales gratuitas, máximo 12 coordenadas y 300
solicitudes/minuto. Optimiza una ruta por duración y permite fijar inicio/final,
pero no representa ventanas, jornada, duración de servicio ni prioridades. La
versión v2 que incorpora restricciones continúa indicada como beta. Se rechaza
para el MVP porque incumple RF-RUT-002, aunque su cuota sea suficiente.

### Google Route Optimization

Modela ventanas, duración, prioridades y límites de vehículo. Single Vehicle
Routing incluye 5,000 shipments mensuales gratuitos y luego cuesta USD
10/1,000 en el primer tramo; requiere billing habilitado y opera a 60 QPM. Con
30 vendedores, 9 clientes y 22 días habría 5,940 shipments/mes: unos USD 9.40
después del tramo gratuito. Se reserva como alternativa administrada cuando se
acepte billing/SLA; no satisface el objetivo estricto de piloto sin gasto.

### OSRM autogestionado

OSRM usa licencia BSD-2-Clause y no cobra por petición propia. Su servicio Trip
es TSP: desde 10 puntos aplica heurística greedy y no modela ventanas, duración
de visita ni prioridad. Autohospedar exige descargar/procesar OSM, memoria,
actualizaciones, monitoreo, backups y capacidad de rollback; por tanto no tiene
costo total cero. No se adopta en el MVP. Su servicio Table es el destino
preferido de evolución para reemplazar la matriz externa detrás del mismo
puerto neutral.

### OR-Tools con matriz neutral

OR-Tools es Apache-2.0, soporta VRP con ventanas, dimensiones temporales,
visitas opcionales penalizadas y límites de búsqueda. El solver recibe matrices
neutrales y no conoce Mapbox. Se elige porque cubre el contrato y permite cambiar
el proveedor de tiempos/distancias sin cambiar reglas de aplicación.

## Decisión

El MVP utilizará:

- **solver:** OR-Tools, detrás de un puerto de aplicación neutral;
- **matrix provider:** Mapbox Matrix API con perfil `mapbox/driving`;
- **route detail:** Mapbox Directions o adaptador equivalente, solo después de
  fijar el orden; la elección concreta pertenece a BE-022;
- **renderer/geocoder:** sin cambios, según ADR-013;
- **geospatial authority:** PostGIS SRID 4326;
- **fallback:** planificación y reordenamiento manual, nunca proveedor oculto.

No se usará `mapbox/driving-traffic`, `depart_at` ni una promesa de tráfico en
tiempo real. La matriz contiene duración en segundos y distancia en metros. Las
coordenadas se envían como longitud/latitud WGS84; no se envían tenant, IDs,
nombres, direcciones, documentos, teléfonos, observaciones ni prioridad.

## Límites confirmados del MVP

| Capacidad | Límite |
|---|---|
| Vendedores por optimización | 1 |
| Clientes | máximo 9 |
| Inicio/final | explícitos; pueden ser distintos |
| Nodos de matriz | máximo 11 |
| Horario del vendedor | una ventana operativa obligatoria |
| Duración de visita | por cliente, en segundos/minutos normalizados |
| Ventanas de cliente | cero o más ventanas normalizadas; duras en MVP |
| Prioridad | penalización explícita por no atender; mayor prioridad, mayor costo |
| Tiempo de solver | presupuesto configurable de 2 s; techo de 5 s |
| Publicación | nunca automática |

El solver primero maximiza el valor de clientes factibles según prioridad;
después minimiza duración total de desplazamiento y usa distancia como
desempate. Si todos los clientes no caben en jornada/ventanas, devuelve los no
asignados con motivo estructurado. No relaja silenciosamente ventanas ni usa
distancia en línea recta cuando la matriz contiene `null`.

La aplicación debe rechazar antes de llamar al proveedor más de 9 clientes,
coordenadas fuera de rango, inicio/final ausentes, ventanas invertidas,
duraciones no positivas o una jornada inválida.

## Cuota y costo del piloto

Mapbox Matrix factura elementos: fuentes × destinos. Una matriz simétrica de 11
nodos consume 121 elementos. La cuota pública verificada el 2026-07-30 incluye
100,000 elementos/mes; `driving` acepta hasta 25 coordenadas, 625 elementos y
60 solicitudes/minuto.

```text
11 × 11 × 30 vendedores × 22 días = 79,860 elementos/mes
100,000 - 79,860 = 20,140 elementos de margen
20,140 / 121 = 166 regeneraciones completas aproximadas
```

El presupuesto operativo es una matriz base por vendedor/día y máximo 35
matrices/día por cuenta, con rate limit adicional por tenant/usuario. Una
edición de orden reutiliza la matriz; no vuelve a consultarla. QA, staging y
producción deben usar tokens/proyectos y presupuestos separados. USD 0 es una
estimación condicionada, no SLA ni garantía contractual.

Umbrales mensuales:

- 70% (70,000): advertencia y revisión de tendencia;
- 80% (80,000): limitar regeneraciones no esenciales;
- 90% (90,000): solo generación inicial autorizada;
- 95% (95,000): deshabilitar automática mediante capacidad y dejar manual.

Un `429` respeta `Retry-After`; no hay ráfaga de reintentos. Errores 401/403,
422, timeout, 5xx, `NoRoute` o elementos `null` degradan de forma explícita.

## Reproducibilidad, propuestas y edición humana

Cada propuesta debe conservar, cuando BE-022 implemente persistencia:

- `proposalVersion` monotónica y versión base de la ruta;
- hash canónico de entradas, tenant propietario y actor autorizado;
- coordenadas usadas o referencia inmutable a su snapshot;
- matriz normalizada o blob/referencia íntegra con hash;
- proveedor, perfil, instante, unidades y versión conocida;
- versión/configuración del solver, objetivo y límite temporal;
- orden, llegada/salida estimada y clientes no asignados con causa;
- `generatedAt` y `correlationId`.

La misma entrada, matriz, configuración y versión debe producir el mismo orden
en el modo determinista del MVP. Una actualización cartográfica genera una
nueva propuesta; no reescribe una anterior. La edición humana crea una nueva
revisión marcada `MANUAL_EDIT` con referencia a la propuesta, preserva el
orden automático original y nunca se sobrescribe al regenerar. Solo una acción
explícita y autorizada publica.

## Contrato de resiliencia

| Condición | Resultado |
|---|---|
| Sin token/configuración | automática no disponible; ruta manual intacta |
| Timeout/5xx/429 | error temporal tipado; reintento manual controlado |
| 401/403 | capacidad deshabilitada y alerta operativa; no reintentar |
| 422/límite | error permanente de entrada/configuración |
| `null`/`NoRoute` | cliente no enrutable informado; no aproximación silenciosa |
| Solver sin solución | propuesta inviable con causas; permite edición manual |
| Timeout del solver | mejor solución factible marcada no óptima o fallo controlado |

El fallback no publica, no cambia puntos confirmados ni llama silenciosamente a
Google, Geoapify u OSRM. Una ruta manual existente sigue disponible.

## Seguridad, privacidad y multiempresa

- tenant y permisos se derivan de sesión; ningún `tenantId` de body es fiable;
- selección de vendedor/clientes y snapshot deben pertenecer al mismo tenant;
- cuotas, cache y locks futuros incluyen tenant, ambiente y capacidad;
- el token es secreto server-side, por ambiente, restringido, rotado y nunca
  aparece en OpenAPI, respuestas, logs, métricas o URLs registradas;
- solo se envían coordenadas; los logs no contienen coordenadas completas ni
  matrices/payloads;
- métricas agregan proveedor, resultado, latencia, tamaño y consumo, sin IDs de
  cliente/vendedor;
- pruebas futuras incluyen acceso cruzado, autorización y agotamiento abusivo.

Antes de producción Legal/Seguridad deben validar términos para uso de Matrix y
la presentación de resultados junto a MapLibre/Geoapify. Esta puerta no se
supone satisfecha por la prueba técnica.

## Observabilidad

Métricas mínimas: solicitudes y elementos por tenant/ambiente, latencia,
resultado (`success`, `rate_limited`, `unauthorized`, `invalid`, `no_route`,
`timeout`, `provider_error`), tiempo del solver, optimalidad declarada, clientes
asignados/no asignados y uso de fallback manual. Logs: `correlationId`, operación,
resultado y errorType sanitizados. El portal de Mapbox prevalece para cuota.

## Pruebas y spike

CI usa pruebas documentales y un modelo OR-Tools real con matrices sintéticas:
ventanas, duración, prioridad, inviabilidad, límite temporal y repetibilidad.
OR-Tools queda en scope `test`; BE-022 decidirá su dependencia productiva.

El spike Mapbox es opt-in y carga el token únicamente desde
`FIELD_SALES_MAPBOX_MATRIX`, `FIELD_SALES_MAPBOX_MATRIX_SPIKE_KEY` o
`MAPBOX_ACCESS_TOKEN`; el test no lee `.env` ni imprime token o URL. Valida una
matriz Perú 11×11 (121 elementos), inicio/final distintos, forma, valores,
latencia, conectividad Lima–Arequipa–Cusco, `401` sin token y rechazo de más de
25 coordenadas. No agota cuota para forzar `429`.

Evidencia técnica del 2026-07-30: el spike live ejecutó 4 pruebas sin fallos,
errores ni omisiones; la matriz Lima 11×11 respondió `200` con 121 elementos y
`latencyMs=526`; también pasaron conectividad Lima–Arequipa–Cusco, `401` sin
token y `422` con 26 coordenadas. Es una muestra puntual, no SLA ni aprobación
independiente, y no se forzó `429`.

## Evolución, rollback y reevaluación

Evolución preferida: conservar OR-Tools y reemplazar Mapbox Matrix por OSRM
Table autogestionado cuando el costo total y la capacidad operativa lo
justifiquen. Google Route Optimization es alternativa si se acepta billing y
se prefiere servicio administrado.

Rollback: desactivar capacidad automática, revocar token, conservar propuestas
ya generadas como snapshots, mantener rutas/ediciones y continuar manual. No se
elimina ni recalcula historia.

Reevaluar ante cualquiera de estas condiciones:

- necesidad de más de 9 clientes por vendedor;
- más de 30 vendedores, más de 35 matrices/día o 80,000 elementos/mes;
- varios tenants compartiendo la misma cuota;
- necesidad de tráfico, SLA o planificación multi-vendedor;
- 429, latencia, `null` o calidad vial inaceptables en Perú;
- cambio de precio, cuota, licencia, privacidad o restricción de token;
- costo externo mayor que operar OSRM con actualización y observabilidad;
- imposibilidad legal de usar resultados con el renderer decidido en ADR-013.

## Consecuencias

- El contrato completo se puede modelar sin adelantar código productivo.
- El límite de 9 clientes es deliberado y debe verse en UI/API futura.
- Se agrega una dependencia nativa solo a pruebas del enabler.
- El MVP depende de Mapbox para matrices, pero no persiste tipos del proveedor.
- La propuesta es estimación planificada, no navegación ni tráfico real.
- DoF debe validar el cierre de EN-018; los gates productivos permanecen en
  BE-022.

## Fuentes oficiales verificadas

- Mapbox Matrix API: <https://docs.mapbox.com/api/navigation/matrix/>
- Mapbox Optimization v1: <https://docs.mapbox.com/api/navigation/optimization-v1/>
- Mapbox pricing: <https://www.mapbox.com/pricing/>
- OR-Tools routing: <https://developers.google.com/optimization/routing>
- OR-Tools Java: <https://developers.google.com/optimization/install/java>
- Google Route Optimization billing:
  <https://developers.google.com/maps/documentation/route-optimization/usage-and-billing>
- Google Maps pricing:
  <https://developers.google.com/maps/billing-and-pricing/pricing>
- OSRM HTTP API:
  <https://github.com/Project-OSRM/osrm-backend/blob/master/docs/http.md>
- OSRM server limits: <https://project-osrm.org/docs/v26.4.0/tools>
