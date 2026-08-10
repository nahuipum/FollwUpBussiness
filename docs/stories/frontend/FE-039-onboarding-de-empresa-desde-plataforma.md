# FE-039 — Onboarding de empresa desde plataforma

**Área:** Frontend  
**Tipo:** Historia de usuario  
**Épica:** Onboarding  
**Prioridad:** Must Have  
**Fase:** MVP

## Historia

**Como** superadministrador de plataforma  
**Quiero** crear una empresa y provisionar su administrador inicial  
**Para** habilitar un nuevo tenant sin intervención manual en la base de datos

## Alcance

Panel web de plataforma para listar empresas, crear una empresa con la configuración inicial permitida por el contrato y, tras su creación, invitar a su único administrador inicial. Consume `GET/POST /platform/companies` y `POST /platform/companies/{companyId}/initial-admin`.

## Criterios de aceptación

1. Solo `PLATFORM_SUPERADMIN` accede a la lista y al flujo de alta; el Backend sigue siendo la autoridad.
2. El formulario crea la empresa con los campos y valores iniciales permitidos por el contrato y muestra validaciones o errores recuperables sin datos sensibles.
3. Tras crear una empresa activa, permite provisionar únicamente su administrador inicial con nombre, correo y, si aplica, nombre de usuario; no ofrece roles arbitrarios ni credenciales predeterminadas.
4. La confirmación informa que la invitación/activación fue aceptada sin mostrar token, enlace, secreto ni datos de otro tenant.
5. Lista y estado se actualizan tras cada operación; `401`, `403`, `404`, `409` y `422` usan el manejo global de FE-034 y muestran `correlationId` solo de la solicitud vigente.

## Referencias

- Flujo 12.1
- RF-AUT-003
- RF-AUT-005
- RN-001
- RN-002

## Seguridad y privacidad

- No enviar ni seleccionar `tenantId` desde el cliente; la empresa destino se identifica únicamente por la ruta contractual tras su creación/listado.
- No mostrar ni persistir token/enlace de activación, credenciales, secretos o datos de otras empresas.
- La visibilidad de acciones mejora la experiencia, pero no sustituye la autorización del Backend.

## Observabilidad

- Propagar y mostrar `correlationId` según FE-034 cuando aplique.
- Registrar resultado y error sin datos personales completos ni secretos.

## Evidencia mínima para DoF

- Implementación y pruebas de lista, alta, aprovisionamiento y errores.
- Matriz criterio → evidencia.
- QA independiente y revisión de seguridad.
- Validación vertical mediante INT-001.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-001` — Crear una empresa; `BE-057` — Provisionar administrador inicial de empresa; `FE-003` — Gestión de sesión; `FE-034` — Manejo global de errores y permisos.
- **Historias consecuentes que habilita:** `INT-001` — Onboarding completo de empresa.
- **Validación vertical:** `INT-001` — Onboarding completo de empresa.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/platform/companies` y `/platform/companies/{companyId}/initial-admin`; flujo de activación inicial de BE-006.
- El contrato no puede modificarse silenciosamente para acomodar una implementación.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** empresa, estado, configuración inicial y administrador invitado; nunca contraseña, refresh token ni enlace de activación.
- El Backend deriva actor, autorización y límites de tenant; la web no ofrece cambio de empresa ni administra usuarios de plataforma desde este flujo.
- Casos mínimos: empresa creada, validación, conflicto, empresa no activa/no encontrada, permiso denegado, invitación repetida y cambio de sesión.

## Riesgos conocidos

- QA y Seguridad deben cubrir escalación a rol de plataforma, aprovisionamiento para empresa ajena, fuga de activación y estado residual entre sesiones.

## Fuera de alcance

- Registro público/autoservicio, facturación SaaS, suspensión/reactivación, roles personalizados, edición posterior de la empresa y administración de usuarios de la empresa.

## Puerta de Ready para esta historia

- Dependencias terminadas o con contrato estable y mock acordado.
- Matriz criterio → prueba preparada; no se implementa sin productor Backend real.
<!-- delivery-traceability:end -->
