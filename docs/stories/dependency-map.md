# Mapa de dependencias y consecuencias del backlog

Este documento se genera desde `tools/refine-story-backlog.ps1`. Una historia
no entra a sprint si sus predecesoras o contratos no están listos.

## Sprint 0 — Fundaciones y decisiones

| ID | Historia | Depende de | Desbloquea |
|---|---|---|---|
| EN-005 | Configurar Docker Compose con PostGIS, Redis y RabbitMQ | — | BE-055, BE-056, EN-010, EN-014, INT-029 |
| EN-010 | Configurar Spring Security y gestión local de secretos | EN-005 | EN-011, EN-012, EN-013, EN-015 |
| EN-011 | Definir catálogo de roles base | EN-010 | BE-007, EN-012, EN-013, INT-024 |
| EN-012 | Bootstrap controlado del superadministrador de plataforma | EN-010, EN-011 | BE-003 |
| EN-013 | Definir autenticación, sesiones y recuperación | EN-010, EN-011 | BE-003, BE-004, BE-006, EN-015, EN-017, FE-001, FE-002, MOB-001 |
| EN-014 | Definir proveedor de mapas, geocodificación y navegación | EN-005 | BE-013, BE-015, EN-018, FE-009, FE-010, FE-019, FE-020, FE-022, MOB-006 |
| EN-015 | Definir persistencia local y sincronización móvil | EN-010, EN-013 | EN-017, INT-015, INT-018, INT-024, MOB-004, MOB-009, MOB-014, MOB-019, MOB-022, MOB-027, MOB-028, MOB-032 |
| EN-016 | Definir privacidad, retención y rastreo | — | BE-028, BE-029, BE-032, BE-034, BE-054, FE-020, FE-022, INT-031, MOB-003, MOB-026, MOB-030 |
| EN-017 | Definir canales de notificación | EN-013, EN-015 | BE-006, BE-053, FE-002, MOB-029 |
| EN-018 | Definir motor de rutas y límites del MVP | EN-014 | BE-022, FE-016 |
| BE-055 | Implementar outbox transaccional | EN-005 | BE-024, BE-035, BE-042, BE-044, BE-053, BE-056, INT-027, INT-028 |
| BE-056 | Gestionar reintentos y DLQ | BE-055, EN-005 | BE-019, BE-050, BE-053, INT-006, INT-027, INT-040 |

## Sprint 1 — Empresa, identidad y acceso utilizable

| ID | Historia | Depende de | Desbloquea |
|---|---|---|---|
| BE-003 | Autenticar usuario | EN-012, EN-013 | BE-001, BE-004, BE-005, BE-006, BE-007, BE-051, FE-001, FE-034, INT-002, INT-003, INT-028, INT-038, MOB-001 |
| BE-007 | Gestionar roles y permisos | BE-003, EN-011 | BE-001, BE-051, BE-057, BE-058, FE-034, INT-002, INT-024 |
| BE-051 | Registrar acciones críticas | BE-003, BE-007 | BE-001, BE-002, BE-038, BE-039, BE-041, BE-044, BE-052, BE-054, BE-057, BE-058, BE-062, INT-025, INT-031, INT-037 |
| BE-004 | Renovar sesión | BE-003, EN-013 | BE-005, FE-003, INT-002, INT-003, INT-038, MOB-002 |
| BE-005 | Cerrar y revocar sesión | BE-003, BE-004 | BE-002, BE-010, FE-003, INT-002, INT-003, INT-038, MOB-002 |
| BE-001 | Crear una empresa | BE-003, BE-007, BE-051 | BE-002, BE-054, BE-057, INT-001 |
| BE-006 | Recuperar contraseña | BE-003, EN-013, EN-017 | BE-057, BE-058, FE-002, INT-001, INT-002 |
| BE-057 | Provisionar administrador inicial de empresa | BE-001, BE-006, BE-007, BE-051 | BE-058, INT-001 |
| BE-002 | Suspender y reactivar empresa | BE-001, BE-005, BE-051 | INT-038 |
| BE-058 | Gestionar usuarios de empresa | BE-006, BE-007, BE-051, BE-057 | BE-008, BE-011, BE-041, BE-062, FE-004, INT-033 |
| FE-001 | Pantalla de inicio de sesión | BE-003, EN-013 | FE-003, INT-001, INT-002, INT-038 |
| FE-002 | Recuperación de contraseña | BE-006, EN-013, EN-017 | INT-002 |
| FE-003 | Gestión de sesión | BE-004, BE-005, FE-001 | FE-004, FE-005, FE-008, FE-014, FE-020, FE-022, FE-023, FE-026, FE-030, FE-032, FE-033, FE-035, FE-037, INT-002 |
| FE-034 | Manejo global de errores y permisos | BE-003, BE-007 | FE-004, FE-005, FE-008, FE-014, FE-020, FE-022, FE-023, FE-026, FE-030, FE-032, FE-033, FE-035, FE-037, FE-038, INT-002 |
| FE-004 | Gestión de usuarios y roles | BE-058, FE-003, FE-034 | INT-033 |
| MOB-001 | Iniciar sesión móvil | BE-003, EN-013 | INT-003, INT-004, MOB-002, MOB-003, MOB-027 |
| MOB-002 | Renovar y cerrar sesión | BE-004, BE-005, MOB-001 | INT-003, MOB-004 |
| MOB-027 | Proteger datos locales | EN-015, MOB-001 | INT-003, MOB-004, MOB-015, MOB-019, MOB-028 |
| INT-001 | Onboarding completo de empresa | BE-001, BE-006, BE-057, FE-001 | Cierre/DoF |
| INT-002 | Autenticación web completa | BE-003, BE-004, BE-005, BE-006, BE-007, FE-001, FE-002, FE-003, FE-034 | Cierre/DoF |
| INT-003 | Autenticación móvil completa | BE-003, BE-004, BE-005, MOB-001, MOB-002, MOB-027 | INT-032 |
| INT-038 | Suspensión y reactivación de empresa E2E | BE-002, BE-003, BE-004, BE-005, FE-001 | Cierre/DoF |
| INT-024 | Aislamiento multiempresa E2E | BE-007, EN-011, EN-015 | INT-032 |
| INT-028 | Correlation ID E2E | BE-003, BE-055 | Cierre/DoF |

