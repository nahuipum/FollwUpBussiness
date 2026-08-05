# Paquete de Contexto — BE-051 v8

Sustituye v7 por remediación de SEC-BE051-005. Candidato: base
`03cddd578850f77acd1a1d1035fef031f7ac7384` + agregado
`95ef6631b74cb4b0423e1f886af042f2e2a61cb79bb444bef3d07048863b92e9`.
Se reconstruye con el comando de v7, sustituyendo el hash esperado. Entradas:
Dev v2 READY, QA v5 PASS y Security v2 CHANGES_REQUIRED.

Regresión: toda la matriz BE-051 y SEC001–004; adicionalmente SEC005: funciones
`SECURITY DEFINER` sin parámetros del purger, corte interno PostgreSQL 90/365,
lote fijo ≤500 y login real no puede usar `infinity` ni batch arbitrario. No hay
REST, PR o CI. Backup/restore queda riesgo de infraestructura, no aprobación de
implementación. QA escribe v6; Seguridad escribe v3 y DoF solo tras ambos PASS.
