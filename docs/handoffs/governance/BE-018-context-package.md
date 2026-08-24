# BE-018 — Paquete de contexto

- **Estado:** PASS — DoF completado.
- **Alcance:** `GET /customers/import-template`; solo descarga autenticada para `COMPANY_ADMIN`.
- **Candidate-ID:** `e7224d6+e7e7713272fc`.

## Decisiones contractuales aprobadas

Se soportan CSV y XLSX mediante negociación `Accept`; si está ausente o es `*/*`, se entrega CSV. Un `Accept` no compatible devuelve `406 Not Acceptable`.

Columnas, en este orden: `name`, `address`, `latitude`, `longitude`, `documentType`, `documentNumber`, `phone`, `email`, `segment`, `visitFrequencyDays`, `territoryId`. Las cuatro primeras son obligatorias; el importador las identifica por contrato, no decorando el encabezado. Las restantes son opcionales. `territoryId`, si se informa, debe pertenecer a un territorio activo del tenant.

Versión estable inicial `1.0`: `X-Template-Version` y nombre de archivo la incluyen. CSV inicia con `# template-version: 1.0`, que BE-019 ignorará antes del encabezado de columnas; XLSX declara la misma versión en sus propiedades de documento. La primera fila tabular contiene el encabezado exacto anterior. El ejemplo no incluye `territoryId` y evita fórmulas/PII.

## Invariantes previstos

Actor autenticado `COMPANY_ADMIN`; éxito con archivo completo/versionado; denegación sin archivo para anónimo, `SUPERVISOR` y `SELLER`; fallo controlado sin datos parciales; `correlationId` y observabilidad sin contenido ni PII. Seguridad aplicable: autorización y prevención de inyección de fórmulas.

## Delta QA

Remediado: `q=0` excluye el tipo explícito; se selecciona la representación permitida de mayor calidad y ambos tipos excluidos devuelven `406`.
