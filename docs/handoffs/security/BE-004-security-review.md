# Handoff — BE-004 — Seguridad final

## Estado

PASS

## Paquete de contexto

| ID y versión | Candidato (commit/diff) | Ruta | Estado de vigencia |
|---|---|---|---|
| BE-004 v5 | Base `a7e444a684d032be4da9ee4aac48528a33bd5fd7` + manifiesto v5 (`b13d15f5…f6fea13`) | `docs/handoffs/governance/BE-004-context-package-v5.md` | Vigente; revalidación PASS |

## Lecturas excepcionales de fuentes primarias

| Motivo | Ruta y sección | Hash | Hallazgo o decisión |
|---|---|---|---|
| El paquete resumía CSRF sin precisar que rota con la familia. | `docs/api/openapi.yaml`, `/auth/refresh` y `WebAuthenticationResponse` | `8957594B552D75588DCF24CA1ADAC906AEBA7B7EE1A18B7722436875050792D9` | Confirmó que el CSRF sucesor debe persistirse con la rotación. |

## Seguridad

| Control SEC | Implementación o prueba | Evidencia | Estado |
|---|---|---|---|
| SEC-BE004-01 | RS256/claims. | Pruebas JWT y QA. | PASS |
| SEC-BE004-02 | CSRF WEB. | El CAS actualiza conjuntamente refresh y digest CSRF; integración C0→C1→C2 rechaza C0. | PASS |
| SEC-BE004-03..08 | Sucesor, replay, expiración, tenant, limitador y errores. | Evidencia v4 reutilizada; QA v5 verificó no regresión de CAS. | PASS |
| SEC-BE004-09 | Auditoría replay. | Conserva correlationId del comando y persiste `reason=REPLAY` desde vocabulario cerrado, sin token. | PASS |
| SEC-BE004-10 | Atomicidad. | Prueba Testcontainers de carrera/rollback. | PASS |

## Remediación aplicada

| Hallazgo/control | Superficie modificada | Evidencia reutilizada | Evidencia nueva |
|---|---|---|---|
| SEC-BE004-02 | Refresh service/port JDBC/pruebas WEB. | SEC-01/03..10, manifiesto v4 y QA PASS. | v5: CAS actualiza digest CSRF; C0→C1→C2 y C0 rechazado. |
| SEC-BE004-09 | Refresh service, comando/adaptador audit y pruebas replay. | Atomicidad/privacidad ya probadas. | v5: correlationId de respuesta/auditoría coincide y `reason=REPLAY` es técnico cerrado. |

## Riesgos residuales

- Ciclo HMAC, proxy/IP confiable, Redis/PostgreSQL y retención/purga de digests siguen operacionales; no hay hallazgos abiertos en el candidato v5.
