# Paquete de contexto — FE-010 Mapa de clientes

**Estado:** `PASS`  
**Candidate-ID:** `HEAD e7beb3e + 45 rutas modificadas (475+/113-) y 13 no seguidas; árbol concurrente preservado`.

## Cambio documental vigente

RF-CLI-006 y FE-010 habilitan mapa y lista alternativa para `COMPANY_ADMIN` y `SUPERVISOR`. Admin ve solo su tenant. Supervisor ve exclusivamente clientes de las carteras vigentes de vendedores actualmente asignados a su equipo; sin vendedores/carteras obtiene `items=[]`, `total=0`. El servidor deriva tenant, identidad, rol y equipo; aplica alcance antes de filtros, conteo y paginación. Plataforma no tiene acceso operativo transversal.

## Invariantes y puertos alcanzables

1. Actor/recurso: `GET /customers` recibe actor de sesión; no acepta tenant/rol/equipo como parámetros de autoridad.
2. Éxito: Admin tenant completo; Supervisor solo conjunto de vendedores activos de su equipo y sus asignaciones vigentes.
3. Denegación: rol sin alcance, `sellerId` externo o acceso directo no revela cliente, total ni existencia.
4. Vacío/conflicto: Supervisor sin vendedores/cartera devuelve página vacía; reasignación/cambio de equipo cambia la siguiente lectura autorizada.
5. Fallo/limpieza: `403`, logout o cambio usuario/empresa invalidan requests, datos, filtros, marcadores, lista y selección. Sin escrituras/eventos en lectura.

Puertos: `GET /customers` → `CustomerController` → `PortfolioAccessScopeUseCase` → `CustomerPortfolioReadUseCase` → `CustomerPortfolioStore`/`CustomerStore`; Frontend `company-clients` usa ese resultado único para mapa/lista.

## Estado de implementación previo

El árbol sin commit contiene FE-010 existente con ruta Admin y mapa/lista; debe adaptarse, sin revertir cambios ajenos. Backend ya contiene `PortfolioAccessScopeService`, `CustomerPortfolioReadService` y `JdbcCustomerPortfolioStore`; Development debe comprobar que realmente imponen equipo/cartera vigente antes de filtros, conteo/paginación y completar pruebas si falta. OpenAPI ya admite `GET /customers` para Admin/Supervisor/Seller; no modificar salvo incompatibilidad demostrada.

## Frontend y mapa

Habilitar para Supervisor una ruta/navegación coherente (`/supervisor/clients/map`) sin cambiar el acceso Admin `/company/clients/map`; no duplicar autorización Backend. Filtros, mapa y lista comparten respuesta autorizada. No mostrar opciones de vendedor ajenas al equipo. Preservar loading, vacío, error, forbidden, tiles fallidos y alternativa accesible; sin PII/coords exactas ni geocoding. MapLibre/Geoapify ya aprobados/configurados: no exponer ni cambiar clave/proveedor.

No existe mockup exacto FE-010: preservar Clientes y usar mockup existente solo como patrón visual, sin modificarlo.

## Fuentes consultadas

FE-010, FE-008, BE-016, `contrato-funcional.md` RF-CLI-006, OpenAPI `/customers`/`Customer`/`CustomerPage`/`GeoPoint`, diff actual y símbolos Backend/Frontend alcanzados. La consulta preliminar confirma que el contrato no requiere cambio.

## Desarrollo y bloqueo vigente

`docs/handoffs/frontend/FE-010-desarrollo.md`: `READY_FOR_HANDOFF`. Frontend adapta ruta/navegación de Supervisor, mapa/lista y limpieza; 36 pruebas focalizadas, type-check, lint y build correctos. Backend confirma restricción existente server-side y añade cobertura de vacío, plataforma y cambios de asignación/equipo. Sin cambios OpenAPI/migraciones/arquitectura.

La compilación ajena `workforce` fue reparada en siete pruebas conforme a la firma vigente de `SellerStore`. La prueba focal Backend y `mvn -q -Dmaven.repo.local=C:\Users\LUIS\.m2\repository clean verify` son correctos; `git diff --check` correcto. QA puede iniciar.

## QA independiente

`docs/handoffs/frontend/FE-010-qa.md`: `PASS`. Backend confirma tenant/equipo/cartera antes de filtros, conteo y paginación, vacío de Supervisor y denegaciones sin revelación. Frontend confirmó rutas/roles, fallback y limpieza. El único `CHANGES_REQUIRED` (filtro local desincronizado y fecha de actualización ausente) se corrigió y la revalidación focal pasó. Riesgo residual: verificación preproductiva de tiles/atribución reales.

## Seguridad final

`docs/handoffs/security/FE-010-seguridad.md`: `PASS`. El abuso de cambio tenant con mapa abierto limpió requests, lista, marcadores y selección; no hubo BOLA, PII/ubicaciones, claves ni proveedor nuevos expuestos. Riesgo residual no bloqueante: comprobación preproductiva de tiles/atribución/restricciones Geoapify.

## Definition of Finished

`docs/handoffs/governance/FE-010-dof.md`: `PASS`. Gates, Candidate-ID y validaciones aplicables coinciden; no hay hallazgos abiertos y `git diff --check` es correcto.