## Sprint 2 — Equipo, zonas, clientes y cartera

| ID | Historia | Depende de | Desbloquea |
|---|---|---|---|
| BE-062 | Gestionar zonas y territorios | BE-051, BE-058 | BE-008, BE-012, BE-013, BE-060, FE-006, FE-037, INT-034 |
| BE-008 | Crear vendedor | BE-058, BE-062 | BE-009, BE-010, BE-059, FE-006, INT-004 |
| BE-059 | Listar y consultar vendedores | BE-008 | BE-009, BE-011, BE-012, BE-016, BE-021, BE-060, FE-005, INT-004, INT-033, INT-034 |
| BE-009 | Editar vendedor | BE-008, BE-059 | FE-006 |
| BE-010 | Activar o inactivar vendedor | BE-005, BE-008 | FE-007, INT-004, INT-031 |
| BE-011 | Asignar supervisor | BE-058, BE-059 | FE-006, INT-033 |
| BE-012 | Asignar territorios | BE-059, BE-062 | FE-006 |
| BE-013 | Registrar cliente | BE-062, EN-014 | BE-014, BE-015, BE-016, BE-018, BE-021, BE-027, BE-034, BE-060, FE-009, INT-005 |
| BE-014 | Editar cliente y ubicación | BE-013 | FE-009, INT-005, INT-031 |
| BE-015 | Detectar clientes duplicados | BE-013, EN-014 | BE-019, FE-009, INT-005 |
| BE-016 | Listar y filtrar clientes | BE-013, BE-059 | FE-008, FE-010, INT-005 |
| BE-060 | Asignar cartera de clientes | BE-013, BE-059, BE-062 | BE-021, BE-027, FE-008, FE-036, INT-034 |
| FE-005 | Listado de vendedores | BE-059, FE-003, FE-034 | FE-006, FE-007, FE-036, INT-004 |
| FE-006 | Formulario de vendedor | BE-008, BE-009, BE-011, BE-012, BE-062, FE-005 | INT-004, INT-033 |
| FE-007 | Activar o inactivar vendedor | BE-010, FE-005 | INT-004 |
| FE-008 | Listado y filtros de clientes | BE-016, BE-060, FE-003, FE-034 | FE-009, FE-010, FE-011, FE-012, FE-036, INT-005 |
| FE-009 | Formulario de cliente y mapa | BE-013, BE-014, BE-015, EN-014, FE-008 | INT-005 |
| FE-010 | Mapa de clientes | BE-016, EN-014, FE-008 | INT-005 |
| FE-037 | Gestionar zonas y territorios | BE-062, FE-003, FE-034 | FE-036, INT-034 |
| FE-036 | Asignar cartera de clientes | BE-060, FE-005, FE-008, FE-037 | INT-034 |
| INT-004 | Alta de vendedor disponible en mobile | BE-008, BE-010, BE-059, FE-005, FE-006, FE-007, MOB-001 | Cierre/DoF |
| INT-005 | Cliente visible en mapa | BE-013, BE-014, BE-015, BE-016, FE-008, FE-009, FE-010 | Cierre/DoF |
| INT-033 | Gestión de supervisores y equipo E2E | BE-011, BE-058, BE-059, FE-004, FE-006 | Cierre/DoF |
| INT-034 | Asignación de cartera E2E | BE-059, BE-060, BE-062, FE-036, FE-037 | Cierre/DoF |

