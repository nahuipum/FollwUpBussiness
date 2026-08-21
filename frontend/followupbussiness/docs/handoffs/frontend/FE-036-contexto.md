# Paquete único de contexto — FE-036 Asignar cartera de clientes

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `e7beb3e+ab9c84d218f4`.

**Delta de remediación:** se incorpora la restauración de la ruta directa y se descartan respuestas de asignación obsoletas tras cambiar sesión/empresa; QA debe revalidar este candidato.

## Puerta de predecesoras

- `BE-060`: evidencia previa disponible como DoF `PASS` en el paquete de FE-008.
- `FE-005`: DoF `PASS` en `docs/handoffs/governance/FE-005-dof.md`.
- `FE-008`: DoF `PASS` en `docs/handoffs/governance/FE-008-dof.md`.
- `FE-037`: DoF `PASS` en `docs/handoffs/governance/FE-037-dof.md`; la revisión independiente confirmó rutas, roles y Candidate-ID. 

## Contrato y alcance

OpenAPI estable: `PUT /customers/{customerId}/assignment` recibe `AssignCustomerRequest { sellerIds (>=1, únicos), effectiveFrom, reason? }` y responde `CustomerAssignment`; `POST /customer-assignments/batch` requiere `Idempotency-Key` y recibe hasta 1000 `customerIds`, `sellerIds`, `effectiveFrom`, `reason?`, devolviendo por cliente `ASSIGNED|REJECTED` y `errorCode?`. Ambos son solo `COMPANY_ADMIN`; errores relevantes: 403, 404, 409 y 422.

Reutilizar `GET /customers` (búsqueda, estado, territorio), `GET /sellers` y `GET /territories`; filtrar únicamente `ACTIVE`. Clientes solo exponen `assignedSellerIds`, por lo que los responsables actuales/nuevos se resuelven con la carga paginada/en lote de vendedores ya usada por la pantalla, sin N+1 ni UUIDs visibles. Si algún ID no admite etiqueta humana, mostrar marcador seguro y registrar el gap, nunca inventar un nombre.

Nueva feature `src/features/company-customer-assignments/` por responsabilidad (`api`, `types`, `hooks`, `components`, `styles`, pruebas), solo si no hay scaffold reaprovechable. Ruta `/company/customer-assignments`; en sidebar es una entrada principal inmediatamente tras **Clientes**, nunca hija de este. Solo Admin la ve/accede; Supervisor y Seller no reciben entrada ni ruta. Reutilizar DataTable, filtros de clientes, VisualSelect, ModalSurface/ConfirmationDialog, estados asíncronos, TableActionMenu y estilos de Clientes/Vendedores/Territorios. No existe mockup FE-036; proteger layout/sidebar y adoptar ese sistema visual responsive sin modificar mockups.

## Invariantes y validación

1. Actor/recurso: UI solo habilita Admin y datos activos cargados por Backend; Backend conserva autoridad tenant/permiso/estado.
2. Éxito: no anunciarlo antes de 200; lote presenta cada resultado, sin éxito global si hay rechazo/conflicto; filtros se conservan y se refresca cartera.
3. Denegación: 403/404/409/422/red no escriben ni revelan datos de otro tenant; 409/422 conservan selección para revisión segura.
4. Reintento: una clave de idempotencia por intención de lote, doble envío bloqueado; reintento de la misma intención no duplica filas de resultado.
5. Sesión: logout/cambio de empresa cancela/ignora respuestas y limpia selección, filtros, confirmación, resultados y caché. Sin consola/telemetría de PII, ubicación, IDs ni payloads.

Development debe probar payload individual/masivo, roles/ruta/orden de sidebar, filtros y sesión, confirmación accesible, rechazos parciales e idempotencia; ejecutar pruebas focalizadas, `npm run typecheck`, y por rutas/sidebar/API/sesión también lint y build. Handoff único: `docs/handoffs/frontend/FE-036-desarrollo.md`; siguen QA, Seguridad e informe DoF. Trazabilidad consecuente: `INT-034`.
