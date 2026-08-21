# Paquete de contexto — INT-004

## Estado

Development: `READY_FOR_HANDOFF` tras remediación de pruebas. Candidate-ID: `d2f2a26 + INT-004:c584aaebb2c3`.

## Diagnóstico y alcance

Flujo contratado: `POST /sellers` por `COMPANY_ADMIN`, cuenta `SELLER` en `INVITED`, activación mediante `POST /auth/password-resets`, y login `MOBILE` con `SELLER` activo. `PATCH /sellers/{sellerId}/status` debe revocar sesiones y credenciales al inactivar. Tenant procede del actor autenticado; no se recibe en payload.

Hallazgos iniciales informados:

- `INT-004-BE-01` (media): la auditoría de alta registra `ACTIVE` aunque el perfil persistido es `INVITED` (`SellerService`). Corregir estado auditado y añadir prueba de integración alta→activación→login MOBILE con aislamiento tenant y auditoría.
- `INT-004-MOB-02` (media): mobile no exige estados `ACTIVE` antes de persistir credenciales. Rechazar estados no activos y probar ausencia de sesión/navegación.
- `INT-004-MOB-01` (alta, pendiente de producto): no existe perfil/cartera real en mobile; `SellerHomePage` es un marcador. No se inventará una superficie fuera de las historias de recursos. INT-004 verificará que no expone recursos ajenos; la cobertura de cartera propia requiere la historia propietaria.

Cambios ajenos detectados en `mobile/followupbusiness/` se preservan sin modificación.

## Invariantes y puertos

1. Actor: solo `COMPANY_ADMIN` crea/cambia vendedores de su tenant; `SELLER` obtiene únicamente su propio detalle y recursos autorizados.
2. Éxito: perfil, cuenta `SELLER`, tenant, invitación y auditoría quedan consistentes; activación cambia ambos a `ACTIVE`.
3. Denegación: tenant/rol/estado/token inválidos no crean sesión, perfil ni cuenta utilizable; no filtran pertenencia.
4. Conflicto: duplicados/CAS/fallo de entrega no dejan alta parcial utilizable.
5. Inactivación: revoca sesiones y tokens de acción; el siguiente login/refresh móvil falla.

Puertos: `/sellers`, `/sellers/{sellerId}/status`, `/auth/password-resets`, `/auth/login`, `/mobile/bootstrap` y persistencia/auditoría/notificaciones de identidad-workforce.

## Gates

Delta: DoF bloqueó por metadata de candidato y ausencia de evidencia dinámica de revocación. Se añadieron solo pruebas backend para revocación de sesión/tokens y rechazo de login tras inactivación; no cambió producción ni la superficie de riesgo. El Candidate-ID cubre exclusivamente los cinco archivos INT-004 y excluye cambios ajenos ya presentes. Requiere QA focalizado; Security: `NOT_APPLICABLE` para el delta test-only. Luego DoF independiente. Artefactos: `docs/handoffs/{backend,mobile,qa,security,governance}/INT-004-*.md`.