## Sprint 3 — Importación y configuración operativa

| ID | Historia | Depende de | Desbloquea |
|---|---|---|---|
| BE-018 | Generar plantilla de clientes | BE-013 | BE-019, FE-012, INT-006 |
| BE-019 | Procesar importación de clientes | BE-015, BE-018, BE-056 | BE-020, FE-012, FE-013, INT-006, INT-027 |
| BE-020 | Descargar errores de importación | BE-019 | FE-013, INT-006 |
| BE-054 | Configurar geocerca y tracking | BE-001, BE-051, EN-016 | BE-028, BE-034, BE-037, BE-043, FE-033, INT-013 |
| FE-012 | Carga de clientes | BE-018, BE-019, FE-008 | FE-013, INT-006 |
| FE-013 | Resultado de importación | BE-019, BE-020, FE-012 | INT-006 |
| FE-033 | Configurar geocerca y tracking | BE-054, FE-003, FE-034 | INT-013 |
| INT-006 | Importación completa de clientes | BE-018, BE-019, BE-020, BE-056, FE-012, FE-013 | INT-030 |

## Sprint 4 — Planificación y entrega de rutas

| ID | Historia | Depende de | Desbloquea |
|---|---|---|---|
| BE-021 | Crear ruta manual | BE-013, BE-059, BE-060 | BE-022, BE-023, BE-024, BE-026, BE-061, FE-015, INT-007 |
| BE-022 | Generar ruta automática básica | BE-021, EN-018 | FE-016, INT-008 |
| BE-023 | Reordenar puntos de ruta | BE-021 | BE-024, FE-015, FE-016, INT-007, INT-008 |
| BE-024 | Publicar ruta | BE-021, BE-023, BE-055 | BE-025, BE-035, BE-053, BE-061, FE-017, INT-007 |
| BE-053 | Notificar ruta publicada o modificada | BE-024, BE-055, BE-056, EN-017 | BE-025, INT-007, INT-009, INT-027, MOB-029 |
| BE-025 | Reasignar ruta | BE-024, BE-053 | FE-018, INT-009 |
| BE-026 | Duplicar ruta | BE-021 | FE-014, INT-007 |
| BE-027 | Sugerir clientes por frecuencia | BE-013, BE-060 | FE-015, INT-008 |
| BE-061 | Consultar rutas y ruta del día | BE-021, BE-024 | BE-028, BE-040, FE-014, FE-015, FE-019, INT-007, INT-008, INT-039, MOB-004 |
| FE-014 | Listado de rutas | BE-026, BE-061, FE-003, FE-034 | FE-015, FE-016, FE-018, FE-019, INT-007 |
| FE-015 | Crear ruta manual | BE-021, BE-023, BE-027, BE-061, FE-014 | FE-017, INT-007, INT-008 |
| FE-016 | Generar ruta automática | BE-022, BE-023, EN-018, FE-014 | INT-008 |
| FE-017 | Publicar ruta | BE-024, FE-015 | INT-007 |
| FE-018 | Reasignar ruta | BE-025, FE-014 | INT-009 |
| MOB-004 | Descargar ruta del día | BE-061, EN-015, MOB-002, MOB-027 | INT-007, MOB-005, MOB-007, MOB-029 |
| MOB-005 | Ver clientes pendientes y visitados | MOB-004 | MOB-006, MOB-011 |
| MOB-006 | Abrir navegación al cliente | EN-014, MOB-005 | INT-007 |
| MOB-029 | Recibir ruta asignada o modificada | BE-053, EN-017, MOB-004 | INT-007, INT-009 |
| INT-007 | Creación manual E2E | BE-021, BE-023, BE-024, BE-026, BE-053, BE-061, FE-014, FE-015, FE-017, MOB-004, MOB-006, MOB-029 | Cierre/DoF |
| INT-008 | Generación automática E2E | BE-022, BE-023, BE-027, BE-061, FE-015, FE-016 | Cierre/DoF |
| INT-009 | Reasignación E2E | BE-025, BE-053, FE-018, MOB-029 | Cierre/DoF |

