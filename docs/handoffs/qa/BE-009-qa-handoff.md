# BE-009 — QA independiente (revalidación)

Estado: `PASS`  
Candidate-ID: `HEAD eaa8cf5 + BE-009 PATCH seller update, tenant/ETag/audit/advisory-lock`.

## Cierre y evidencia

- El delta elimina `V28`; por tanto no introduce índice ni transformación de datos y no bloquea instalaciones que ya contengan duplicados históricos.
- Para un cambio no nulo de `employeeCode`, `SellerService.update` adquiere dentro de `@Transactional` un bloqueo asesorado por `tenantId:código-normalizado`, luego comprueba duplicado y ejecuta la actualización condicionada por tenant y versión. Dos cambios concurrentes al mismo código quedan serializados; el segundo observa el primero y responde conflicto, sin escritura ni auditoría parcial.
- `SellerUpdateServiceTest` comprueba actualización/preservación, denegación tenant/rol, versión obsoleta, conflicto por duplicado y que se toma el bloqueo sin escrituras/auditorías en el rechazo.

## Comandos

- `mvn -q '-Dtest=SellerUpdateServiceTest' test` — PASS.
- Se reutiliza la regresión previa: `git diff --check` — PASS.

Sin hallazgos bloqueantes en el delta. Riesgo residual: no hay prueba de integración que ejecute dos transacciones PostgreSQL concurrentes; el comportamiento queda cubierto por la secuencia transaccional y prueba unitaria focalizada.
