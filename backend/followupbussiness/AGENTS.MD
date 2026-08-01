# Backend — Instrucciones locales

## Contexto

- Aplicar `../../AGENTS.MD`.
- Leer completa la historia Backend indicada.
- Abrir solo el contrato, ADR y documentación de seguridad afectados.
- Inspeccionar primero el diff y los símbolos relacionados.

## Invariantes

- Mantener el monolito modular y la arquitectura hexagonal por dominio.
- El dominio no depende de Spring, JPA, Redis, mensajería ni transporte.
- No acceder a repositorios o tablas internas de otro dominio.
- PostgreSQL es la fuente de verdad; Redis solo conserva estado efímero.
- Toda consulta y clave multiempresa incluye y valida `tenantId`.
- Aplicar autorización por recurso, validación de entrada e idempotencia cuando
  la historia lo requiera.
- Usar migraciones versionadas para cambios de esquema.
- No exponer entidades de persistencia como DTO de API.

## Verificación

Ejecutar primero las pruebas dirigidas al módulo modificado. Ampliar a la suite
Maven o pruebas de integración solo por riesgo o fallo. Reportar comando y
resultado; no pegar logs completos.