## Sprint 5 — Jornada y tracking en vivo

| ID | Historia | Depende de | Desbloquea |
|---|---|---|---|
| BE-028 | Iniciar jornada | BE-054, BE-061, EN-016 | BE-029, BE-033, BE-034, INT-010, MOB-007 |
| BE-029 | Recibir ubicaciones | BE-028, EN-016 | BE-030, BE-032, BE-033, INT-010, INT-011, INT-026, MOB-008 |
| BE-030 | Mantener última ubicación en Redis | BE-029 | BE-031, FE-021, INT-010, INT-011, INT-026 |
| BE-031 | Publicar ubicación por WebSocket | BE-030 | BE-047, FE-020, INT-010, INT-011, INT-026 |
| BE-033 | Cerrar jornada | BE-028, BE-029 | INT-023, MOB-024 |
| FE-020 | Mapa en tiempo real | BE-031, EN-014, EN-016, FE-003, FE-034 | FE-021, INT-010, INT-011, INT-023, INT-026 |
| MOB-003 | Solicitar permiso de ubicación | EN-016, MOB-001 | MOB-007, MOB-026, MOB-030 |
| MOB-026 | Mostrar indicador de rastreo | EN-016, MOB-003 | INT-023, MOB-007, MOB-008 |
| MOB-007 | Iniciar jornada | BE-028, MOB-003, MOB-004, MOB-026 | INT-010, MOB-008, MOB-011, MOB-024 |
| MOB-008 | Capturar ubicación en segundo plano | BE-029, MOB-007, MOB-026 | INT-010, INT-011, MOB-009, MOB-030 |
| MOB-009 | Encolar ubicaciones sin conexión | EN-015, MOB-008 | MOB-010, MOB-028 |
| MOB-010 | Mostrar conectividad y sincronización | MOB-009 | MOB-024, MOB-025 |
| MOB-024 | Cerrar jornada | BE-033, MOB-007, MOB-010 | INT-023, MOB-025, MOB-031 |
| MOB-028 | Recuperar cola tras cierre forzado | EN-015, MOB-009, MOB-027 | INT-015, INT-018 |
| MOB-030 | Manejar batería y servicios desactivados | EN-016, MOB-003, MOB-008 | INT-010 |
| INT-010 | Inicio de jornada y presencia | BE-028, BE-029, BE-030, BE-031, FE-020, MOB-007, MOB-008, MOB-030 | Cierre/DoF |
| INT-011 | Ubicación en tiempo real E2E | BE-029, BE-030, BE-031, FE-020, MOB-008 | INT-030 |
| INT-026 | Operación ante caída de Redis | BE-029, BE-030, BE-031, FE-020 | Cierre/DoF |

## Sprint 6 — Recorrido histórico

| ID | Historia | Depende de | Desbloquea |
|---|---|---|---|
| BE-032 | Consultar historial de recorrido | BE-029, EN-016 | BE-048, FE-019, FE-022, INT-012, INT-039 |
| FE-022 | Historial de recorrido | BE-032, EN-014, EN-016, FE-003, FE-034 | INT-012 |
| INT-012 | Recorrido histórico E2E | BE-032, FE-022 | INT-039 |

## Sprint 7 — Visitas y ejecución de ruta

