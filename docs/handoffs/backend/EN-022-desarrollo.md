# EN-022 — Desarrollo Backend

**Estado:** `READY_FOR_HANDOFF`
**Candidate-ID:** `HEAD+a189f4d EN022-5ec390c8640b`

## Alcance

Se extiende `POST /routes` a `visits[{customerId,serviceDurationSeconds}]`.
`CreateRouteService` autoriza tenant/equipo/cartera, persiste `DRAFT` y captura
un `PlanningSnapshot VALID` solo con `CompanySettings.timezone`, jornada local
configurada y matriz dirigida completa. Sin jornada o matriz, se persiste
`INCOMPLETE`; `PublishRouteService` conserva el bloqueo `409`, sin auditoría u
outbox de publicación. No hay endpoint de snapshot ni cambio en `route.published`.

## Archivos y contrato

- [CreateRouteService.java](C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/backend/followupbussiness/src/main/java/com/nahui/followupbussiness/routing/application/CreateRouteService.java), puertos/persistencia/configuración de `routing`.
- [V53__add_company_planning_day.sql](C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/backend/followupbussiness/src/main/resources/db/migration/V53__add_company_planning_day.sql) agrega jornada opcional, atómica y sin default.
- [openapi.yaml](C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/docs/api/openapi.yaml) refleja visitas con duración y jornada de empresa.

## Evidencia

- `mvn -q "-Dtest=CreateRouteServiceTest,CompanySettingsServiceTest,CompanySettingsControllerTest" test "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository"` — PASS.
- `mvn -q "-Dtest=RouteControllerTest,PublishRouteServiceTest,RoutingConfigurationTest" test "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository"` — PASS.
- `mvn -q clean verify ...` — no ejecutable: `target` estaba bloqueado por un proceso externo al limpiar. Reintentar en QA/CI tras liberar el directorio.

Cubre duración inválida, jornada ausente, matriz incompleta, éxito `VALID` aislado por tenant y regresión de publicación. Reproducir: configurar `08:00–18:00`, crear ruta con duración positiva y matriz completa; publicar con `If-Match` válido. Sin configuración o matriz completa queda `DRAFT` y publish responde `409` sin evento.

## Delta de contrato

Se corrigió [openapi.yaml](C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/docs/api/openapi.yaml): `CreateRouteRequest.visits` declara `{customerId, serviceDurationSeconds}` y no UUIDs. Se restauró `routePointIds` como lista UUID y se añadió la aserción contractual en `RouteEngineDecisionPolicyTest`.

- `mvn -q "-Dtest=RouteEngineDecisionPolicyTest,RouteControllerTest" test "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository"` — PASS.

## Delta QA autorizado

La matriz de snapshot ya no recibe coordenada externa: contiene únicamente los
clientes y pares dirigidos distintos. La primera visita inicia en jornada y la
última finaliza tras servicio; reordenar no busca `START`. Se actualizaron la
política y OpenAPI, con pruebas de una visita sin piernas y 50 visitas/2,450
pares. `clean verify` siguió bloqueado por `target` durante `clean`.

## Delta Security

Se rechaza snapshot vencido antes de publicar y un cambio efectivo de zona o
jornada invalida `VALID` tenant-scoped en la misma transacción de settings.
La captura compone bloques de cinco clientes (máximo diez coordenadas) y cubre
todas las direcciones sin elevar el límite del adaptador; un hueco deja
`INCOMPLETE`. El Maven focalizado no pudo compilar por acceso bloqueado a
`google-cloud-monitoring-3.52.0.jar`; `git diff --check` PASS.

## Delta Security final

La captura vuelve a comprobar la versión de empresa antes de persistir; un
cambio concurrente deja `INCOMPLETE`. La composición rechaza `seconds/meters`
no positivos fuera de diagonal y selecciona bloques de cuatro cuando el resto
sería uno, sin llamadas degeneradas.

## Delta de remediación puntual

`CreateRouteServiceTest.incompleteMatrixCreatesDraftAndNeverValidSnapshot`
ahora modela dos clientes con matriz parcial y verifica `saveIncomplete`; el
caso de una visita verifica `VALID`, sin piernas ni llamada a matriz.

- `mvn -q "-Dtest=CreateRouteServiceTest" test "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository"` — PASS.
- `git diff --check` — pendiente de la validación final del candidato.
