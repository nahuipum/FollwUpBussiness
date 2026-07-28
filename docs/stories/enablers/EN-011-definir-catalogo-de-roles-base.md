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

## Seguridad y privacidad

- El rol nunca se acepta como autoridad desde el cliente.
- No se deben crear caminos de escalamiento de privilegios durante el bootstrap.