| ID | Historia | Depende de | Desbloquea |
|---|---|---|---|
| BE-034 | Validar proximidad | BE-013, BE-028, BE-054, EN-016 | BE-035, INT-013, MOB-011 |
| BE-035 | Iniciar visita | BE-024, BE-034, BE-055 | BE-036, BE-037, BE-038, BE-040, INT-013, INT-015, MOB-013, MOB-014 |
| BE-036 | Finalizar visita | BE-035 | BE-039, BE-040, BE-042, INT-014, INT-015, MOB-016, MOB-017 |
| BE-037 | Registrar visita fuera de ruta | BE-035, BE-054 | INT-016, MOB-018 |
| BE-038 | Autorizar excepción de geocerca | BE-035, BE-051 | FE-038, INT-036 |
| BE-039 | Corregir visita | BE-036, BE-051 | FE-025, INT-016 |
| BE-040 | Consultar visitas y pendientes | BE-035, BE-036, BE-061 | BE-017, BE-047, BE-048, FE-019, FE-021, FE-023, FE-024, INT-016, INT-039 |
| FE-019 | Comparar ruta planificada y ejecutada | BE-032, BE-040, BE-061, EN-014, FE-014 | INT-039 |
| FE-023 | Listado de visitas | BE-040, FE-003, FE-034 | FE-024, FE-038, INT-014, INT-016 |
| FE-024 | Detalle de visita | BE-040, FE-023 | FE-025, INT-014, INT-016 |
| FE-025 | Corregir visita | BE-039, FE-024 | INT-016 |
| FE-038 | Autorizar excepción de geocerca | BE-038, FE-023, FE-034 | INT-036 |
| MOB-011 | Calcular proximidad local | BE-034, MOB-005, MOB-007 | INT-013, MOB-012 |
| MOB-012 | Habilitar flag de visita | MOB-011 | INT-013, MOB-013, MOB-014, MOB-018 |
| MOB-013 | Iniciar visita online | BE-035, MOB-012 | INT-013, INT-036, MOB-016 |
| MOB-014 | Iniciar visita offline | BE-035, EN-015, MOB-012 | INT-015, MOB-015, MOB-016 |
| MOB-015 | Recuperar visita activa tras reinicio | MOB-014, MOB-027 | INT-015 |
| MOB-016 | Finalizar visita | BE-036, MOB-013, MOB-014 | INT-014, INT-015, MOB-017, MOB-020, MOB-021, MOB-025 |
| MOB-017 | Registrar motivo de no venta | BE-036, MOB-016 | INT-014 |
| MOB-018 | Registrar visita fuera de ruta | BE-037, MOB-012 | INT-016 |
| MOB-025 | Resolver cierre con pendientes | MOB-010, MOB-016, MOB-024 | INT-023 |
| INT-013 | Check-in por geocerca E2E | BE-034, BE-035, BE-054, FE-033, MOB-011, MOB-012, MOB-013 | INT-036 |
| INT-014 | Check-out E2E | BE-036, FE-023, FE-024, MOB-016, MOB-017 | Cierre/DoF |
| INT-015 | Visita offline sincronizada | BE-035, BE-036, EN-015, MOB-014, MOB-015, MOB-016, MOB-028 | INT-032 |
| INT-016 | Consulta administrativa de visitas | BE-037, BE-039, BE-040, FE-023, FE-024, FE-025, MOB-018 | INT-039 |
| INT-023 | Cierre de jornada y detención de tracking | BE-033, FE-020, MOB-024, MOB-025, MOB-026 | Cierre/DoF |
| INT-036 | Excepción de geocerca E2E | BE-038, FE-038, INT-013, MOB-013 | Cierre/DoF |
| INT-039 | Ruta planificada vs. ejecutada E2E | BE-032, BE-040, BE-061, FE-019, INT-012, INT-016 | Cierre/DoF |

## Sprint 8 — Ventas e histórico comercial

