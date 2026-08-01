# ADR-013 — Mapas, geocodificación y navegación

**Estado:** Aceptado  
**Historia:** EN-014  
**Fecha de evaluación:** 2026-07-30

## Registro de aceptación

Aceptado el 2026-07-30 después de `PASS` independiente de Backend QA y
Ciberseguridad para el alcance documental de EN-014. La aceptación no
autoriza el uso productivo: el spike live no se ejecutó por ausencia de una
clave Geoapify y permanece como condición preproductiva junto con los
controles enumerados en este ADR.

## Contexto

FieldSales CRM necesita mostrar clientes, rutas, recorridos y vendedores en
React; sugerir coordenadas a partir de una dirección; y permitir que Flutter
abra navegación hacia un cliente. Es un SaaS multiempresa y el piloto sugerido
tiene entre 5 y 30 vendedores por empresa.

Las coordenadas confirmadas de clientes son datos persistentes. Según ADR-003,
PostgreSQL/PostGIS con SRID 4326 es la fuente de verdad geográfica. El
proveedor de mapas no decide duplicados, distancias, geocercas, secuencias de
ruta ni si una visita es válida.

El MVP no incluye navegación giro a giro embebida, tráfico en tiempo real,
mapas offline ni autohospedaje de cartografía. EN-018 decidirá el motor de
rutas; esta decisión no lo anticipa.

Se compararon Google completo, Mapbox completo, MapLibre con Geoapify y
OpenStreetMap/Nominatim autogestionados.

## Decisión

El MVP utilizará MapLibre + Geoapify con capacidades desacopladas:

- **renderer:** MapLibre en React y Flutter;
- **tiles/style:** Geoapify;
- **geocoder:** Geoapify, detrás de un futuro límite neutral del backend;
- **navigation launcher:** URL externa de Google Maps, Waze o URI del sistema
  operativo, usando latitud y longitud;
- **geospatial authority:** PostGIS, SRID 4326 y distancias en metros;
- **route engine:** no decidido aquí; pertenece a EN-018.

MapLibre y Geoapify no se tratarán como un SDK único. Los componentes de
negocio no recibirán tipos propios del proveedor. Los contratos persistentes y
de API conservarán puntos neutrales (`latitude`, `longitude`, SRID 4326).

Esta elección permite un piloto sin tarjeta ni factura directa del proveedor
si permanece dentro del plan gratuito. No constituye garantía de costo ni SLA.
EN-014 no implementa endpoints, adaptadores ni configuración runtime
productiva.

## Volumen, cuotas y costo

La estimación base por empresa usa el límite alto del piloto:

- 30 vendedores;
- 2 usuarios administrativos o supervisores que usan mapas;
- 40 aperturas de mapa por día;
- 50 solicitudes de tile por apertura como promedio de planificación;
- 100 geocodificaciones explícitas por día.

| Consumo diario por empresa | Cálculo | Créditos |
|---|---:|---:|
| Tiles | 40 × 50 tiles × 0.25 | 500 |
| Geocodificación | 100 × 1 | 100 |
| Total estimado | 500 + 100 | 600 |

Con el plan Free de Geoapify verificado el 2026-07-30:

- cuota: 3,000 créditos por día;
- límite: 5 solicitudes por segundo;
- geocodificación: 1 crédito por solicitud;
- tile: 0.25 créditos por solicitud;
- no exige tarjeta;
- el uso comercial está sujeto a términos y atribución;
- los resultados de geocodificación se pueden almacenar conforme a los
  términos vigentes.

Una empresa consumiría aproximadamente 20% de la cuota; tres empresas con el
mismo patrón, 1,800 créditos/día o 60%. Los vendedores no multiplican tiles:
marcadores y recorridos se dibujan como capas locales y MOB-006 abre una
aplicación externa.

El número de empresas, países, sesiones, nivel de zoom y paneo no están
cerrados. Por ello, `USD 0` significa factura directa estimada del proveedor
bajo estos supuestos; no incluye ingeniería, infraestructura propia ni costo
de indisponibilidad.

## Política de datos y privacidad

### Tiles y renderer

El cliente solicita únicamente el mapa base. Clientes, vendedores, recorridos,
rutas y geocercas llegan desde APIs autorizadas y se renderizan localmente. No
se incorporarán `tenantId`, `customerId`, `sellerId`, nombres, documentos,
teléfonos ni tokens de sesión en URLs de tiles, estilo o telemetría.

El proveedor podrá observar IP, agente de usuario y viewport aproximado. La
interfaz mostrará atribución visible:
`Powered by Geoapify | © OpenStreetMap contributors`.

