# Paquete de contexto — BE-014 Editar cliente y ubicación

**Estado actual:** `READY_FOR_DOF`
**Candidate-ID:** `HEAD b438de1 + diff BE-014 final (PATCH clientes, validación GeoPoint y evidencia tenant/rol)`.

## Predecesora y alcance

`BE-013` tiene DoF `PASS` para `HEAD dde8160… + dbb4655c`; su contrato de clientes y persistencia PostGIS queda estable. Implementar únicamente `PATCH /customers/{customerId}`: editar datos permitidos, ubicación, territorio o estado de un cliente, sin borrar ni alterar historial, cartera, rutas, visitas, ventas o asignaciones. No modificar OpenAPI, geocodificación, duplicados de BE-015, vendedores ni contratos sin decisión explícita.

## Contrato y autorización

OpenAPI declara `x-required-roles: [COMPANY_ADMIN]`, `If-Match`, `CorrelationId`, respuesta `200` y errores `400/403/404/409/422`. `UpdateCustomerRequest` tiene `minProperties: 1`, `additionalProperties: false` y permite solo `name`, `documentType`, `documentNumber`, `phone`, `email`, `address`, `location`, `visitFrequencyDays`, `territoryId`, `status`, con sus límites publicados. Únicamente `COMPANY_ADMIN` del tenant derivado de sesión puede mutar; `SUPERVISOR`, `SELLER`, no autenticado, `PLATFORM_SUPERADMIN` y otros roles se deniegan. Nunca derivar tenant de body, `customerId` o `territoryId`; recurso ajeno no se revela.

## Reglas e invariantes

- Éxito: `If-Match` actual, parche válido y territorio activo del mismo tenant actualizan atómicamente, conservan no modificados e insertan auditoría anterior/nuevo permitida.
- Denegación/no-op: `403/404/400/422` según contrato, cero escritura, auditoría, evento o exposición de PII/ubicación; propagar `correlationId` y solo errores genéricos.
- Conflicto: versión obsoleta devuelve `409`, conserva valor previo y cero efectos secundarios.
- Ubicación: WGS84/EPSG:4326, latitude `[-90,90]`, longitude `[-180,180]`, PostGIS SRID 4326.
- Fallo: autorización, validación, territorio, persistencia o auditoría revierten toda la operación; estado respeta disponibilidad/historial vigente. Duplicados siguen política existente y no se reimplementa BE-015.

Puertos alcanzables: actor/sesión, almacenamiento de cliente PostGIS, consulta territorial, transacción/auditoría y observabilidad/correlation. Política por sink: dirección, coordenadas, documento, teléfono y email se omiten o enmascaran en logs/métricas/evidencia; auditoría solo conserva categorías aprobadas, antes/después restringidos.

## Evidencia esperada

Pruebas focalizadas de campos permitidos, rol/tenant, `If-Match`, GeoPoint/SRID, territorio activo/ajeno/inactivo, validación estructural, atomicidad, historial y privacidad. Por afectar persistencia espacial, transacción, autorización, auditoría y serialización: ejecutar CI-equivalente local. Artefactos únicos: Dev, QA, Seguridad aplicable y DoF.

## Delta de Seguridad

Las pruebas exactas de `COMPANY_ADMIN` cross-tenant con versión vigente y `SUPERVISOR` propietario ya existen y QA las aprobó. Tras liberar el bloqueo local, Seguridad ejecutó una invocación Maven focalizada y aprobó ambos abusos sin efectos ni filtración. Lista para DoF.

## Delta de Desarrollo

La remediación mínima hizo no final `UpdateCustomerService` para conservar el proxy CGLIB de `@Transactional`. Tras QA, `Update.location` valida anidadamente `GeoPoint` y cubre `latitude: null` como `400`, sin invocar el caso de uso. Focalizadas aprobadas; se reutiliza `clean verify` previo porque el delta sólo cambia validación DTO REST, sin composición, persistencia ni serialización compartida.
