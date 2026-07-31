# EN-011 — Definir catálogo de roles base

**Área:** Backend  
**Tipo:** Enabler técnico  
**Épica:** Identidad  
**Prioridad:** Must Have  
**Fase:** MVP

## Objetivo

Disponer de un catálogo estable de roles base antes de provisionar usuarios, sin implementar todavía la asignación administrativa ni la autorización por recurso.

## Alcance

- Definir códigos estables para los tipos de usuario del contrato: `PLATFORM_SUPERADMIN`, `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER`.
- Persistir o inicializar el catálogo mediante una estrategia versionada y repetible.
- Documentar el ámbito de cada rol: plataforma o empresa.
- Preparar el modelo para que una sesión posterior pueda transportar una referencia de rol, sin definir todavía la estrategia de sesión.

## Criterios de aceptación

1. El catálogo contiene exactamente los roles base definidos por el contrato funcional.
2. Los códigos de rol son estables, únicos y documentados.
3. El catálogo puede crearse en una base limpia de forma repetible.
4. No existe un endpoint público que permita crear o elevar roles arbitrariamente.
5. La tarea cuenta con pruebas y evidencia reproducible.

## Fuera de alcance

- Creación o modificación de usuarios.
- Asignación de roles a usuarios.
- Permisos granulares, autorización por recurso o jerarquía de equipos.
- Roles personalizados por empresa.

## Dependencias y desbloqueos

- Depende de EN-010.
- Desbloquea EN-012, BE-057, BE-003 y la parte de asignación de roles de BE-007.

## Referencias

- Tipos de usuario 6.1 a 6.4
- RF-AUT-003
- RNF-006
- ADR-011, opción A, aceptada el 2026-07-30 por autorización explícita del
  Product Owner en la orquestación.
- Política SCA de cierre:
  `docs/security/EN-011-sca-policy.md`.
- Manifiesto reproducible:
  `docs/handoffs/backend/EN-011-closure-remediation-manifest.md`.
- Handoff de remediación de cierre:
  `docs/handoffs/backend/EN-011-closure-remediation-handoff.md`.

## Estado de evidencia de cierre

La aceptación de ADR-011 y la nueva configuración CI/SCA modifican el
snapshot previamente revisado. Los handoffs históricos de QA y Ciberseguridad
no validan este candidato y deben repetirse sobre el manifiesto nuevo. El
workflow prepara y conserva durante 30 días una evidencia de allowlist cerrada;
solo una ejecución real sobre el commit candidato puede aportar estado CI/SCA,
versión/fecha de la base Trivy y resultado del gate High/Critical.

## Seguridad y privacidad

- El rol nunca se acepta como autoridad desde el cliente.
- No se deben crear caminos de escalamiento de privilegios durante el bootstrap.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 0 — Fundaciones y decisiones.
- **Predecesoras obligatorias:** `EN-010` — Configurar Spring Security y gestión local de secretos
- **Historias consecuentes que habilita:** `BE-007` — Gestionar roles y permisos; `EN-012` — Bootstrap controlado del superadministrador de plataforma; `EN-013` — Definir autenticación, sesiones y recuperación; `INT-024` — Aislamiento multiempresa E2E
- **Validación vertical:** `INT-024` — Aislamiento multiempresa E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** ADR de autenticación; OpenAPI `/auth/*` y `/company/users`; política de errores.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Usuario, rol, permiso, tenant, sesión/credencial, expiración, revocación y token de activación/recuperación.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: enumeración de cuentas, escalación de privilegios, sesión robada y cruce de tenant.

## Fuera de alcance

- registro público, roles arbitrarios y autenticación social.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
