# Security Handoff — BE-051 v2

## Estado

`CHANGES_REQUIRED`

SEC-001..004: PASS tras las correcciones originales. SEC-BE051-005 Medium:
las funciones `SECURITY DEFINER` aceptaban cutoff/lote arbitrarios, permitiendo
al purger borrar evidencia no vencida. Corrección requerida: wrappers sin
parámetros, corte 90/365 y lote 1..500 dentro de PostgreSQL, con prueba negativa
de login real. Riesgo residual: backup/restore sin evidencia operativa.
