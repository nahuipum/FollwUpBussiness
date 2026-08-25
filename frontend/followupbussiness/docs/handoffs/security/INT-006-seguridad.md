# INT-006 — Revisión de Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `01589d3 + dcdce259805f`.

Autorización `COMPANY_ADMIN`, BOLA de trabajos/errores/clientes, tenant, multipart CSV/XLSX, fórmulas CSV, PII/auditoría/correlación, RabbitMQ y limpieza Frontend: sin hallazgos.

- Lecturas tenant-scoped: tenant ajeno obtiene `404` neutral; rol no autorizado `403 application/problem+json`, sin datos previos.
- Archivos: límite/tipo/versión/estructura; XLSX limita expansión, rechaza macros/traversal y bloquea DTD/entidades externas.
- Errores CSV: solo `row_number,error_code`; no refleja fórmulas ni PII.
- Worker: actor/tenant/correlación desde el trabajo persistido, reintentos acotados y DLQ con evidencia integrada existente.

Abuso nuevo: no ejecutado; se reutilizó QA del mismo candidato para tenant B y SELLER. Riesgo residual bajo: RabbitMQ/PostGIS no se repitieron porque el delta no los alteró.
