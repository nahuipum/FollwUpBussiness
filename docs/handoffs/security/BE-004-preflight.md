# Handoff — BE-004 — Preflight de Seguridad

## Estado

ADVISORY

## Paquete de contexto

| ID y versión | Candidato (commit/diff) | Ruta | Estado de vigencia |
|---|---|---|---|
| BE-004 v1 | `a7e444a684d032be4da9ee4aac48528a33bd5fd7` + worktree inicial | `docs/handoffs/governance/BE-004-context-package.md` | Vigente para Desarrollo |

## Lecturas excepcionales de fuentes primarias

| Motivo | Ruta y sección | Hash | Hallazgo o decisión |
|---|---|---|---|
| Validar matriz de amenazas y controles sin reabrir HU/ADR/OpenAPI. | `shared/TEAM_WORKFLOW.md`; `agents/security/08_cybersecurity_reviewer.md`; `docs/security/threat-model.md`; `docs/security/security-baseline.md` | No registrado por el revisor; no modifican reglas del paquete. | Confirmó aplicabilidad por auth, tenant, refresh, Redis y auditoría. |

## Seguridad

| Control SEC | Implementación o prueba exigida | Evidencia de preflight | Estado |
|---|---|---|---|
| SEC-BE004-01 | RS256/kid fijo, claims y relación persistida; no `tid` plataforma. | Firma, claims, expiración y estados inactivos. | ADVISORY |
| SEC-BE004-02 | Secreto CSPRNG/HMAC y separación estricta WEB/MOBILE/CSRF. | Matriz de downgrade y ausencia de secretos. | ADVISORY |
| SEC-BE004-03 | CAS/bloqueo transaccional para un sucesor global. | Carrera con barrera y conteo de sucesores. | ADVISORY |
| SEC-BE004-04 | Ventana inclusiva de 5 s y revocación previa al replay malicioso. | Límite temporal y canal/cliente distintos. | ADVISORY |
| SEC-BE004-05 | Expiración absoluta/revocación verificadas antes de rotar. | Antes/exacto/después de vencimiento. | ADVISORY |
| SEC-BE004-06 | Tenant/rol/cuenta solo de relaciones activas persistidas. | Inyección y cuentas/empresas no activas. | ADVISORY |
| SEC-BE004-07 | Redis HMAC/TTL, IP confiable, límites antes de mutación y fail-closed. | Umbrales, spoof y Redis indisponible. | ADVISORY |
| SEC-BE004-08 | Errores/headers sanitizados; no `Set-Cookie` en fallo/MOBILE. | Fugas y correlationId malicioso. | ADVISORY |
| SEC-BE004-09 | Auditoría, logs y métricas con allowlist y sin cardinalidad sensible. | Escenarios críticos y marcadores de secreto. | ADVISORY |
| SEC-BE004-10 | Atomicidad de mutación/auditoría y respuesta posterior a commit. | Fallos inyectados y rollback. | ADVISORY |

## Riesgos residuales

- Renovación todavía no implementada; no hay pruebas ni análisis runtime que aprobar.
- El ciclo de la clave HMAC, la IP confiable del proxy y la purga de digests consumidos se deben concretar o documentar durante Desarrollo.
- La auditoría debe respetar límites entre módulos mediante puerto/adaptador, sin acceso directo a tablas de `audit`.

## Pendientes

Desarrollo debe cubrir los diez controles con código y pruebas dirigidas antes de entregar `READY_FOR_HANDOFF`.
