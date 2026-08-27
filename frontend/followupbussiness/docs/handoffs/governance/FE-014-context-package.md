# Paquete de contexto — FE-014

**Estado:** `READY_FOR_DEVELOPMENT`  
**Candidate-ID:** `9e030b7 + FE-014 rutas-ui + tenant-detail-clear + lint-react-hooks` (working tree, sin commit).

## Alcance

Listado administrativo de solo lectura en la opción única `Rutas` del sidebar para COMPANY_ADMIN y SUPERVISOR. Incluye filtros `date`, `sellerId`, `status`, paginación y detalle; excluye mutaciones, seguimiento, optimización, publicación, reasignación y notificaciones.

## Contrato estable

BE-061 está disponible: `GET /routes` responde `RoutePage`; `GET /routes/{routeId}` responde `Route`. El servidor determina tenant, rol y equipo antes de filtrar/paginar; fuera de alcance devuelve resultado neutro según contrato. `Route` incluye `sellerId`, puntos, estado, versión y actualización; `RoutePoint.customerName` es opcional. OpenAPI no contiene nombre legible del vendedor: reutilizar la carga/búsqueda de vendedores existente, sin N+1 ni cambio de Backend.

## Invariantes

- UI visible y rutas solo para COMPANY_ADMIN/SUPERVISOR; SELLER no recibe enlace ni página administrativa.
- El servidor conserva la autoridad: no confiar en `sellerId`, `routeId`, URL, filtros ni paginación manipulados. Ante 403/404 no conservar datos previos como válidos.
- No mostrar ni registrar dirección completa, coordenadas, payloads ni datos de cliente innecesarios. En detalle, mostrar únicamente secuencia y nombre autorizado cuando exista.
- Limpiar resultados, filtros, detalle y cualquier caché al logout o cambio de tenant/sesión.
- Un único módulo/entrada `Rutas` prepara las futuras HUs mediante composición interna; no crear pestañas ni otra sección ahora.

## Referencias y validación esperada

No existe `docs/frontendMockups/FE-014*.html`; reutilizar patrones de Clientes/Vendedores, DataTable, filtros, diálogos y manejo global de errores. Implementar pruebas focalizadas, type-check y CI-equivalente frontend por cambios de navegación/servicio/permisos. Seguridad obligatoria: tenant, alcance de supervisor, IDs manipulados y privacidad.
