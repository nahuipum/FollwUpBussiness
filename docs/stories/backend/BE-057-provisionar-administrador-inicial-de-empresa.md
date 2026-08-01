# BE-057 — Provisionar administrador inicial de empresa

**Área:** Backend  
**Tipo:** Historia de usuario  
**Épica:** Identidad  
**Prioridad:** Must Have  
**Fase:** MVP

## Historia

**Como** superadministrador de plataforma  
**Quiero** provisionar el administrador inicial de una empresa activa  
**Para** que la empresa pueda administrar sus usuarios y su operación

## Alcance

Crear un usuario de acceso asociado a una empresa existente y activa,
asignándole únicamente el rol base `COMPANY_ADMIN`. El primer acceso reutiliza
el mecanismo de activación de un solo uso de BE-006; no se genera ni comunica
una contraseña predeterminada.

## Criterios de aceptación

1. Solo un superadministrador autorizado puede provisionar el administrador inicial.
2. El usuario queda asociado a una empresa activa y al rol `COMPANY_ADMIN`.
3. Correo o nombre de usuario se valida como único dentro de la empresa.
4. La cuenta no tiene una contraseña predeterminada utilizable; el enlace/token
   de activación es de un solo uso, expira y nunca aparece en auditoría o logs.
5. La operación se audita sin datos personales completos ni secretos.
6. No es posible asignar desde este flujo un rol de plataforma, un rol arbitrario ni una empresa distinta de la autorizada.

## Fuera de alcance

- Registro público o autoservicio de usuarios.
- Creación de vendedores; corresponde a BE-008.
- Login, renovación y revocación de sesión.
- Modificación de roles o permisos; corresponde a BE-007.
- Bootstrap operativo del primer superadministrador de plataforma; corresponde a EN-012.

## Dependencias

- EN-010 — Configurar Spring Security y gestión local de secretos.
- EN-011 — Definir catálogo de roles base.
- EN-012 — Bootstrap controlado del superadministrador de plataforma.
- BE-001 — Crear una empresa.

## Referencias

- Tipos de usuario 6.1 y 6.4
- RF-AUT-003
- RF-AUT-005
- RN-001
- RN-002
- RNF-005
- RNF-006
- RNF-008

## Seguridad y privacidad

- Derivar tenant y actor de la identidad autenticada; no aceptarlos ciegamente desde el cliente.
- Aplicar autorización por recurso sobre la empresa destino.
- No registrar secretos ni datos personales completos.

## Observabilidad

- Propagar correlationId cuando aplique.
- Registrar operación, resultado, latencia y tipo de error sin valores sensibles.

## Evidencia mínima para DoF

- Implementación, migraciones, OpenAPI y pruebas.
- Matriz criterio → evidencia.
- QA independiente, revisión de seguridad y documentación del procedimiento de bootstrap.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-001` — Crear una empresa; `BE-006` — Recuperar contraseña; `BE-007` — Gestionar roles y permisos; `BE-051` — Registrar acciones críticas
- **Historias consecuentes que habilita:** `BE-058` — Gestionar usuarios de empresa; `INT-001` — Onboarding completo de empresa
- **Validación vertical:** `INT-001` — Onboarding completo de empresa

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** ADR de autenticación; OpenAPI `/auth/*` y `/company/users`; política de errores.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Usuario, rol, permiso, tenant, sesión/credencial, expiración, revocación y token de activación/recuperación.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: enumeración de cuentas, escalación de privilegios, sesión robada y cruce de tenant.

## Fuera de alcance

- registro público, roles arbitrarios y autenticación social.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
