# INT-004 — Revisión de ciberseguridad

Estado: `PASS`  
Candidate-ID: `d2f2a26 + INT-004:c584aaebb2c3`.

## Superficie revisada

- Alta y cambio de estado de vendedores: rol `COMPANY_ADMIN`, tenant derivado del actor, estados `INVITED/ACTIVE/INACTIVE` y auditoría sin datos personales ni motivo libre.
- Activación y login `MOBILE`: token de acción digerido y consumible, único rol `SELLER`, usuario y empresa `ACTIVE`.
- Persistencia móvil de access/refresh token y ticket de revocación: rechazo neutral previo a `replaceSession` ante estados no activos.
- Inactivación: incremento de `credential_version`, revocación de familias de sesión e invalidación de tokens de acción por cuenta/tenant dentro del flujo transaccional.

No se identificaron hallazgos de seguridad explotables.

Delta posterior: `NOT_APPLICABLE`; solo se corrigieron dobles y se añadió evidencia de prueba de revocación, sin cambio de producción, contrato ni superficie sensible.

## Evidencia y abuso reproducido

- `PASS` reutilizado de QA: alta `INVITED`, tenant/rol consistentes, activación, login móvil activo y rechazo móvil de usuario/empresa no activos sin persistir sesión.
- `PASS` por inspección del diff: `SellerService.create` audita `INVITED`; `AuthHttpRepository.parseSeller` falla cerrado antes de persistir secretos. No hay logging de credenciales ni secretos nuevos.
- Abuso reproducido: un actor con rol indebido o `COMPANY_ADMIN` de otro tenant intenta inactivar un vendedor. `SellerStatusServiceTest#rejectsUnauthorizedCrossTenantRepeatedAndInvalidWithoutIdentityWritesOrAudit` — `PASS`; no hubo llamada a identidad, escritura ni auditoría.
- Invocación `mvn -q "-Dtest=SellerStatusServiceTest" test` — `FAIL` global: dos pruebas adyacentes fallan por dobles que retornan `null` desde `CompanyUserService.status(...)`; el caso de abuso anterior pasó. No demuestra bypass de producción.
- Revocación exitosa de una familia real — `NOT_EXECUTED` en Security por ese defecto del harness; la implementación observada revoca sesiones/tokens y la evidencia previa cubre rechazo de login/refresh por estado.

## Controles no aplicables y riesgos residuales

WebSocket, cache/Redis, mensajería, archivos, ubicación/GPS, dependencias e infraestructura no cambian en el candidato. Riesgo residual: corregir los dobles de `SellerStatusServiceTest` para recuperar evidencia ejecutable del camino exitoso de inactivación; hasta entonces la revocación se sustenta en inspección del control y evidencia previa. Los cambios ajenos de splash/UI quedan fuera del Candidate-ID.
