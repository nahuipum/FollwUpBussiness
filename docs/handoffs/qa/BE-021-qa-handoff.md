# BE-021 — QA Backend

**Estado:** `PASS`  
**Candidate-ID:** `27f65e2+BE021-F21FF90E9F50`.

## Hallazgo

**Cerrado.** `startLocation` fluye desde `RouteController` hasta comando, agregado, fingerprint SHA-256, geometría PostGIS/JDBC y respuesta. Misma clave con ubicación distinta devuelve conflicto; replay exacto devuelve la ruta consistente.

## Evidencia

- `mvn -q "-Dtest=CreateRouteServiceTest" test`: `PASS`.
- `mvn -q "-Dtest=TerritoryUniquenessIntegrationTest" test`: `PASS`, Flyway hasta `V42`/PostGIS.
- `git diff --check`: `PASS`.

## Riesgo residual

Revalidación de Seguridad: el replay exacto llama `authorizeCurrentAccess` antes de `routes.find`; pérdida de equipo devuelve `403` sin `find`, `save` ni auditoría. Replay autorizado conserva la misma ruta. `mvn -q "-Dtest=CreateRouteServiceTest" test` y `git diff --check`: `PASS`. No se ejecutó integración REST/PostgreSQL de revocación; rol, vendedor inactivo y cartera se inspeccionaron por flujo de código, y la prueba nueva cubre equipo.
