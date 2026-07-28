# EN-012 — Bootstrap controlado del superadministrador de plataforma

**Área:** Backend  
**Tipo:** Enabler técnico  
**Épica:** Identidad  
**Prioridad:** Must Have  
**Fase:** MVP

## Objetivo

Provisionar de forma controlada, auditable e idempotente el primer usuario con el rol `PLATFORM_SUPERADMIN`, para eliminar la dependencia circular entre autenticación y creación de empresas.

## Alcance

- Un mecanismo local y explícito, definido mediante ADR, para crear el primer superadministrador.
- Variables locales obligatorias y no versionadas para la identidad inicial.
- Contraseña almacenada exclusivamente mediante hash seguro.
- Garantías de ejecución única o idempotente, con evidencia reproducible.
- Procedimiento documentado para el operador de plataforma.

## Criterios de aceptación

1. El bootstrap solo puede ejecutarse mediante el mecanismo controlado documentado; no existe endpoint público de registro.
2. El usuario creado tiene únicamente el rol `PLATFORM_SUPERADMIN` y no se asocia a una empresa cliente.
3. La contraseña no se registra ni se persiste en texto plano.
4. Una segunda ejecución no crea cuentas privilegiadas adicionales ni eleva privilegios de una cuenta existente.
5. El procedimiento cuenta con pruebas, auditoría segura y evidencia reproducible.

## Fuera de alcance

- Registro público, gestión cotidiana de usuarios o creación de administradores de empresa.
- Autenticación, sesiones, recuperación de contraseña, roles personalizados y permisos por recurso.
- Bootstrap de producción por valores por defecto o secretos versionados.

## Dependencias y desbloqueos

- Depende de EN-010 y EN-011.
- Desbloquea la ejecución de BE-001, BE-057 y BE-003 en un entorno vacío.

## Referencias

- Tipos de usuario 6.4
- RNF-005
- RNF-006
- RNF-008

## Seguridad y privacidad

- No incluir valores predeterminados de superadministrador, correos ni contraseñas en el repositorio.
- No aceptar identidad, rol o tenant desde una petición HTTP no autenticada.
- La documentación debe explicar cómo retirar o rotar los secretos locales usados para el bootstrap.
