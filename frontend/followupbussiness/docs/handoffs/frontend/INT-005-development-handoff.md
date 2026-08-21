# Handoff de Desarrollo — INT-005

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD d87b9be + diff 9a24366a7167c41067fab935aad6b331bedb185e`.

- Frontend: Mapa general informa última actualización y error inicial recuperable; el detalle deja de imprimir coordenadas completas. Se conserva lista accesible, selección y limpieza por sesión.
- Backend: `GET /customers` obtiene asignaciones de cartera mediante una lectura por lote tenant-scoped, sin N+1 por cliente.
- Contrato sin cambios: `GeoPoint` WGS84, `Customer`/paginación/filtros y autorización de servidor se preservan. Geoapify ya estaba configurado; no se alteraron clave, proveedor ni dependencias.
- Evidencia: frontend focalizado (9 pruebas) y typecheck `PASS`; backend focalizado, arquitectura/módulos y `mvn -q clean verify` `PASS`; `git diff --check` `PASS`.

Pendiente: QA independiente de ambos alcances y Seguridad por ubicación, privacidad, BOLA y tenant.
