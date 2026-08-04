# Backend Handoff — EN-018

## Estado

PASS — completado

Decisión documental aceptada después de `PASS` independiente de Backend QA,
Ciberseguridad y DoF. No autoriza uso productivo de OR-Tools/Mapbox; los gates
de implementación y producción corresponden a BE-022.

## Revisiones independientes

| Revisión | Resultado | Evidencia |
|---|---|---|
| Backend QA | PASS | `BQ-EN018-001` y `BQ-EN018-002` cerrados |
| Ciberseguridad | PASS | Sin hallazgos Critical, High ni Medium |
| DoF | PASS | Cierre independiente de EN-018 validado |

Los gates de dependencia productiva, integración, autorización, aislamiento
multiempresa y operación se trasladan a BE-022.

## Alcance implementado

- OR-Tools con matriz neutral y Mapbox Matrix como proveedor inicial del MVP.
- Un vehículo, hasta nueve clientes, once nodos, inicio/final explícitos,
  ventanas duras, duración, prioridad por penalización y timeout.
- Cuota/costo condicionado, fallback manual, reproducción, versionado y
  conservación de edición humana.
- OR-Tools 9.15.6755 únicamente en scope Maven `test`.
- Modelo OR-Tools real y spike Mapbox live opt-in.
- Contrato existente `POST /routes/optimize` alineado con ADR-014: ruta y
  versión base, zona, restricciones por visita, propuesta no publicada,
  resultados neutrales y errores `409`/`503`.

No se implementaron endpoints, adaptadores runtime, configuración productiva,
persistencia, migraciones, eventos ni publicación automática.

## Dominio propietario

`routing`. PostGIS SRID 4326 sigue siendo autoridad geográfica; Mapbox solo
recibe coordenadas WGS84.

## Archivos creados y modificados

