# FE-005/006/007 — Revisión final de Seguridad

**Estado:** PASS  
**Candidate-ID:** `03933fa + d86ef854`

## Superficie revisada

Autorización `COMPANY_ADMIN`/`SUPERVISOR`, aislamiento de sesión/empresa y PII en memoria, API de Vendedores, concurrencia `If-Match`, Correlation IDs, entradas no confiables y efectos ante rechazo. Se reutilizó el `PASS` de QA y se revisaron solo paquete, handoff QA, diff y código/pruebas afectados. El paquete aún muestra el digest anterior `4d797ce7`; QA y la firma local coinciden con este candidato, por lo que queda como advertencia documental no bloqueante.

## Hallazgos y evidencia

- **PASS — Autorización (sin hallazgo):** `canManage` deriva del rol de sesión; CTA, editar, asignar, reenviar y cambiar estado no se construyen para `SUPERVISOR`, y los diálogos mutables repiten la guarda. Abuso reproducido con `npm test -- --run src/features/company-sellers/components/SellerTable.test.tsx` → 5/5: con `canManage=false` la acción de estado no existe y no se invoca su callback/request. La autorización efectiva permanece en el backend.
- **PASS — Tenant/sesión y no-op (sin hallazgo):** `sellerSessionKey` incluye generación, usuario, empresa y roles; los hooks invalidan respuestas/mutaciones obsoletas y limpian lista, filtros, detalle y operaciones al cambiar sesión. No se envía `tenantId`/`companyId` ni se persiste o registra PII. Rechazos `403/409/422` no aplican éxito ni actualizan la fila.
- **PASS — API, concurrencia y datos no confiables (sin hallazgo):** se conserva Authorization/CSRF; edición y reenvío mantienen `If-Match`; IDs de ruta se codifican y los payloads siguen acotados. Solo `401` se publica globalmente; Correlation IDs se normalizan antes de mostrarse y el contenido remoto se renderiza como texto React, sin HTML dinámico.

## No aplicable, no ejecutado y riesgo residual

- **NOT_APPLICABLE:** secretos, WebSocket, cache/Redis, mensajería, archivos, dependencias e infraestructura no cambiaron. Portal y foco solo cambiaron presentación/accesibilidad y no introducen un nuevo límite de confianza.
- **NOT_EXECUTED:** no se lanzó una petición real al backend con credenciales `SUPERVISOR`; no hubo cambio backend en el candidato y se ejecutó el caso negativo frontend más cercano disponible.
- **Riesgo residual:** la manipulación directa del cliente debe ser rechazada por la autorización tenant-aware del servidor; esta garantía no puede demostrarse con el diff frontend. `git diff --check`: PASS.