### Geocodificación

Solo se enviará dirección normalizada, país o región cuando el usuario los
haya informado, límite de resultados y parámetros técnicos necesarios. No se
enviarán tenant, identificadores internos, nombre comercial, documento,
teléfono, vendedor, ruta ni observaciones. No se usarán direcciones de un
tenant para responder solicitudes de otro tenant.

Una sugerencia nunca reemplaza la confirmación humana. El administrador debe
confirmar o mover el punto antes de persistirlo. Se persiste punto WGS84,
procedencia, instante de sugerencia, confianza disponible y actor de
confirmación; no el payload crudo sin necesidad aprobada. Un identificador del
proveedor no será clave de negocio.

Cache, rate limits y métricas quedan segregados por tenant. Los logs no
contienen dirección completa, coordenadas completas ni respuesta del proveedor.

### Navegación

El launcher externo recibe solo destino latitud/longitud. Nombre y dirección
se omiten salvo justificación posterior. Abrir navegación no inicia jornada,
no habilita geocerca y no marca una visita.

## Claves y rotación

El token de tiles en web/mobile es recuperable. Se trata como token público de
mínimo privilegio, no como secreto:

- una clave por ambiente y canal;
- restricciones de origen, aplicación, IP y alcance cuando se soporten;
- sin permiso de geocoding en la clave de tiles si se puede separar;
- revocación individual por canal.

La clave de geocodificación será solo server-side, inyectada por el mecanismo
de secretos, nunca versionada, devuelta o registrada. La rotación usa dos
claves durante una ventana corta: crear, restringir, probar, activar, observar,
revocar la anterior. Si no existen restricciones suficientes para tokens
públicos, Seguridad deberá aceptar el riesgo o exigir otro proveedor de tiles.

## Límites y observabilidad

Las búsquedas serán explícitas o con debounce, longitud mínima, cancelación de
solicitudes obsoletas y máximo de candidatos. El backend aplicará rate limit
por tenant/usuario, timeout, circuit breaker y respeto de `429`/`Retry-After`;
no hará reintentos agresivos.

Métricas sin datos personales:

- carga, fallo y latencia del mapa;
- errores de tiles por código;
- solicitudes, resultado, latencia y `429` de geocoding;
- consumo estimado por ambiente y canal;
- apertura/fallo del launcher;
- estado del circuito y última respuesta correcta.

El portal de Geoapify es autoridad para cuota; la telemetría local solo estima.

- 70% (2,100 créditos): advertencia;
- 85% (2,550): desactivar autocomplete y dejar búsqueda explícita;
- 95% (2,850): apagar geocodificación mediante flag;
- cuota agotada: captura manual, sin reintento automático.

El límite de 5 solicitudes por segundo puede afectar antes que la cuota:
MapLibre pide tiles en paralelo y dos usuarios pueden producir una ráfaga. Se
medirán `429`, tiempo hasta mapa utilizable y tiles fallidos con al menos dos
cargas concurrentes antes de producción.

## Degradación

| Condición | Comportamiento obligatorio |
|---|---|
| Geocoder sin clave, caído o apagado | Se conserva captura manual y confirmación de coordenadas. |
| `429` o 85% de cuota | Sin autocomplete; búsqueda explícita controlada y estado limitado. |
| 95% o cuota agotada | Geocoding deshabilitado, sin respuesta simulada ni fallback silencioso. |
| Tiles sin clave, red o proveedor | Lista/tabla accesible, datos y coordenadas; error y reintento manual. |
| Mobile sin red | Conserva ruta/coordenadas sincronizadas; navegación depende de la app externa. |
| App de navegación ausente | Ofrece otra app/URI o copiar coordenadas; no cambia la visita. |

Una caída no invalida puntos confirmados en PostGIS, geocercas ni proximidad.

## Flags de capacidad

Las historias consumidoras preverán, sin implementarlo en este enabler:

- `mapRenderingEnabled`;
- `tileProvider`;
- `geocodingEnabled`;
- `geocodingProvider`;
- `externalNavigationEnabled`;
- `navigationProviderPreference`.

Un valor recibido desde el cliente no puede activar un proveedor ni conceder
acceso.

## Spike y pruebas

`GeoapifyLiveSpikeTest` se activa solo con
`FIELD_SALES_GEOAPIFY_SPIKE_KEY`. La prueba:

