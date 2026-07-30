# EN-010 — Configurar Spring Security y gestión local de secretos

**Área:** Backend  
**Tipo:** Enabler técnico.  
**Épica:** Seguridad e identidad  
**Prioridad:** Must Have  
**Fase:** MVP

## Objetivo

configurar Spring Security y gestión segura de secretos locales para habilitar los incrementos posteriores de identidad y acceso.

## Criterios de aceptación

1. La tarea cuenta con evidencia reproducible.
2. La configuración queda documentada.
3. Las validaciones aplicables pasan.

## Alcance

- Línea base de Spring Security con política de denegación por defecto.
- Configuración local mediante variables de entorno y archivos ignorados por Git.
- Documentación de ejecución, validación y rollback local.
- ADR de la línea base de seguridad y secretos.

## Fuera de alcance

- Usuarios, login, sesiones, renovación, logout y recuperación de contraseña.
- JWT, refresh tokens o una estrategia concreta de sesión.
- Roles funcionales, permisos por recurso y endpoints de negocio.
- Secretos de producción, KMS/Vault, CI/CD y despliegue productivo.

## Dependencias y desbloqueos

- Depende de EN-005 para el entorno local reproducible.
- Desbloquea EN-011, EN-012, BE-057, BE-003 y BE-007.

## Referencias

- RNF-004
- RNF-005
- RNF-006
- RNF-007
- RNF-008

## Seguridad y privacidad

- No versionar secretos reales ni valores utilizables fuera del entorno local.
- No registrar secretos, tokens, contraseñas ni headers de autorización.

## Evidencia mínima para DoF

- ADR, implementación, documentación y comandos reproducibles.
- Pruebas y evidencia de política de denegación por defecto.
- QA independiente y revisión de seguridad.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 0 — Fundaciones y decisiones.
- **Predecesoras obligatorias:** `EN-005` — Configurar Docker Compose con PostGIS, Redis y RabbitMQ
- **Historias consecuentes que habilita:** `EN-011` — Definir catálogo de roles base; `EN-012` — Bootstrap controlado del superadministrador de plataforma; `EN-013` — Definir autenticación, sesiones y recuperación; `EN-015` — Definir persistencia local y sincronización móvil
- **Validación vertical:** La validación se incorpora a la historia E2E de la épica y a la regresión `INT-032` cuando afecte el flujo crítico.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** Contrato REST/evento/sync aplicable definido y revisado por sus consumidores.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Identificadores, tenant/propietario, estado, timestamps de negocio y auditoría aplicables.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: permisos, aislamiento multiempresa, concurrencia, recuperación y observabilidad.

## Fuera de alcance

- capacidades no descritas en el alcance y cambios de arquitectura sin ADR.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
