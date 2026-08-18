# Paquete de contexto — BE-015

**Estado:** `PASS`  
**Candidate-ID:** `HEAD ef3804e + diff da53191e`.

## Compuerta de predecesoras

- `BE-013`: lista. DoF `PASS` en `docs/handoffs/dof/BE-013-dof.md` para el candidato `dde8160`.
- `EN-014`: contrato estable para este alcance. `ADR-013` fue aceptado y `docs/architecture/maps/EN-014-capability-policy.md` asigna las consultas de proximidad y duplicados a PostgreSQL/PostGIS, sin proveedor externo ni geocodificación. Su handoff documental conserva pendientes de cierre, pero no deja ambigua esta capacidad.

## Bloqueo contractual

La decisión aprobada delimita BE-015 a documento, teléfono, dirección, nombre comercial y proximidad geográfica PostGIS; el código de cliente queda diferido hasta que exista como atributo contractual. Se actualizaron `RN-015`, BE-015 y OpenAPI: `CustomerDuplicateCheckRequest` ahora admite `address` y `matchedFields` incluye `ADDRESS`.

No se infiere ni introduce código de cliente. Producto/Contrato de Clientes aprobó: radio PostGIS de 100 m; `trim` y comparación sin distinguir mayúsculas para documento, teléfono, nombre y dirección; documento y teléfono ignoran también espacios y guiones; `score = campos coincidentes / 5` para documento, teléfono, nombre, dirección y ubicación. No existe owner personal registrado para ese rol.

### Evidencia de implementación existente

`address` ya existe y es obligatorio en el modelo, migración, persistencia y contratos de creación/edición de clientes. No existe código de cliente: `customer` no tiene columna de código y el agregado, store, controlador y OpenAPI de clientes tampoco lo declaran. La decisión aprobada evita prometer ese dato inexistente.

## Decisión requerida para desbloquear

Desarrollo completó BE-015 con consulta PostGIS de lectura, tenant de sesión, `COMPANY_ADMIN`, exclusión acotada y pruebas focalizadas PASS. QA independiente emitió `PASS`: prueba Maven focalizada (9, con Testcontainers/PostGIS) y `git diff --check` pasaron; no halló escrituras, filtración PII ni aislamiento insuficiente. Seguridad emitió `PASS` tras reproducir exclusión/atributos cross-tenant y denegación de rol. `clean verify` no obtuvo veredicto local por límite operativo; queda como riesgo de release, sin cambiar el Candidate-ID.

DoF emitió `PASS`: los cuatro artefactos y estados coinciden con el Candidate-ID; `git diff --check` pasó. No se autorizó commit, push, PR ni release.
