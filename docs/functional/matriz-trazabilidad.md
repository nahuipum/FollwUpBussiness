# Matriz de trazabilidad

| Historia | Área | Referencias |
|---|---|---|
| BE-001 — Crear una empresa | Backend | Empresa 14.1; RN-001; RN-002 |
| BE-002 — Suspender y reactivar empresa | Backend | Tipos de usuario 6.4 |
| BE-057 — Provisionar administrador inicial de empresa | Backend | Tipos de usuario 6.1 y 6.4; RF-AUT-003; RF-AUT-005; RN-001; RN-002; RNF-005; RNF-006; RNF-008 |
| BE-003 — Autenticar usuario | Backend | RF-AUT-001; RNF-005 |
| BE-004 — Renovar sesión | Backend | RF-AUT-004 |
| BE-005 — Cerrar y revocar sesión | Backend | RF-AUT-004; RF-AUT-005 |
| BE-006 — Recuperar contraseña | Backend | RF-AUT-002 |
| BE-007 — Gestionar roles y permisos | Backend | RF-AUT-003; RNF-006 |
| BE-008 — Crear vendedor | Backend | RF-VEN-001; HU-002 |
| BE-009 — Editar vendedor | Backend | RF-VEN-002 |
| BE-010 — Activar o inactivar vendedor | Backend | RF-VEN-003; RN-013 |
| BE-011 — Asignar supervisor | Backend | RF-VEN-004 |
| BE-012 — Asignar territorios | Backend | RF-VEN-005 |
| BE-013 — Registrar cliente | Backend | RF-CLI-001; RF-CLI-002; HU-010 |
| BE-014 — Editar cliente y ubicación | Backend | RF-CLI-005; RF-AUD-001 |
| BE-015 — Detectar clientes duplicados | Backend | RN-015 |
| BE-016 — Listar y filtrar clientes | Backend | RF-CLI-007 |
| BE-017 — Consultar historial de cliente | Backend | RF-CLI-008; HU-012 |
| BE-018 — Generar plantilla de clientes | Backend | RF-CLI-004 |
| BE-019 — Procesar importación de clientes | Backend | RF-CLI-004; HU-011 |
| BE-020 — Descargar errores de importación | Backend | RF-CLI-004 |
| BE-021 — Crear ruta manual | Backend | RF-RUT-001; HU-020 |
| BE-022 — Generar ruta automática básica | Backend | RF-RUT-002; RF-RUT-003; HU-021 |
| BE-023 — Reordenar puntos de ruta | Backend | RF-RUT-004 |
| BE-024 — Publicar ruta | Backend | RF-RUT-005; RF-RUT-006; RF-RUT-007 |
| BE-025 — Reasignar ruta | Backend | RF-RUT-009; RN-019; HU-022 |
| BE-026 — Duplicar ruta | Backend | RF-RUT-010 |
| BE-027 — Sugerir clientes por frecuencia | Backend | RF-RUT-011 |
| BE-028 — Iniciar jornada | Backend | RF-UBI-001; HU-030 |
| BE-029 — Recibir ubicaciones | Backend | RF-UBI-002; RF-UBI-003; 15.1 |
| BE-030 — Mantener última ubicación en Redis | Backend | RF-UBI-004; RN-016 |
| BE-031 — Publicar ubicación por WebSocket | Backend | RF-UBI-004; RN-016 |
| BE-032 — Consultar historial de recorrido | Backend | RF-UBI-006; HU-032 |
| BE-033 — Cerrar jornada | Backend | RF-UBI-007; RF-UBI-008; RN-020 |
| BE-034 — Validar proximidad | Backend | RF-VIS-001; RN-005; RN-006 |
| BE-035 — Iniciar visita | Backend | RF-VIS-002; RF-VIS-003; RF-VIS-004; HU-040 |
| BE-036 — Finalizar visita | Backend | RF-VIS-005; RF-VIS-010; HU-041 |
| BE-037 — Registrar visita fuera de ruta | Backend | RF-VIS-007 |
| BE-038 — Autorizar excepción de geocerca | Backend | RN-007 |
| BE-039 — Corregir visita | Backend | RF-VIS-008 |
| BE-040 — Consultar visitas y pendientes | Backend | RF-VIS-009; HU-043 |
| BE-041 — Gestionar productos | Backend | RF-VTA-003; Modelo Producto |
| BE-042 — Registrar venta | Backend | RF-VTA-001; RF-VTA-002; RF-VTA-005; HU-050 |
| BE-043 — Editar venta dentro de ventana | Backend | RN-012 |
| BE-044 — Anular venta | Backend | RF-VTA-010; RN-013 |
| BE-045 — Consultar ventas del día | Backend | RF-VTA-006; HU-051 |
| BE-046 — Consultar histórico de ventas | Backend | RF-VTA-007; RF-VTA-008; RF-VTA-009; HU-052; HU-053 |
| BE-047 — Calcular dashboard diario | Backend | RF-REP-001; HU-060 |
| BE-048 — Reporte por vendedor | Backend | RF-REP-002 |
| BE-049 — Reporte por cliente | Backend | RF-REP-003 |
| BE-050 — Exportar reportes | Backend | RF-REP-005; RF-VTA-011 |
| BE-051 — Registrar acciones críticas | Backend | RF-AUD-001; RF-AUD-002 |
| BE-052 — Consultar auditoría | Backend | RF-AUD-002 |
| BE-053 — Notificar ruta publicada o modificada | Backend | RF-RUT-007 |
| BE-054 — Configurar geocerca y tracking | Backend | RN-006; RF-UBI-003 |
| BE-055 — Implementar outbox transaccional | Backend | RNF-013; RNF-014 |
| BE-056 — Gestionar reintentos y DLQ | Backend | RNF-014 |
| FE-001 — Pantalla de inicio de sesión | Frontend | RF-AUT-001 |
| FE-002 — Recuperación de contraseña | Frontend | RF-AUT-002 |
| FE-003 — Gestión de sesión | Frontend | RF-AUT-004 |
| FE-004 — Gestión de usuarios y roles | Frontend | RF-AUT-003; RF-AUT-005 |
| FE-005 — Listado de vendedores | Frontend | RF-VEN-001..005 |
| FE-006 — Formulario de vendedor | Frontend | RF-VEN-001; RF-VEN-002 |
| FE-007 — Activar o inactivar vendedor | Frontend | RF-VEN-003 |
| FE-008 — Listado y filtros de clientes | Frontend | RF-CLI-007 |
| FE-009 — Formulario de cliente y mapa | Frontend | RF-CLI-001; RF-CLI-002; RF-CLI-005 |
| FE-010 — Mapa de clientes | Frontend | RF-CLI-006 |
| FE-011 — Historial de cliente | Frontend | RF-CLI-008 |
| FE-012 — Carga de clientes | Frontend | RF-CLI-004 |
| FE-013 — Resultado de importación | Frontend | RF-CLI-004 |
| FE-014 — Listado de rutas | Frontend | RF-RUT-001..010 |
| FE-015 — Crear ruta manual | Frontend | RF-RUT-001; HU-020 |
| FE-016 — Generar ruta automática | Frontend | RF-RUT-002; RF-RUT-003; HU-021 |
| FE-017 — Publicar ruta | Frontend | RF-RUT-006; RF-RUT-007 |
| FE-018 — Reasignar ruta | Frontend | RF-RUT-009; HU-022 |
| FE-019 — Comparar ruta planificada y ejecutada | Frontend | RF-RUT-008 |
| FE-020 — Mapa en tiempo real | Frontend | RF-UBI-004; HU-031 |
| FE-021 — Detalle de vendedor activo | Frontend | RF-UBI-004; RF-UBI-005 |
| FE-022 — Historial de recorrido | Frontend | RF-UBI-006; HU-032 |
| FE-023 — Listado de visitas | Frontend | RF-VIS-009; HU-043 |
| FE-024 — Detalle de visita | Frontend | RF-VIS-003; RF-VIS-005; RF-VIS-008 |
| FE-025 — Corregir visita | Frontend | RF-VIS-008 |
| FE-026 — Ventas del día | Frontend | RF-VTA-006; HU-051 |
| FE-027 — Histórico de ventas | Frontend | RF-VTA-007; HU-052 |
| FE-028 — Resultados por vendedor | Frontend | RF-VTA-009; HU-053 |
| FE-029 — Anular venta | Frontend | RF-VTA-010 |
| FE-030 — Dashboard diario | Frontend | RF-REP-001; HU-060 |
| FE-031 — Reportes y exportaciones | Frontend | RF-REP-002..005 |
| FE-032 — Consulta de auditoría | Frontend | RF-AUD-002 |
| FE-033 — Configurar geocerca y tracking | Frontend | RN-006; RF-UBI-003 |
| FE-034 — Manejo global de errores y permisos | Frontend | RNF-002; RNF-006 |
| MOB-001 — Iniciar sesión móvil | Mobile | RF-AUT-001 |
| MOB-002 — Renovar y cerrar sesión | Mobile | RF-AUT-004; RN-020 |
| MOB-003 — Solicitar permiso de ubicación | Mobile | 17.2; RF-UBI-001 |
| MOB-004 — Descargar ruta del día | Mobile | RF-RUT-007; RF-UBI-001 |
| MOB-005 — Ver clientes pendientes y visitados | Mobile | Módulo vendedor MVP |
| MOB-006 — Abrir navegación al cliente | Mobile | Módulo vendedor MVP |
| MOB-007 — Iniciar jornada | Mobile | RF-UBI-001; HU-030 |
| MOB-008 — Capturar ubicación en segundo plano | Mobile | RF-UBI-002; RF-UBI-003; RF-UBI-008 |
| MOB-009 — Encolar ubicaciones sin conexión | Mobile | RNF-012; RNF-013 |
| MOB-010 — Mostrar conectividad y sincronización | Mobile | RF-VTA-012; HU-042 |
| MOB-011 — Calcular proximidad local | Mobile | RF-VIS-001; RF-VIS-002 |
| MOB-012 — Habilitar flag de visita | Mobile | RF-VIS-002; HU-040 |
| MOB-013 — Iniciar visita online | Mobile | RF-VIS-003; RF-VIS-004 |
| MOB-014 — Iniciar visita offline | Mobile | HU-042; RNF-012; RNF-013 |
| MOB-015 — Recuperar visita activa tras reinicio | Mobile | RF-VIS-004 |
| MOB-016 — Finalizar visita | Mobile | RF-VIS-005; HU-041 |
| MOB-017 — Registrar motivo de no venta | Mobile | RN-010; RN-017 |
| MOB-018 — Registrar visita fuera de ruta | Mobile | RF-VIS-007 |
| MOB-019 — Consultar catálogo offline | Mobile | RF-VTA-003 |
| MOB-020 — Registrar venta simple | Mobile | RF-VTA-004; HU-050 |
| MOB-021 — Registrar venta detallada | Mobile | RF-VTA-002; RF-VTA-005 |
| MOB-022 — Sincronizar venta idempotente | Mobile | RF-VTA-012; RNF-013 |
| MOB-023 — Consultar ventas propias del día | Mobile | Módulo vendedor MVP |
| MOB-024 — Cerrar jornada | Mobile | RF-UBI-007; RF-UBI-008 |
| MOB-025 — Resolver cierre con pendientes | Mobile | RF-UBI-007 |
| MOB-026 — Mostrar indicador de rastreo | Mobile | RN-004; RF-UBI-008 |
| MOB-027 — Proteger datos locales | Mobile | RNF-004; RNF-007 |
| MOB-028 — Recuperar cola tras cierre forzado | Mobile | 15.3; RNF-012; RNF-013 |
| MOB-029 — Recibir ruta asignada o modificada | Mobile | RF-RUT-007 |
| MOB-030 — Manejar batería y servicios desactivados | Mobile | R-001; R-002 |
| MOB-031 — Consultar resumen diario | Mobile | 12.6; 18.1..18.3 |
| INT-001 — Onboarding completo de empresa | Integración | Flujo 12.1 |
| INT-002 — Autenticación web completa | Integración | HU-001; RF-AUT |
| INT-003 — Autenticación móvil completa | Integración | RF-AUT |
| INT-004 — Alta de vendedor disponible en mobile | Integración | HU-002 |
| INT-005 — Cliente visible en mapa | Integración | HU-010 |
| INT-006 — Importación completa de clientes | Integración | HU-011 |
| INT-007 — Creación manual E2E | Integración | HU-020 |
| INT-008 — Generación automática E2E | Integración | HU-021 |
| INT-009 — Reasignación E2E | Integración | HU-022 |
| INT-010 — Inicio de jornada y presencia | Integración | HU-030 |
| INT-011 — Ubicación en tiempo real E2E | Integración | HU-031 |
| INT-012 — Recorrido histórico E2E | Integración | HU-032 |
| INT-013 — Check-in por geocerca E2E | Integración | HU-040 |
| INT-014 — Check-out E2E | Integración | HU-041 |
| INT-015 — Visita offline sincronizada | Integración | HU-042 |
| INT-016 — Consulta administrativa de visitas | Integración | HU-043 |
| INT-017 — Venta durante visita E2E | Integración | HU-050 |
| INT-018 — Venta offline sincronizada | Integración | RF-VTA-012 |
| INT-019 — Ventas del día E2E | Integración | HU-051 |
| INT-020 — Histórico por cliente E2E | Integración | HU-052 |
| INT-021 — Resultados por vendedor E2E | Integración | HU-053 |
| INT-022 — Dashboard diario E2E | Integración | HU-060 |
| INT-023 — Cierre de jornada y detención de tracking | Integración | RF-UBI-007; RF-UBI-008 |
| INT-024 — Aislamiento multiempresa E2E | Integración | RN-001; RN-002 |
| INT-025 — Auditoría transversal | Integración | RF-AUD-001; RF-AUD-002 |
| INT-026 — Operación ante caída de Redis | Integración | RNF-001; ADR-004 |
| INT-027 — Reintentos y DLQ E2E | Integración | ADR-005; RNF-014 |
| INT-028 — Correlation ID E2E | Integración | RNF-014 |
| INT-029 — Backup y restore probado | Integración | RNF-009; RNF-010 |
| INT-030 — Validación de rendimiento MVP | Integración | RNF-002; RNF-003 |
| INT-031 — Retención y eliminación lógica E2E | Integración | RN-013; 17.3 |
| INT-032 — Revisión de seguridad del flujo crítico | Integración | 23.3; 17 |
