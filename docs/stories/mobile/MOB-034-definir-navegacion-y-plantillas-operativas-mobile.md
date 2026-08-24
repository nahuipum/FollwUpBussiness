# MOB-034 — Definir navegación y plantillas operativas mobile

**Área:** Mobile  
**Tipo:** Historia de habilitación de experiencia  
**Épica:** Experiencia  
**Prioridad:** Must Have  
**Fase:** MVP

## Historia

**Como** vendedor  
**Quiero** una estructura de navegación y estados comunes predecibles  
**Para** continuar mi jornada y resolver incidencias sin perder el contexto.

## Alcance

Definir e implementar el *app shell* autenticado, las rutas internas y las
plantillas reutilizables para carga, vacío, error, acceso no disponible y dato
desactualizado. La arquitectura deja preparados los destinos de ruta, jornada,
visita, ventas y resumen, pero no implementa sus acciones de negocio ni
inventan datos cuando el productor todavía no existe.

## Criterios de aceptación

1. El arranque restaura de forma segura la sesión existente o dirige a acceso;
   al logout o cambio de empresa se limpia el estado en memoria y no se puede
   volver a una pantalla protegida con navegación atrás.
2. La navegación autenticada ofrece un punto de entrada de jornada y accesos a
   Ruta, Visita, Ventas y Resumen cuando cada capacidad esté disponible; los
   destinos no disponibles muestran una explicación, no un flujo simulado.
3. La jerarquía de pantallas, regreso, cierre de diálogos y foco de lectores
   de pantalla es coherente y verificable con teclado/tecnologías asistivas.
4. Las plantillas de carga, vacío, error, sin permiso y dato desactualizado
   admiten acción de recuperación cuando existe y nunca presentan ubicación o
   sincronización antigua como actual.
5. La interfaz conserva el contexto visual durante reintentos y rotaciones,
   sin persistir credenciales ni datos personales fuera de la política de
   `MOB-027` y `EN-015`.

## Referencias

- RNF-002
- RNF-006
- EN-015
- MOB-001
- MOB-002
- MOB-027

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 3 — Importación y configuración operativa.
- **Predecesoras obligatorias:** `MOB-002` — Renovar y cerrar sesión; `MOB-027` — Proteger datos locales; `MOB-033` — Definir sistema visual y componentes base mobile.
- **Historias consecuentes que habilita:** `MOB-004` a `MOB-006`; `MOB-007` a `MOB-026`; `MOB-029` a `MOB-032`.
- **Validación vertical:** pruebas de widgets y navegación, más uso efectivo en las historias funcionales.

## Puerta de Ready para esta historia

- La sesión, disposición de datos locales y roles proceden de los contratos ya
  aprobados; la navegación no los sustituye ni autoriza recursos.
- Cada destino futuro declara su contrato y productor antes de habilitar sus
  acciones dentro del shell.
<!-- delivery-traceability:end -->
