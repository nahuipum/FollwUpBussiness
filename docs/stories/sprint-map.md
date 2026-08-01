# Plan secuencial de sprints

Este plan reemplaza la propuesta inicial del backlog. El detalle historia por
historia y sus flechas de dependencia está en
[`dependency-map.md`](./dependency-map.md).

## Reglas de planificación

1. El orden dentro de cada sprint representa olas de entrega, no una lista
   intercambiable.
2. Backend estabiliza el contrato antes de que Frontend/Mobile integren.
3. Una historia puede usar un mock acordado para trabajar en paralelo, pero no
   alcanza `PASS` sin productor real y prueba de contrato.
4. `INT-024` (aislamiento) e `INT-028` (correlationId) comienzan en Sprint 1 y
   se ejecutan como regresión en todos los sprints posteriores.
5. Las historias `Should Have / MVP condicionado` no bloquean el flujo base si
   la empresa mantiene deshabilitada esa capacidad.

## Sprint 0 — Fundaciones y decisiones

### Ola 0A — Entorno y seguridad base

- EN-005, EN-010 y EN-011.

### Ola 0B — Bootstrap y decisiones que evitan retrabajo

- EN-012: primer superadministrador controlado.
- EN-013: autenticación, sesiones, activación y recuperación.
- EN-014: mapas, geocodificación y navegación.
- EN-015: persistencia local y sincronización.
- EN-016: privacidad, retención y rastreo.
- EN-017: canales de notificación.
- EN-018: motor y límites de rutas.

### Ola 0C — Mensajería confiable

- BE-055 y BE-056.

### Salida del sprint

- ADR y contratos necesarios aprobados por sus consumidores.
- No existe registro público ni credencial privilegiada predeterminada.
- Infraestructura local reproducible y estrategia de eventos verificable.

## Sprint 1 — Empresa, identidad y acceso utilizable

### Ola 1A — Autenticación y controles transversales

- BE-003, BE-007, BE-051, BE-004 y BE-005.

### Ola 1B — Onboarding real de una empresa

- BE-001, BE-006, BE-057, BE-002 y BE-058.
- El flujo es: login de plataforma → crear empresa → invitar administrador →
  activar cuenta → login de empresa.

### Ola 1C — Clientes web/mobile de identidad

- FE-001, FE-002, FE-003, FE-034 y FE-004.
- MOB-001, MOB-002 y MOB-027.

### Ola 1D — Validación vertical

- INT-001, INT-002, INT-003, INT-038, INT-024 e INT-028.

### Salida del sprint

- Sí existe login web y móvil probado.
- Una instalación vacía puede crear al operador de plataforma, una empresa y
  su administrador sin insertar usuarios manualmente en base de datos.
- Suspender una empresa bloquea su acceso sin afectar otros tenants.

## Sprint 2 — Equipo, zonas, clientes y cartera

### Ola 2A — Catálogos y usuarios productores

- BE-062, BE-008, BE-059, BE-009, BE-010, BE-011 y BE-012.
- FE-005, FE-006, FE-007 y FE-037.

### Ola 2B — Clientes y asignación

- BE-013, BE-014, BE-015, BE-016 y BE-060.
- FE-008, FE-009, FE-010 y FE-036.

### Ola 2C — Validación vertical

- INT-004, INT-005, INT-033 e INT-034.

### Salida del sprint

- Administrador, supervisor, vendedor, zona, cliente y cartera tienen origen,
  consulta y permisos definidos.
- Un supervisor solo ve su equipo.
- No hay selectores de zonas/vendedores que dependan de datos inexistentes.

## Sprint 3 — Importación y configuración operativa

### Ola 3A — Configuración previa al campo

- BE-054 y FE-033.

### Ola 3B — Importación

- BE-018, BE-019, BE-020, FE-012 y FE-013.

### Ola 3C — Validación vertical

- INT-006.

### Salida del sprint

- La empresa puede cargar clientes, revisar rechazos y configurar geocerca y
  tracking antes de crear jornadas.
- Archivo, cola, resultado y descarga de errores están probados sin bloquear la
  API ni mezclar tenants.

## Sprint 4 — Planificación y entrega de rutas

### Ola 4A — Borrador y consulta

- BE-021, BE-023, BE-026, BE-027 y BE-061.
- FE-014 y FE-015.

### Ola 4B — Optimización, publicación y cambios

