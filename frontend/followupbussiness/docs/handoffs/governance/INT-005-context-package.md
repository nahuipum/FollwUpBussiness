# Paquete de contexto — INT-005 Cliente visible en mapa

**Estado:** `DoF PASS`.  
**Candidate-ID:** `HEAD d87b9be + diff 9a24366a7167c41067fab935aad6b331bedb185e`.

## Alcance y contratos verificados

- Integración: `POST/PATCH/GET /customers`, cartera (`BE-060`) y páginas FE-008/009/010.
- `GeoPoint`: `latitude` decimal `[-90,90]`, `longitude` decimal `[-180,180]`, SRID 4326; `Customer` devuelve `status`, `assignedSellerIds`, `createdAt`, `updatedAt`, `version` y ubicación.
- Backend deriva tenant y alcance por cartera/equipo: admin (tenant), supervisor (equipo) y seller (cartera). El mapa web solo está disponible para admin/supervisor; mobile aún no contiene capacidad de clientes.

## Hallazgos del diagnóstico

1. **Alta, Frontend:** el detalle de cliente muestra coordenadas exactas; se debe minimizarlas o confirmar autorización explícita.
2. **Media, Frontend:** Mapa general no presenta `lastUpdated` y un error inicial se anuncia también como vacío.
3. **Media, Backend:** `GET /customers` materializa cartera por cliente (N+1). Desalineaciones BE-060/OpenAPI quedan fuera de la remediación mínima de visualización, salvo que afecten la capacidad.

## Configuración de mapa

`ClientMap` requiere `VITE_GEOAPIFY_TILE_KEY` para renderizar MapLibre con tiles Geoapify. Se verificó, sin revelar secretos, que `.env` de la aplicación contiene la clave con valor. Geoapify/MapLibre ya forman parte de la configuración existente; no se cambiarán proveedor, dominios, clave ni dependencias.

## Siguiente transición

Development aplicará exclusivamente la remediación de INT-005; entonces fijará Candidate-ID y producirá el handoff mínimo.

## Desarrollo entregado

- Frontend: minimiza coordenadas en lectura; muestra última actualización; el error inicial es recuperable y no se anuncia como vacío.
- Backend: lectura masiva de cartera para la página de clientes, acotada a 200 IDs y al tenant.
- Validaciones Dev: focalizadas Frontend, `npm run typecheck`, pruebas focalizadas Backend con arquitectura/módulos, `mvn -q clean verify` y `git diff --check`: `PASS`.
