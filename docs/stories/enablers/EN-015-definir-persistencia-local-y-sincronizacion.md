# EN-015 — Definir persistencia local y sincronización móvil

**Área:** Arquitectura / Mobile
**Tipo:** Enabler técnico
**Épica:** Offline-first
**Prioridad:** Must Have
**Fase:** MVP

## Objetivo

Definir mediante ADR la base local, cifrado, segregación por tenant/usuario,
cola durable, orden de comandos, conflictos, reintentos y limpieza de datos de
la aplicación móvil.

## Criterios de aceptación

1. Se selecciona la persistencia local y su estrategia de cifrado/migración.
2. Se define el ciclo `pending → syncing → synced/error/conflict`.
3. Se define idempotencia, orden causal y conservación de fecha/coordenada
   original.
4. Se documenta qué ocurre al cerrar sesión, cambiar de usuario, forzar cierre,
   reinstalar o agotar almacenamiento.
5. El contrato `docs/sync/mobile-sync-contract.md` queda consumible y versionado.
6. QA Mobile y Seguridad aprueban los escenarios offline y de aislamiento.

## Dependencias y desbloqueos

- Depende de EN-010 y EN-013.
- Desbloquea MOB-004, MOB-009, MOB-014, MOB-022, MOB-027, MOB-028 e INT-015 e
  INT-018.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 0 — Fundaciones y decisiones.
- **Predecesoras obligatorias:** `EN-010` — Configurar Spring Security y gestión local de secretos; `EN-013` — Definir autenticación, sesiones y recuperación
- **Historias consecuentes que habilita:** `EN-017` — Definir canales de notificación; `INT-015` — Visita offline sincronizada; `INT-018` — Venta offline sincronizada; `INT-024` — Aislamiento multiempresa E2E; `MOB-004` — Descargar ruta del día; `MOB-009` — Encolar ubicaciones sin conexión; `MOB-014` — Iniciar visita offline; `MOB-019` — Consultar catálogo offline; `MOB-022` — Sincronizar venta idempotente; `MOB-027` — Proteger datos locales; `MOB-028` — Recuperar cola tras cierre forzado; `MOB-032` — Editar venta dentro de ventana
- **Validación vertical:** `INT-015` — Visita offline sincronizada; `INT-018` — Venta offline sincronizada; `INT-024` — Aislamiento multiempresa E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** ADR de persistencia local y contrato mobile sync.
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
