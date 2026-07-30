# Arquitectura de rutas

Artefactos de decisión y contratos neutrales del dominio `routing`.

| Historia | Artefacto | Estado |
|---|---|---|
| EN-018 | [ADR-014](../adr/ADR-014-motor-rutas-limites-mvp.md) | Aceptado |
| EN-018 | [Contrato neutral del motor](EN-018-route-engine-policy.md) | Aceptado |
| EN-018 | [Backend handoff](../../handoffs/backend/EN-018-backend-handoff.md) | PASS — completado |

## Alcance

EN-018 decide OR-Tools con una matriz neutral y Mapbox Matrix como proveedor
inicial del MVP. Confirma un vehículo, hasta nueve clientes, inicio/final
explícitos, once nodos, ventanas duras, duración de servicio, prioridad por
penalización, timeout, reproducción y fallback manual.

La implementación productiva corresponde a BE-022 y sus consumidoras. Estos
artefactos no crean endpoints, persistencia, adaptadores runtime ni publicación
automática. OR-Tools permanece en scope Maven `test` hasta que BE-022 evalúe y
apruebe su incorporación productiva.

## Contrato OpenAPI

La operación existente `POST /routes/optimize` materializa la decisión sin
implementar runtime. `x-story-ids` incluye EN-018 y el request exige `routeId`,
`baseRouteVersion`, fecha, vendedor, territorio/zona, inicio, final,
disponibilidad y 1..9 visitas con duración, prioridad y ventanas duras
opcionales. La respuesta identifica ruta/propuesta/versiones, declara
`published: false`, separa visitas ordenadas/no asignadas y expone totales,
optimalidad e instante de generación. `409` cubre versión base obsoleta y `503`
la indisponibilidad neutral del motor/proveedor.

Validación desde la raíz:

```powershell
npx --yes @redocly/cli lint docs/api/openapi.yaml
```

`route.published` v1 no cambia porque optimizar no publica. Mobile continúa
recibiendo únicamente `Route.version` mediante bootstrap/snapshot después de
la publicación explícita; EN-018 no amplía eventos ni sync.

## Evidencia determinista

Desde `backend/followupbussiness`:

```powershell
.\mvnw.cmd "-Dtest=RouteEngineDecisionPolicyTest,OrToolsRouteModelTest" test
```

Las pruebas cubren el OpenAPI real, eventos/mobile, la decisión documental y un
modelo OR-Tools real con un
vehículo, inicio/final distintos, ventanas, duración de visita, prioridad
mediante disjunction, descarte inviable, límite temporal y repetibilidad.

## Spike live de Mapbox Matrix

`MapboxMatrixLiveSpikeTest` es opt-in y solo consulta variables de entorno, en
este orden:

1. `FIELD_SALES_MAPBOX_MATRIX`
2. `FIELD_SALES_MAPBOX_MATRIX_SPIKE_KEY`
3. `MAPBOX_ACCESS_TOKEN`

El test no abre `.env`. Para una validación local desde la raíz del repositorio,
el proceso invocador puede extraer un alias de `.env`, inyectarlo temporalmente
y eliminarlo al finalizar sin imprimir el valor:

```powershell
$entry = Get-Content -LiteralPath .env |
    Where-Object { $_ -match '^\s*(FIELD_SALES_MAPBOX_MATRIX|FIELD_SALES_MAPBOX_MATRIX_SPIKE_KEY|MAPBOX_ACCESS_TOKEN)\s*=' } |
    Select-Object -First 1
if (-not $entry) { throw 'No Mapbox Matrix token alias found in .env' }
$ignored, $value = $entry -split '=', 2
$env:FIELD_SALES_MAPBOX_MATRIX_SPIKE_KEY = $value.Trim().Trim('"').Trim("'")
Push-Location backend/followupbussiness
try {
    .\mvnw.cmd "-Dtest=MapboxMatrixLiveSpikeTest" test
} finally {
    Pop-Location
    Remove-Item Env:\FIELD_SALES_MAPBOX_MATRIX_SPIKE_KEY -ErrorAction SilentlyContinue
}
```

La ejecución realiza cuatro solicitudes controladas: una sin token que debe
responder `401`, otra con 26 coordenadas que debe responder `422`, una matriz
3×3 para conectividad vial Lima–Arequipa–Cusco y una matriz `mapbox/driving` de
once nodos públicos en Lima. Esta última valida 121 duraciones y 121 distancias
no negativas, diagonal cero, inicio/final distintos y latencia menor de 15
segundos. No genera ráfagas ni fuerza `429`; nunca imprime token, URI
autenticada, coordenadas o payload.
## Evidencia ejecutada

El 2026-07-30 se ejecutaron las focalizadas EN-018:

- deterministas finales tras corrección QA: 9 tests, 0 fallos, 0 errores, 0 omitidos;
- Redocly: OpenAPI válido con configuración recomendada;
- `clean verify` posterior a corrección QA: BUILD SUCCESS, 121 tests, 0 fallos,
  0 errores, 5 omitidos, JAR y SBOM generados; cuatro omisiones son el spike
  Mapbox opt-in sin variables en esa invocación;
- live Mapbox: 4 tests, 0 fallos, 0 errores, 0 omitidos;
- matriz Lima: 11 nodos, 121 elementos, `latencyMs=526`, estado `200`;
- conectividad Lima–Arequipa–Cusco, `401` sin token y `422` con 26
  coordenadas: validados.

Esta es evidencia técnica puntual del spike; no constituye SLA ni aceptación
de términos. Backend QA y Ciberseguridad emitieron `PASS` independiente para
EN-018; DoF emitió `PASS` y los gates productivos corresponden a BE-022.
