# Seguridad final afectada — BE-004 v6

## Estado

PASS

## Candidato y gate

- Candidato: `0df537f71e8c6ece12e10d95e6824e5af80255d9`.
- Paquete/manifiesto v6: 23 artefactos, SHA-256 `594ca9ebc98e0f911da0e2188c80755cc79f9c1ee2423a9b8e1d1533f8caf575`; el test afectado coincide con `2779df83b31c0198e500069a286ae09a55c9839827039425f31b176140cc92f6`.
- QA v6: PASS, `InboundJwtAuthenticatorTest`, 5 pruebas sin fallos.
- `git diff --check <candidato>^ <candidato>`: PASS.

## Control revalidado

| Control | Resultado | Evidencia |
|---|---|---|
| SEC-BE004-01 | PASS | La prueba cambia el primer carácter del segmento de firma por `A`/`B`, alterando bits significativos Base64URL y verificando `JwtValidationException`; conserva caso positivo RS256 y tenant derivado de sesión persistida. |

`SEC-BE004-02..10`: PASS reutilizado de v5. El candidato v6 no modifica código productivo, contrato, persistencia, Redis, CSRF, auditoría ni transacciones.

No hubo relecturas de fuentes primarias ni hallazgos nuevos. SAST/SCA/DAST generales: no ejecutados por superficie sin cambios; CI del candidato los cubre por separado.
