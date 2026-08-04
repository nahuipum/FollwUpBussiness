# Backend Handoff — EN-014

## Estado

READY_FOR_HANDOFF

ADR-013 quedó `Aceptado` el 2026-07-30 después de `PASS` independiente de
Backend QA y Ciberseguridad. Esta aceptación cierra la decisión documental;
no habilita producción hasta ejecutar el spike live y satisfacer sus puertas
preproductivas.

## Alcance implementado

- Selección de MapLibre + Geoapify para renderer/tiles/geocoding.
- Navegación mediante aplicación externa, sin navegación embebida.
- Separación explícita de renderer, tiles, geocoder, PostGIS, launcher y motor
  de rutas.
- Estimación de volumen, cuota, costo, umbrales y condiciones de reevaluación.
- Política de datos, atribución, tenant, secretos, rotación y privacidad.
- Degradación sin clave, red, proveedor o cuota.
- Observabilidad, pruebas, migración y rollback por capacidad.
- Spike Geoapify reproducible y opt-in para direcciones de Perú, estilo
  MapLibre y ráfaga `200`/`429`.

No se implementaron endpoints, servicios, adaptadores, flags runtime,
dependencias, frontend, mobile ni motor de rutas.

## Dominio propietario

Decisión transversal de arquitectura. PostGIS sigue siendo autoridad
geográfica. Los futuros casos de geocodificación pertenecen al límite
aplicativo que se defina para clientes; EN-014 no lo implementa.

## Archivos creados y modificados

| Archivo | Cambio |
|---|---|
| `docs/architecture/adr/ADR-013-mapas-geocodificacion-navegacion.md` | Decisión completa EN-014 |
| `docs/architecture/maps/README.md` | Índice de artefactos |
| `docs/architecture/maps/EN-014-capability-policy.md` | Contrato neutral y trazabilidad |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/geospatial/MapProviderDecisionPolicyTest.java` | Cinco pruebas de política |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/geospatial/GeoapifyLiveSpikeTest.java` | Spike live opt-in |
| `docs/handoffs/backend/EN-014-backend-handoff.md` | Este handoff |

Se preservaron los cambios concurrentes de EN-013 y los directorios ajenos no
relacionados.

## Contratos actualizados

Se agregó el contrato arquitectónico neutral de capacidades geográficas. No se
modificó OpenAPI, eventos, WebSocket ni sync porque EN-014 no implementa una
superficie productiva.

## Datos y migraciones

No aplica migración. Se ratifica punto WGS84/SRID 4326 en PostGIS y metros para
distancias. Los puntos confirmados sobreviven a un cambio de proveedor y no se
re-geocodifican automáticamente.

## Seguridad y aislamiento multiempresa

- El geocoder solo puede recibir dirección normalizada y sesgo geográfico.
- Se prohíbe enviar tenant, IDs, nombres, documento, teléfono, vendedor o ruta.
- Cache, rate limits y métricas futuras quedan segregados por tenant.
- La clave server-side es secreto; el token cliente de tiles se considera
  público, restringido, separado por ambiente/canal y revocable.
- Logs y métricas no contienen claves, dirección ni coordenadas completas.
- Se exige revisión de términos, atribución, DPA y restricciones de clave antes
  de producción.

## Pruebas agregadas

- 5 pruebas deterministas de selección, cuotas, minimización de datos,
  degradación, rotación, rollback, alternativas y fuentes.
- 1 spike live opt-in:
  - Lima, Arequipa y Cusco;
  - país/rango de coordenadas;
  - estilo `osm-bright`;
  - diez solicitudes concurrentes;
  - aceptación de `200`/`429` y cero impresión de clave.

## Comandos ejecutados

