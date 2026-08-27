# Paquete de contexto — FE-015

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `9e030b7 + rutas-ui-directions + dnd-kit-sortable + espaciado-visitas + botones-modal-homologados + dnd-opaque-id-remediated` (working tree).

## Alcance

Crear y editar una ruta manual `DRAFT` dentro del módulo existente `Rutas`: fecha, vendedor, clientes, secuencia accesible y guardado. Quedan fuera publicación, optimización, navegación/tracking, notificaciones, reasignación y Mobile.

## Contratos estables

`POST /routes` crea el borrador con `date`, `sellerId`, `customerIds` únicos (1..50), `CorrelationId` e `Idempotency-Key`; devuelve `201` y `Route`. `PUT /routes/{routeId}/points/order` requiere permutación completa e `If-Match`, y maneja conflicto. `GET /routes/{routeId}` refresca el borrador. `/sellers` entrega vendedores autorizados paginados; `/customers?sellerId` es la fuente completa y paginada de clientes de cartera dentro del alcance; `/routes/suggested-customers` contiene sólo candidatos vencidos y se usa como sugerencia adicional, no como límite de selección.

`GET /routes/{routeId}/directions` devuelve geometría vial neutral y sus tramos para el orden vigente. `POST /routes/{routeId}/directions/preview` recibe la versión base y una permutación completa de IDs opacos, autorizada sólo sobre un `DRAFT`; calcula la geometría vial efímera para el orden local sin guardar la ruta ni persistir el resultado. La UI conserva ambos resultados sólo en memoria; ante fallo conserva la secuencia aproximada claramente etiquetada como no navegable.

## Delta de revalidación

El arrastre usa `dnd-kit` mediante un controlador dedicado, animando el desplazamiento de las demás visitas y conservando flechas accesibles. Durante el arrastre se desactiva la selección de texto; las listas de crear, ordenar y visualizar comparten espaciado vertical. Las acciones de pie de modal se alinean con Vendedores/Zonas. No cambia contrato, autorización, persistencia ni semántica Directions.

## Invariantes

- COMPANY_ADMIN y SUPERVISOR pueden entrar; SELLER no recibe acción ni formulario. Backend mantiene tenant, equipo, cartera, territorio y recurso como autoridad.
- Local: fecha/vendedor/1..50 clientes obligatorios, sin duplicados; impedir doble envío. Crear una clave de idempotencia por intento lógico.
- Tras `201`, conservar `routeId`, versión, secuencia/nombres autorizados y, sólo en memoria interna, el mapeo opaco `routePointId` necesario para la permutación de `PUT`; jamás renderizar, registrar, persistir o exponer esos IDs. Reordenar con controles arriba/abajo, teclado y anuncio accesible usando `If-Match`. En 409 refrescar, sin sobrescribir en silencio.
- No mostrar ni guardar coordenadas, dirección completa, documentos, teléfonos ni payloads. Limpiar formulario, sugerencias, opciones, borrador, filtros, detalle y caché al logout/cambio de tenant.
- La UI muestra exclusivamente `DRAFT` y preparación para FE-017: jamás invoca publicación.

## Diseño y validación

No existe mock `FE-015`. Reutilizar `company-routes` de FE-014, `DataTable`/filtros, selects, diálogo/modal, alertas, estados async, sesión y servicios de Clientes/Vendedores. Mantener páginas como composición y responsabilidades separadas. Validar pruebas focalizadas, type-check y CI-equivalente por cambios a la composición/servicios/permisos; revisión Security obligatoria.

## Aclaración operativa

`/routes/suggested-customers` está disponible y la HU FE-015 ordena consumirlo; su etiqueta histórica `FE-016` en OpenAPI no bloquea el uso. Es una ayuda de frecuencia, mientras `/customers?sellerId` conserva la selección completa autorizada.
