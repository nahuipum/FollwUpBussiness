# Security review — BE-003

## Estado

`PASS`

## Evidencia

- SEC-BE003-001: identificadores ambiguos entre empresas se rechazan
  neutralmente; no se emite sesión.
- SEC-BE003-002: BCrypt señuelo de coste 12 evita la diferencia temporal
  observable para identidades no utilizables.
- SEC-BE003-003: límite de 4096 bytes también para streams sin longitud,
  JSON estricto y 413 seguro.
- SEC-BE003-004: handler de validación restringido a `LoginController`, sin
  `rejectedValue` en logs o respuestas; 400 neutral/no-store/correlación.
- Retest JDK 21: `LoginControllerTest` + `SecurityConfigurationTest`:
  **35/35 PASS**. `git diff --check`: PASS.

## Riesgo residual

Redis real, navegador CORS, DAST de timing y SCA del starter Redis no se
ejecutaron en este retest; no bloquean el alcance validado.
