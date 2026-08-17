# Handoff Development — BE-010 (remediación QA)

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `HEAD d63e4bc + BE-010 status/tenant-CAS/revocación BE-005/guard de asignación`.

## Remediación y alcance

- Se confirmó con `rg` que no hay productor alcanzable de rutas o asignaciones: `routing`, `journeys` y `visits` contienen únicamente `package-info`; tampoco existe tabla, puerto, handler o controlador que acepte `sellerId` para asignar rutas. Por ello no se inventaron capacidades ni se modificó OpenAPI/persistencia.
- Se añadió el guard de dominio reutilizable `Seller.requireActiveForAssignment()` en [Seller.java](../../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/workforce/domain/Seller.java). Rechaza `INACTIVE` antes de cualquier escritura; el futuro productor de rutas/asignaciones debe invocarlo antes de persistir. No modifica perfil, relaciones, rutas históricas, sesiones ni auditoría.
- Se preserva la implementación original de transición, tenant-CAS, auditoría y revocación BE-005 en `SellerService`/`JdbcSellerStore`.

## Evidencia

- `mvn -q -Dtest=SellerStatusServiceTest test` — PASS.
- `git diff --check` — PASS.
- [SellerStatusServiceTest.java](../../../backend/followupbussiness/src/test/java/com/nahui/followupbussiness/workforce/application/SellerStatusServiceTest.java) verifica que el guard rechaza el vendedor inactivo y deja el contador de escritura en cero; conserva las pruebas previas de transición, autorización, tenant y CAS.
- `mvn -q clean verify` del candidato anterior fue PASS; no se reejecutó porque esta remediación sólo añade guard puro y prueba focalizada, sin composición, persistencia ni transacción.

## Riesgo/superficie no alcanzable

No existe hoy una asignación nueva que pueda ejecutarse y evadir el guard. Al implementarse el primer productor, debe llamar `requireActiveForAssignment()` y aportar prueba integrada de rechazo sin escrituras; hasta entonces no hay ruta/asignación operativa que reproducir.
