# EN-019 — Fundación de empresas y estado de acceso

**Área:** Backend
**Tipo:** Enabler técnico
**Estado:** Activa
**Sprint:** Sprint 1 — Empresa, identidad y acceso utilizable
**Depende de:** EN-005, EN-010, EN-011, EN-012, EN-013
**Desbloquea:** BE-003, BE-001, BE-002, BE-057

## Objetivo

Establecer en `tenancy` la fuente de verdad durable para la identidad de una
empresa y su estado de acceso, y exponer una consulta pública mínima para que
`identityaccess` valide una cuenta de empresa sin leer tablas ajenas.

## Alcance

- Migración `V4` forward-only de la empresa con UUID del servidor, estado
  `ACTIVE`/`SUSPENDED` y timestamps.
- Modelo de dominio y puerto público de consulta que devuelve únicamente si la
  empresa existe y está activa.
- Adaptador PostgreSQL y wiring interno de `tenancy`.
- Pruebas de migración, consulta, estados y límites hexagonales.

## Criterios de aceptación

1. PostgreSQL conserva la empresa y su estado como fuente de verdad.
2. Una consulta por `companyId` distingue empresa activa de suspendida o inexistente.
3. `identityaccess` puede depender del puerto público, nunca de tabla o repositorio de `tenancy`.
4. El dominio no depende de Spring, JPA ni infraestructura.

## Fuera de alcance

- Endpoints de creación, listado o cambio de estado: pertenecen a BE-001/BE-002.
- Configuración comercial, auditoría funcional, usuarios de empresa y sesiones.
- Cache positiva de autorización o aceptación de `tenantId` del cliente.

## Decisión de entrega

BE-001 mantiene el onboarding autorizado y su configuración inicial. EN-019 no
crea empresas mediante HTTP: solo establece el contrato durable que BE-003
necesita para rechazar sesiones de empresas suspendidas.
