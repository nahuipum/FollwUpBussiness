# BE-019 — Revisión de Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `7de8183 + 2e06ffdb2ab6`.

- **Media SEC-01:** `CustomerImportProcessor` es `final` y sus métodos `@Transactional` no tienen un límite proxyable seguro. Una excepción tras `claim()` puede dejar el trabajo en `PROCESSING`; la siguiente entrega confirma sin llegar a retry/DLQ. Cierre: límite transaccional proxyable y prueba de rollback del claim; cuatro entregas deben producir tres retry, `FAILED`, auditoría, métrica y un DLQ.
- **SEC-02 PASS:** `POST /customer-imports` exige `COMPANY_ADMIN` antes de binding y límites servlet 10/11 MiB.
- **SEC-03 PASS:** `ON CONFLICT DO NOTHING` deja un trabajo/outbox para replay idéntico y 409 para contenido distinto.

PASS: claims/GET tenant-scoped, evento/auditoría sin PII, XML externo/DTD desactivado, límites ZIP/filas/celdas y purga 24 h/30 d.

Abuso reproducido: excepción persistente post-claim revierte a `PENDING`; PostgreSQL/RabbitMQ reales confirman tres TTL, cuarta terminal y una DLQ. Sin hallazgos. Riesgo residual: ACL de broker debe restringir productores de la ruta interna.
