# INT-033 — Handoff de QA

**Candidate-ID:** `c54d395 + 6969742688f9`  
**Estado:** `PASS`

QA Backend y Frontend confirmaron el mismo candidato y `git diff --check`.

- Backend: `GET /customers` y detalle preservan ámbito de supervisor y devuelven `404` para cartera no asignada y tenant ajeno. Las pruebas existentes cubren reasignación/repetición, conflicto optimista, tenant ajeno, supervisor inactivo y revocación.
- Frontend: cambio de empresa invalida solicitudes/diálogos; supervisor no dispone de CTA ni mutaciones, incluso vacío; 403/409/422 y ausencia de territorios quedan explícitos y accesibles.

Evidencia: `SellerSupervisorAssignmentServiceTest,SellerStatusServiceTest` y 4 archivos/26 pruebas Vitest, todos correctos. Riesgo residual bajo: la prueba HTTP nueva usa MockMvc standalone y no recorre el filtro JWT global; no afecta la autorización de recurso comprobada.

Sin hallazgos. Superficies de Sprint 4–9 permanecen fuera de alcance.