| Archivo | Cambio |
|---|---|
| `docs/architecture/adr/ADR-014-motor-rutas-limites-mvp.md` | Decisión, límites, seguridad, resiliencia y rollback |
| `docs/architecture/routing/EN-018-route-engine-policy.md` | Contrato neutral y estados futuros |
| `docs/architecture/routing/README.md` | Índice y reproducción determinista/live |
| `docs/api/openapi.yaml` | Contrato EN-018 de `POST /routes/optimize` |
| `docs/api/TRACEABILITY.md` | Trazabilidad de EN-018 sobre `/routes*` |
| `backend/followupbussiness/pom.xml` | OR-Tools 9.15.6755 en scope `test` |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/routing/RouteEngineDecisionPolicyTest.java` | Seis pruebas documentales/contractuales |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/routing/OrToolsRouteModelTest.java` | Modelo OR-Tools real |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/routing/MapboxMatrixLiveSpikeTest.java` | Spike live opt-in |
| `docs/handoffs/backend/EN-018-backend-handoff.md` | Este handoff |

Se preservaron cambios ajenos bajo `jira/`, `tools/` y fuera de EN-018.

## Contratos actualizados

ADR-014, la policy y OpenAPI documentan entradas, salidas, límites, errores,
versionado y datos permitidos al proveedor. Se actualizó la operación existente
`POST /routes/optimize`; no se creó un endpoint ni implementación runtime.
`route.published` v1 y `Route.version` mobile siguen siendo suficientes porque
una propuesta no publicada no emite evento ni se sincroniza.

## Datos y migraciones

No aplica. No se creó ni modificó esquema. PostgreSQL seguirá siendo fuente de
verdad; las propuestas futuras conservarán snapshot/hash de entrada y matriz.

## Seguridad y aislamiento multiempresa

- Tenant, actor, ruta, vendedor, territorio y clientes se derivan/autorizan
  desde sesión y deben pertenecer al mismo tenant.
- Mapbox nunca recibe `tenantId`, IDs, nombres, direcciones ni prioridades.
- El spike solo consulta `FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX`,
  `FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX_SPIKE_KEY` o `MAPBOX_ACCESS_TOKEN`.
- No abre `.env`, no sigue redirects y no imprime token, URI autenticada,
  coordenadas ni payload.
- Cache, cuotas, rate limits y locks futuros quedan segregados por tenant y
  ambiente. No se identificó riesgo Critical o High en este alcance de prueba.

## Pruebas agregadas

- 6 pruebas documentales/contractuales de decisión, OpenAPI, evento/mobile,
  cuota, fallback, versionado y seguridad.
- 3 pruebas OR-Tools reales: restricciones/priority-disjunction/drop,
  repetibilidad con once nodos y límite temporal.
- 4 pruebas Mapbox live opt-in: `401` sin token, `422` con 26 coordenadas,
  conectividad Lima–Arequipa–Cusco y matriz Lima 11×11/121 elementos con
  inicio/final distintos, shape, valores y latencia.

## Comandos ejecutados

| Comando | Resultado | Evidencia relevante |
|---|---|---|
| `npx --yes @redocly/cli lint docs/api/openapi.yaml` | PASS final tras corrección QA | OpenAPI válido con configuración recomendada |
| `.\mvnw.cmd -Dtest=RouteEngineDecisionPolicyTest,OrToolsRouteModelTest test` | PASS final tras corrección QA | 9 tests, 0 fallos, 0 errores, 0 omitidos; BUILD SUCCESS |
| `.\mvnw.cmd "-Dtest=RouteEngineDecisionPolicyTest,OrToolsRouteModelTest" test` | Falló inicialmente | protobuf `setNanos` exigía `int`; corregido con seconds + int nanos |
| Mismo comando, primera repetición | Falló | OR-Tools 3/3; dos aserciones documentales de frase exacta, corregidas |
| `.\mvnw.cmd -DskipTests test` | PASS | Spike Mapbox actualizado compiló; BUILD SUCCESS |
| `.\mvnw.cmd clean verify` | PASS final posterior a corrección QA | BUILD SUCCESS; 121 tests, 0 fallos, 0 errores, 5 omitidos; JAR y SBOM generados. Cuatro omisiones corresponden al spike live opt-in sin variables en esa invocación; el live pasó separado 4/4 |
| `.\mvnw.cmd "-Dtest=MapboxMatrixLiveSpikeTest" test` | PASS | 4 tests, 0 fallos/errores/omitidos; Lima 11 nodos/121 elementos, `latencyMs=526`, `200`; conectividad interurbana y negativos `401`/`422` pasaron |

La validación completa posterior a la corrección contractual pasó y generó los
artefactos de empaquetado y SBOM. El estado actual también queda validado por
Redocly, las nueve pruebas focalizadas y el spike live separado 4/4.

## Criterios de aceptación

| Criterio | Implementación | Evidencia | Estado |
|---|---|---|---|
| Inicio/final, máximo, ventanas y duración | 1 vehículo, 9 clientes, 11 nodos, endpoints, jornada/ventanas y duración | ADR, policy y OR-Tools test | Implementado |
| Métrica y sin tráfico real | Prioridad/valor, segundos y metros; `mapbox/driving`, sin traffic | ADR y policy test | Implementado |
| Cuota, timeout, fallback y reproducción | 79,860 elementos/mes, umbrales, 2–5 s, manual y hashes/snapshot | ADR y pruebas | Implementado |
| Versionado y edición humana | `proposalVersion`, base version, orden inmutable y `MANUAL_EDIT` | ADR y prueba documental | Implementado |
| ADR | Alternativas, decisión, consecuencias, rollback y reevaluación | ADR-014 | Implementado |
| Contrato consumible antes de BE-022 | Request completo con ruta/versión/zona/restricciones; response no publicada/versionada; 409/503 | OpenAPI válido y prueba contractual | Implementado |

## Riesgos residuales

- La evidencia live es una muestra puntual (`latencyMs=526`), no un SLA ni
  garantía de rendimiento, disponibilidad o cuota futura.
- Cuotas, precios y términos pueden cambiar; varios tenants reducen el margen.
- BE-022 debe revisar binarios nativos OR-Tools con SCA/SBOM y plataformas.
- Legal/Seguridad deben validar Matrix junto a MapLibre/Geoapify.

## Pendientes conocidos

- Conservar evidencia sanitizada y repetir el spike antes del piloto si cambian
  proveedor, perfil, token, límites o región.
- BE-022 implementará el OpenAPI acordado, persistencia, permisos y pruebas
  tenant sin cambiar silenciosamente este contrato, y deberá satisfacer los
  gates productivos trasladados.

## Instrucciones de reproducción

Deterministas desde `backend/followupbussiness`:

```powershell
.\mvnw.cmd "-Dtest=RouteEngineDecisionPolicyTest,OrToolsRouteModelTest" test
```

Contrato desde la raíz:

```powershell
npx --yes @redocly/cli lint docs/api/openapi.yaml
```

Live desde la raíz. El wrapper, no el test, extrae el secreto de `.env`:

```powershell
$entry = Get-Content -LiteralPath .env |
    Where-Object { $_ -match '^\s*(FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX|FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX_SPIKE_KEY|MAPBOX_ACCESS_TOKEN)\s*=' } |
    Select-Object -First 1
if (-not $entry) { throw 'No Mapbox Matrix token alias found in .env' }
$ignored, $value = $entry -split '=', 2
$env:FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX_SPIKE_KEY = $value.Trim().Trim('"').Trim("'")
Push-Location backend/followupbussiness
try {
    .\mvnw.cmd "-Dtest=MapboxMatrixLiveSpikeTest" test
} finally {
    Pop-Location
    Remove-Item Env:\FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX_SPIKE_KEY -ErrorAction SilentlyContinue
}
```

## Recomendación para QA

Backend QA ya emitió `PASS` para este alcance documental y cerró
`BQ-EN018-001/002`; no se requiere una nueva ejecución salvo que cambien el
ADR, la policy, el OpenAPI o las pruebas EN-018. DoF ya emitió `PASS`. BE-022
deberá revalidar con código productivo los gates trasladados.