| Comando | Resultado | Evidencia relevante |
|---|---|---|
| `Get-ChildItem Env: ... GEOAPIFY ...` | Sin credencial | No existe `FOLLOW_UP_BUSSINESS_GEOAPIFY_SPIKE_KEY`; no se ejecutó tráfico live |
| `mvn "-Dtest=MapProviderDecisionPolicyTest" test` | PASS final | 5 tests, 0 fallos |
| `Remove-Item Env:FOLLOW_UP_BUSSINESS_GEOAPIFY_SPIKE_KEY ...; mvn "-Dtest=GeoapifyLiveSpikeTest" test` | PASS/SKIPPED esperado | 1 test, 0 fallos, 1 skipped; cero red |
| `Remove-Item Env:FOLLOW_UP_BUSSINESS_GEOAPIFY_SPIKE_KEY ...; mvn "-Dtest=MapProviderDecisionPolicyTest,GeoapifyLiveSpikeTest" test` | PASS | 6 tests, 0 fallos, 1 skipped |
| `Remove-Item Env:FOLLOW_UP_BUSSINESS_GEOAPIFY_SPIKE_KEY ...; mvn clean verify` | PASS antes del último refuerzo focalizado | 108 tests, 0 fallos, 1 skipped; SBOM generado |
| `mvn clean verify` final | Interrumpido externamente | No se usa como evidencia final; la prueba focalizada posterior sí pasó |
| `git diff --check` | PASS en la revisión previa al handoff | Sin errores de whitespace en cambios rastreados |

La primera iteración de la prueba documental falló por aserciones sensibles a
saltos de línea; se corrigieron y la ejecución focalizada final pasó.

## Criterios de aceptación

| Criterio | Implementación | Evidencia | Estado |
|---|---|---|---|
| Volumen, cuotas, costo y límites | Modelo de 600 créditos/día/empresa, cuota 3,000, 5 req/s, umbrales 70/85/95% | ADR-013 y prueba de política | Implementado |
| Datos enviados y protección multiempresa | Allowlist/denylist, confirmación humana, PostGIS, cache/logs segregados | ADR y política neutral | Implementado |
| Sin proveedor/clave/red/cuota | Captura manual, lista/tabla, estado limitado/deshabilitado, navegación alternativa | Matriz de degradación | Implementado |
| Separación de capacidades | Renderer, tiles, geocoder, PostGIS, launcher y EN-018 independientes | ADR y tabla de capacidades | Implementado |
| Pruebas, observabilidad, rotación y rollback | Métricas, alertas, doble clave, reversión y spike opt-in | ADR, pruebas y comandos | Implementado |

## Riesgos residuales

- No hubo credencial: no se validaron live calidad, latencia, tiles ni `429`.
- El límite de 5 req/s puede afectar una carga MapLibre antes de la cuota.
- `USD 0` depende de número de empresas/sesiones y términos vigentes.
- Términos comerciales, DPA, atribución y restricciones de tokens requieren
  revisión independiente antes del piloto.
- La compatibilidad del adaptador MapLibre Flutter debe validarse en su historia.

## Pendientes conocidos

- Ejecutar el spike con una clave efímera y restringida antes de producción.
- QA Backend, Frontend/Mobile, Ciberseguridad y DoF deben revisar la decisión.
- Las historias consumidoras implementarán contratos runtime y pruebas E2E.

## Instrucciones de reproducción

Prueba determinista:

```powershell
cd backend/followupbussiness
mvn "-Dtest=MapProviderDecisionPolicyTest" test
```

Spike live: inyectar `FOLLOW_UP_BUSSINESS_GEOAPIFY_SPIKE_KEY` desde un secreto del
proceso, sin escribirlo en el comando, historial o repositorio, y ejecutar:

```powershell
cd backend/followupbussiness
mvn "-Dtest=GeoapifyLiveSpikeTest" test
Remove-Item Env:FOLLOW_UP_BUSSINESS_GEOAPIFY_SPIKE_KEY -ErrorAction SilentlyContinue
```

La ejecución consume como máximo 13 geocodificaciones y una solicitud de
estilo. Usa únicamente hitos públicos representativos de Perú.

## Recomendación para QA

Revisar la aritmética con el volumen real del piloto, probar dos cargas
MapLibre concurrentes, verificar visualmente atribución y fallos de tiles,
forzar `429`, validar que ningún dato de negocio llegue al proveedor y revisar
que los puntos confirmados permanezcan intactos al cambiar geocoder.

