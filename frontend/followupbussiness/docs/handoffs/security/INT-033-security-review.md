# INT-033 — Revisión de Seguridad

**Candidate-ID:** `c54d395 + 6969742688f9`  
**Estado:** `PASS`

Se verificaron autorización de asignación/reasignación, aislamiento tenant/equipo, alcance de cartera vigente, revocación de estado Frontend y exposición de datos.

- Las mutaciones requieren `COMPANY_ADMIN`, tenant y referencias activas; la lectura del supervisor se deriva de equipo/cartera vigente y oculta recursos ajenos.
- Abuso reproducido: renovación `company-a → company-b` aborta solicitudes y limpia estado (`auth.test.ts`, 1/1 correcto).
- No se agregaron secretos, tokens, coordenadas ni PII; el delta elimina la serialización completa de empresa como clave.

No hay hallazgos. Riesgo residual bajo: la prueba HTTP Backend usa MockMvc standalone y no cruza el filtro JWT global; la configuración compartida no cambió. El contrato exige `company.id`; una respuesta sin ese campo es inválida y se recomienda validación defensiva futura. Superficies de Sprint 4–9 no aplican.
