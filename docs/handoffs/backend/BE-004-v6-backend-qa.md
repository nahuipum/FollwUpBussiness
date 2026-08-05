# Handoff — BE-004 — QA Backend afectado v6

## Estado

PASS

## Matriz resumida

| Criterio/control | Implementación revisada | Prueba/evidencia | Estado |
|---|---|---|---|
| SEC-BE004-01 | Sin cambio productivo. El único diff ajusta la construcción del JWT alterado en `InboundJwtAuthenticatorTest`: sustituye un carácter significativo del segmento de firma Base64URL para que el token cambie de forma determinista. | `acceptsSignedCompanyTokenOnlyWhenItsTenantComesFromThePersistedSession` autentica el token firmado, verifica que el `tenantId` procede de la sesión persistida activa y rechaza el JWT con firma alterada mediante `JwtValidationException`. | PASS |
| BE004-AC01..04; SEC-BE004-02..10 | No hay cambios en implementación, migraciones, contratos, permisos, persistencia, idempotencia ni límites arquitectónicos. | Evidencia QA v5 reutilizada: manifiesto v5 completo y 16 pruebas dirigidas PASS, incluidos CAS/CSRF, carrera/replay, auditoría transaccional, Flyway V10 y límites hexagonales. El paquete v6 declara estas superficies sin cambio. | PASS (reutilizado) |

## Comandos y evidencia

- Candidato Git: `0df537f71e8c6ece12e10d95e6824e5af80255d9` (`HEAD`); `git show --stat` confirma un único archivo y seis líneas de diff. `git diff --check <candidato>^ <candidato>`: PASS.
- Integridad: `InboundJwtAuthenticatorTest.java` SHA-256 esperado/obtenido `2779df83b31c0198e500069a286ae09a55c9839827039425f31b176140cc92f6`: PASS. El manifiesto v6 tiene SHA-256 `594CA9EBC98E0F911DA0E2188C80755CC79F9C1EE2423A9B8E1D1533F8CAF575`, conforme al paquete.
- `mvn -q "-Dtest=InboundJwtAuthenticatorTest" test` desde `backend/followupbussiness`: PASS; Surefire: 5 pruebas, 0 fallos, 0 errores, 0 omitidas.

## Hallazgos

Ninguno.

## Regresión relevante y riesgos residuales

- La corrección elimina la fragilidad de alterar bits de relleno Base64URL: la prueba negativa modifica un carácter efectivo de la firma y sigue verificando el rechazo antes de aceptar la autenticación falsificada.
- SEC-BE004-02..10 se reutilizan de QA v5 al no existir cambio de superficie. Riesgos operacionales sin cambio: disponibilidad Redis/PostgreSQL, ciclo HMAC, proxy/IP confiable y retención/purga de digests.
