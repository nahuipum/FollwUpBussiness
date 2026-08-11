# FE-041 — Detalle de empresa desde plataforma

**Área:** Frontend  
**Tipo:** Historia de usuario  
**Épica:** Base SaaS  
**Prioridad:** Must Have  
**Fase:** MVP

## Historia

**Como** superadministrador de plataforma  
**Quiero** consultar el detalle de una empresa  
**Para** verificar su configuración y estado antes de realizar una acción de plataforma

## Alcance

Crear una vista o panel de detalle que consulte `GET /platform/companies/{companyId}` y muestre únicamente los datos contractuales de la empresa: identidad visible, código, estado y configuración inicial permitida. Es un contexto de consulta; las acciones de estado pertenecen a FE-040.

## Criterios de aceptación

1. Solo `PLATFORM_SUPERADMIN` puede abrir el detalle; el Backend autoriza cada consulta.
2. Desde el listado se puede abrir el detalle de una empresa y volver conservando búsqueda, filtro y paginación.
3. El detalle muestra nombre legal, nombre comercial cuando exista, código, estado, zona horaria y configuración inicial devuelta por el contrato; no inventa ni permite editar campos.
4. Diferencia claramente `ACTIVE` de `SUSPENDED` y no presenta una empresa suspendida como operativa.
5. Incluye estados de carga, no encontrado, sin permiso y error recuperable conforme a FE-034, con `correlationId` solo de la solicitud vigente.
6. El cambio de sesión, logout o respuesta obsoleta limpia el detalle y evita presentar datos de la identidad anterior.

## Referencias

- Tipos de usuario 6.4
- RN-001, RN-002
- BE-001, BE-002
- FE-039

## Seguridad y privacidad

- El identificador se codifica como segmento de ruta y no se deriva de entrada libre para conceder acceso.
- No exponer administradores, enlaces de activación, credenciales, tokens, secretos ni datos operativos de la empresa.
- La visibilidad UI no reemplaza la autorización de recurso del servidor.

## Observabilidad

- Propagar y mostrar `correlationId` según FE-034 cuando aplique.
- No registrar datos personales completos ni secretos.

## Evidencia mínima para DoF

- Pruebas de detalle válido, `404`, `403`, recarga y limpieza por cambio de sesión.
- QA independiente y revisión de seguridad.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-001` — Crear una empresa; `BE-002` — Suspender y reactivar empresa; `FE-003` — Gestión de sesión; `FE-034` — Manejo global de errores y permisos; `FE-039` — Onboarding de empresa desde plataforma.
- **Historias consecuentes que habilita:** `FE-040` — Suspender y reactivar empresa desde plataforma.
- **Validación vertical:** ampliar `INT-001` con consulta de empresa o crear una integración específica si se requiere cubrir la vista en E2E.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `GET /platform/companies/{companyId}`.
- El contrato no puede modificarse silenciosamente para acomodar una implementación.

## Datos, reglas y casos límite

- **Datos mínimos:** identificador, nombres permitidos, código, estado y configuración inicial devuelta por el contrato.
- Casos mínimos: empresa inexistente, permiso denegado, empresa suspendida, navegación directa, cambio de sesión y respuesta obsoleta.

## Fuera de alcance

- Editar empresa, suspensión/reactivación, gestión de administradores de empresa, planes, métricas técnicas, soporte y auditoría de plataforma.

## Puerta de Ready para esta historia

- El endpoint de detalle devuelve el modelo necesario o se estabiliza antes de desarrollar.
- La matriz criterio → prueba está preparada.
<!-- delivery-traceability:end -->