| ID | Historia | Depende de | Desbloquea |
|---|---|---|---|
| BE-041 | Gestionar productos | BE-051, BE-058 | FE-035, INT-035, MOB-019, MOB-021 |
| BE-042 | Registrar venta | BE-036, BE-055 | BE-043, BE-044, BE-045, BE-046, INT-017, INT-018, MOB-020, MOB-021, MOB-022 |
| BE-043 | Editar venta dentro de ventana | BE-042, BE-054 | INT-037, MOB-032 |
| BE-044 | Anular venta | BE-042, BE-051, BE-055 | FE-029, INT-019, INT-031 |
| BE-045 | Consultar ventas del día | BE-042 | BE-047, BE-048, FE-021, FE-026, INT-019, INT-037, MOB-023 |
| BE-046 | Consultar histórico de ventas | BE-042 | BE-017, BE-050, FE-027, INT-020, INT-037 |
| BE-017 | Consultar historial de cliente | BE-040, BE-046 | BE-049, FE-011, INT-020 |
| BE-048 | Reporte por vendedor | BE-032, BE-040, BE-045 | BE-050, FE-028, INT-021 |
| BE-049 | Reporte por cliente | BE-017 | BE-050, INT-020 |
| FE-011 | Historial de cliente | BE-017, FE-008 | INT-020 |
| FE-021 | Detalle de vendedor activo | BE-030, BE-040, BE-045, FE-020 | INT-021 |
| FE-026 | Ventas del día | BE-045, FE-003, FE-034 | FE-027, FE-028, FE-029, INT-017, INT-018, INT-019 |
| FE-027 | Histórico de ventas | BE-046, FE-026 | INT-020 |
| FE-028 | Resultados por vendedor | BE-048, FE-026 | INT-021 |
| FE-029 | Anular venta | BE-044, FE-026 | INT-019 |
| FE-035 | Gestionar catálogo de productos | BE-041, FE-003, FE-034 | INT-035 |
| MOB-019 | Consultar catálogo offline | BE-041, EN-015, MOB-027 | INT-035, MOB-021 |
| MOB-020 | Registrar venta simple | BE-042, MOB-016 | INT-017, MOB-022 |
| MOB-021 | Registrar venta detallada | BE-041, BE-042, MOB-016, MOB-019 | INT-035 |
| MOB-022 | Sincronizar venta idempotente | BE-042, EN-015, MOB-020 | INT-018, INT-035, MOB-023, MOB-032 |
| MOB-023 | Consultar ventas propias del día | BE-045, MOB-022 | MOB-031, MOB-032 |
| MOB-032 | Editar venta dentro de ventana | BE-043, EN-015, MOB-022, MOB-023 | INT-037 |
| INT-017 | Venta durante visita E2E | BE-042, FE-026, MOB-020 | Cierre/DoF |
| INT-018 | Venta offline sincronizada | BE-042, EN-015, FE-026, MOB-022, MOB-028 | INT-032 |
| INT-019 | Ventas del día E2E | BE-044, BE-045, FE-026, FE-029 | INT-030 |
| INT-020 | Histórico por cliente E2E | BE-017, BE-046, BE-049, FE-011, FE-027 | Cierre/DoF |
| INT-021 | Resultados por vendedor E2E | BE-048, FE-021, FE-028 | Cierre/DoF |
| INT-035 | Catálogo disponible en venta E2E | BE-041, FE-035, MOB-019, MOB-021, MOB-022 | Cierre/DoF |
| INT-037 | Edición de venta E2E | BE-043, BE-045, BE-046, BE-051, MOB-032 | Cierre/DoF |

## Sprint 9 — Dashboard, reportes, auditoría y estabilización

| ID | Historia | Depende de | Desbloquea |
|---|---|---|---|
| BE-047 | Calcular dashboard diario | BE-031, BE-040, BE-045 | FE-030, INT-022, MOB-031 |
| BE-050 | Exportar reportes | BE-046, BE-048, BE-049, BE-056 | FE-031, INT-040 |
| BE-052 | Consultar auditoría | BE-051 | FE-032, INT-025 |
| FE-030 | Dashboard diario | BE-047, FE-003, FE-034 | FE-031, INT-022 |
| FE-031 | Reportes y exportaciones | BE-050, FE-030 | INT-040 |
| FE-032 | Consulta de auditoría | BE-052, FE-003, FE-034 | INT-025 |
| MOB-031 | Consultar resumen diario | BE-047, MOB-023, MOB-024 | INT-022 |
| INT-022 | Dashboard diario E2E | BE-047, FE-030, MOB-031 | INT-030 |
| INT-025 | Auditoría transversal | BE-051, BE-052, FE-032 | Cierre/DoF |
| INT-027 | Reintentos y DLQ E2E | BE-019, BE-053, BE-055, BE-056 | INT-032 |
| INT-029 | Backup y restore probado | EN-005 | Cierre/DoF |
| INT-030 | Validación de rendimiento MVP | INT-006, INT-011, INT-019, INT-022 | Cierre/DoF |
| INT-031 | Retención y eliminación lógica E2E | BE-010, BE-014, BE-044, BE-051, EN-016 | INT-032 |
| INT-040 | Exportación de reportes E2E | BE-050, BE-056, FE-031 | Cierre/DoF |
| INT-032 | Revisión de seguridad del flujo crítico | INT-003, INT-015, INT-018, INT-024, INT-027, INT-031 | Cierre/DoF |

