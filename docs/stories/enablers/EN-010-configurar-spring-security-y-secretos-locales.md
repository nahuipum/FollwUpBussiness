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