1. consulta direcciones de Lima, Arequipa y Cusco con filtro Perú;
2. valida país y rango de coordenadas;
3. solicita estilo `osm-bright` compatible con MapLibre Style Specification;
4. ejecuta ráfaga concurrente y registra `200`/`429` sin imprimir la clave.

Sin credencial se marca `SKIPPED` con causa explícita. No se afirmará
rendimiento live ni respuesta real del proveedor. El máximo por ejecución es
13 solicitudes de geocoding y una de estilo.

Las historias consumidoras agregarán fake del puerto neutral; casos vacío,
timeout, `429`, `5xx` y payload inválido; aislamiento tenant; fallo de tiles
con lista; atribución; rotación; límites de coordenada; confirmación manual;
carga concurrente; y navegación sin app/red. CI no depende de red ni cuenta.

## Alternativas

### Google completo

Rechazado. Dynamic Maps y Geocoding ofrecían 10,000 eventos gratuitos por
SKU/mes, pero exigen billing. La política de Geocoding restringe el cache
ordinario de contenido geocodificado, incluidas coordenadas, a 30 días salvo
excepciones expresas. No se basará la fuente persistente en una interpretación
no aprobada.

### Mapbox completo

Rechazado. Mapbox GL JS ofrecía 50,000 cargas/mes y Temporary Geocoding
100,000 solicitudes/mes, pero el resultado temporal no se puede almacenar.
Permanent Geocoding cuesta desde la primera solicitud (USD 5/1,000 en la
referencia evaluada) y requiere tarjeta o contrato.

### OSM autogestionado

Rechazado. Nominatim público limita a 1 solicitud por segundo, prohíbe
autocomplete y uso pesado/bulk y puede retirar acceso. Los tiles públicos no
son un CDN garantizado para SaaS. Autohospedar exige infraestructura y
operación; su costo no es cero.

## Consecuencias

- El MVP puede iniciar sin factura directa ni tarjeta.
- Persistencia y lógica geográfica quedan independientes.
- React/Flutter necesitarán capa MapLibre y atribución visible.
- Geoapify sigue siendo dependencia operativa, no fuente de verdad.
- El plan gratuito no permite prometer disponibilidad.
- El límite de 5 solicitudes/segundo puede obligar a cambiar solo tiles.

## Riesgos y reevaluación

Se reevalúa ante:

- consumo sostenido superior a 2,100 créditos/día;
- `429`, latencia o tiles faltantes inaceptables;
- más de tres empresas con el volumen estimado;
- geocoding masivo, autocomplete intensivo o mapas offline;
- necesidad de SLA, tráfico o navegación embebida;
- cobertura insuficiente por país;
- requisito de residencia/DPA incompatible;
- imposibilidad de atribución;
- cambio de licencia, cuota, precio o condiciones comerciales;
- soporte insuficiente de MapLibre en Flutter;
- costo total superior a autohospedaje operable.

Antes del lanzamiento se revisan precio, licencia, atribución, almacenamiento,
restricciones de clave y privacidad. Un cambio material requiere nuevo ADR.

## Migración y reversión

Las coordenadas confirmadas permanecen en PostGIS y no se geocodifican de
nuevo al cambiar proveedor.

Migración: probar con datos sintéticos o consentidos; cambiar tiles/estilo
independiente del geocoder; usar el nuevo geocoder solo en solicitudes nuevas;
observar calidad/cuota; retirar clave anterior. No habrá dual-run general ni
re-geocoding masivo.

Rollback: apagar `geocodingEnabled`, restaurar captura manual, restaurar
URL/estilo o lista/tabla, volver al adaptador anterior durante la ventana de
rotación y revocar la clave defectuosa.

## Fuentes oficiales verificadas

- Geoapify Pricing: <https://www.geoapify.com/pricing/>
- Geoapify Terms: <https://www.geoapify.com/terms-and-conditions/>
- Geoapify Geocoding:
  <https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/>
- MapLibre GL JS: <https://maplibre.org/maplibre-gl-js/docs/>
- Google pricing: <https://mapsplatform.google.com/pricing/>
- Google Geocoding policies:
  <https://developers.google.com/maps/documentation/geocoding/policies>
- Google Maps URLs:
  <https://developers.google.com/maps/documentation/urls/get-started>
- Waze Deep Links: <https://developers.google.com/waze/deeplinks>
- Mapbox pricing: <https://www.mapbox.com/pricing/>
- Mapbox Geocoding: <https://docs.mapbox.com/api/search/geocoding/>
- Nominatim policy:
  <https://operations.osmfoundation.org/policies/nominatim/>
- OSM tile policy:
  <https://operations.osmfoundation.org/policies/tiles/>