- BE-022, BE-024 y BE-053.
- BE-025 y FE-018: reasignación `Should Have`.
- FE-016 y FE-017.

### Ola 4C — Consumo móvil

- MOB-004, MOB-005, MOB-006 y MOB-029.

### Ola 4D — Validación vertical

- INT-007, INT-008 e INT-009.

### Salida del sprint

- Una ruta puede crearse, consultarse, publicarse, descargarse y actualizarse.
- La copia local identifica su versión; una notificación no sustituye la
  consulta al servidor.

## Sprint 5 — Jornada y tracking en vivo

### Ola 5A — Jornada y recepción de ubicación

- BE-028, BE-029, BE-030, BE-031 y BE-033.

### Ola 5B — Captura móvil segura

- MOB-003, MOB-026, MOB-007, MOB-008, MOB-009, MOB-010, MOB-024, MOB-028 y
  MOB-030.

### Ola 5C — Supervisión en vivo

- FE-020.

### Ola 5D — Validación vertical y degradación

- INT-010, INT-011 e INT-026.

### Salida del sprint

- Tracking existe solo con jornada activa, muestra última actualización y se
  recupera de red intermitente/cierre forzado.
- La caída de Redis degrada la vista, pero no elimina la fuente persistente.

## Sprint 6 — Recorrido histórico

Este incremento es `Should Have / MVP ampliado`; no bloquea el flujo base de
tracking en vivo.

### Ola 6A

- BE-032 y FE-022.

### Ola 6B

- INT-012.

### Salida del sprint

- El supervisor consulta una jornada cerrada como histórico, nunca como
  ubicación viva, dentro de la política de retención.

## Sprint 7 — Visitas y ejecución de ruta

### Ola 7A — Geocerca e inicio/cierre

- BE-034, BE-035, BE-036 y BE-040.
- MOB-011, MOB-012, MOB-013, MOB-014, MOB-015, MOB-016 y MOB-017.

### Ola 7B — Administración y comparación

- BE-039, FE-023, FE-024, FE-025 y FE-019.

### Ola 7C — Capacidades condicionadas

- BE-037 y MOB-018: visita fuera de ruta.
- BE-038 y FE-038: excepción de geocerca deshabilitada por defecto.
- MOB-025: cierre con pendientes ya producidos por visitas.

### Ola 7D — Validación vertical

- INT-013, INT-014, INT-015, INT-016, INT-023, INT-036 e INT-039.

### Salida del sprint

- El flujo ruta → geocerca → check-in → resultado → check-out funciona online y
  offline sin duplicados.
- El cierre de jornada ahora se prueba con visitas y pendientes reales.

## Sprint 8 — Ventas e histórico comercial

### Ola 8A — Venta simple obligatoria

- BE-042, BE-044, BE-045 y BE-046.
- MOB-020, MOB-022 y MOB-023.
- FE-026, FE-027 y FE-029.

### Ola 8B — Histórico y resultados

- BE-017, BE-048, BE-049.
- FE-011, FE-021 y FE-028.

### Ola 8C — Capacidades condicionadas

- BE-041, FE-035, MOB-019 y MOB-021: catálogo/venta detallada.
- BE-043 y MOB-032: edición dentro de ventana.

### Ola 8D — Validación vertical

- INT-017, INT-018, INT-019, INT-020, INT-021, INT-035 e INT-037.

### Salida del sprint

- El MVP base registra una venta simple asociada a visita, la sincroniza y la
  refleja en consultas.
- Catálogo detallado y edición solo se habilitan si Producto confirma esas
  variantes.

## Sprint 9 — Dashboard, reportes, auditoría y estabilización

### Ola 9A — Métricas con datos productores ya disponibles

- BE-047, BE-050 y BE-052.
- FE-030, FE-031, FE-032 y MOB-031.

### Ola 9B — Validación y operación

- INT-022, INT-025, INT-027, INT-029, INT-030, INT-031 e INT-040.

### Ola 9C — Cierre de seguridad

- INT-032 y regresión completa de INT-024/INT-028.

### Salida del sprint

- Dashboard, resumen y exportaciones operan sobre jornadas, visitas y ventas
  reales.
- Backup/restore, retención, rendimiento, DLQ, seguridad y auditoría tienen
  evidencia reproducible.
- Solo DoF independiente puede declarar terminado el MVP.
