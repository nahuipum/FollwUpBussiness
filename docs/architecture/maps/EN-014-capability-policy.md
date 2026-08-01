# EN-014 — Contrato neutral de capacidades geográficas

Este documento traduce ADR-013 en límites consumibles por Backend, Frontend y
Mobile. Es un contrato arquitectónico; EN-014 no implementa endpoints,
adaptadores productivos, configuración runtime ni las historias que desbloquea.

## Capacidades y propietario

| Capacidad | Autoridad | Entrada neutral | Salida neutral | No decide |
|---|---|---|---|---|
| Renderizado | Adaptador MapLibre de cada UI | viewport y capas autorizadas | mapa visual | permisos, geocerca o persistencia |
| Tiles/estilo | Geoapify | z/x/y, estilo y token restringido | mapa base | datos de clientes o vendedores |
| Geocodificación | Backend mediante futuro puerto neutral | dirección, país/región y límite | candidatos de punto | aceptación del punto |
| Persistencia y cálculo | PostgreSQL/PostGIS | punto SRID 4326 | punto, distancia y consultas | visualización |
| Navegación | Launcher Flutter | latitud/longitud | apertura de app externa | check-in, jornada o ruta |
| Optimización | EN-018 | fuera de EN-014 | fuera de EN-014 | no se infiere desde Geoapify |

## Tipos neutrales

```text
GeoPoint
  latitude: decimal [-90, 90]
  longitude: decimal [-180, 180]
  srid: 4326

GeocodingCandidate
  displayLabel: string
  point: GeoPoint
  confidence: decimal opcional [0, 1]
  countryCode: ISO 3166-1 alpha-2 opcional

NavigationTarget
  point: GeoPoint
```

No se exponen objetos MapLibre, Geoapify, Google, Waze o Mapbox en OpenAPI,
persistencia o dominio. Un ID de proveedor puede conservarse como metadato de
procedencia, nunca como identidad del cliente o coordenada.

## Flujo de geocodificación

1. Un usuario autorizado introduce una dirección.
2. El futuro caso de uso deriva tenant y usuario de la sesión.
3. Se valida longitud, país/región y rate limit.
4. El adaptador envía solo los campos permitidos.
5. Se normalizan candidatos al tipo neutral.
6. El usuario confirma o mueve el punto.
7. La historia de clientes persiste el punto en PostGIS.
8. Un cambio posterior de coordenada se audita.

No existe aceptación automática, búsqueda cross-tenant, geocoding masivo
implícito ni fallback silencioso a otro proveedor.

## Datos permitidos y prohibidos

| Superficie | Permitido | Prohibido |
|---|---|---|
| Tile/style URL | coordenadas de tile, estilo, token restringido | tenantId, IDs internos, nombres, documentos, teléfonos, JWT |
| Petición geocoder | dirección normalizada, país/región, límite | tenantId, customerId, vendedor, ruta, documento, teléfono, observaciones |
| Launcher | latitud y longitud | tokens, tenantId, estado de visita |
| Logs | correlationId, proveedor, estado, latencia, errorType | clave, URL firmada, dirección completa, coordenadas completas, payload |
| Métricas | conteos y latencia agregados por ambiente/canal | etiquetas con cliente, dirección o coordenadas |

## Estados de capacidad

| Capacidad | ACTIVE | LIMITED | DISABLED |
|---|---|---|---|
| Mapa | tiles y capas disponibles | tiles incompletos; lista permanece | lista/tabla y coordenadas |
| Geocoder | búsqueda controlada | solo búsqueda explícita | captura manual |
| Navegación | app preferida disponible | alternativa/URI | copiar coordenadas |

La UI debe distinguir `LIMITED` y `DISABLED`; no presenta datos viejos como
actuales ni una sugerencia como punto confirmado.

## Configuración futura

Las historias consumidoras resolverán independientemente:

```text
mapRenderingEnabled
tileProvider
geocodingEnabled
geocodingProvider
externalNavigationEnabled
navigationProviderPreference
```

Estos nombres expresan capacidades, no variables obligatorias de EN-014. El
cliente no selecciona arbitrariamente un proveedor.

## Presupuesto y degradación

- Presupuesto de planificación: 600 créditos/día/empresa.
- Advertencia: 2,100 créditos/día de la cuenta.
- Limitación: 2,550 créditos/día.
- Apagado de geocoding: 2,850 créditos/día.
- Límite de proveedor: 5 solicitudes/segundo.
- Sin proveedor: captura manual, lista/tabla y puntos confirmados permanecen.

El portal del proveedor prevalece sobre el contador estimado. Cualquier
fallback que envíe datos a un tercero nuevo requiere revisión y decisión; no
se activa automáticamente.

## Trazabilidad de consumidores

| Historia | Decisión habilitante |
|---|---|
| BE-013 | persiste punto confirmado; PostGIS sigue siendo autoridad |
| BE-015 | proximidad y duplicados se calculan en PostGIS |
| EN-018 | recibe puntos neutrales; selecciona motor por separado |
| FE-009 | selector MapLibre, sugerencia confirmable y captura manual |
| FE-010 | mapa con lista accesible y fallo de tiles manejado |
| FE-019 | capas planificada/ejecutada sin tipos del proveedor |
| FE-020 | marcadores locales; `stale` proviene del backend |
| FE-022 | track histórico local y alternativa de timeline |
| MOB-006 | abre navegación externa; no marca visita |

## Evidencia mínima para consumidores

- tipos neutrales y ninguna clase/ID de proveedor en dominio;
- atribución visible y legible;
- pruebas sin clave, sin red, `429`, timeout y payload inválido;
- prueba negativa de acceso entre tenants;
- logs y métricas sin dirección/clave/coordenadas completas;
- rotación de clave sin indisponibilidad;
- rollback por capacidad;
- medición de cuota y ráfaga concurrente antes de producción.

