# MOB-001 — Iniciar sesión móvil

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Acceso  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** iniciar sesión y recuperar mi contraseña
    **Para** acceder a mi jornada

    ## Alcance

    Integrar las pantallas Flutter existentes de inicio de sesión, solicitud de
    recuperación y restablecimiento de contraseña, con sesión segura. La
    recuperación solicita el correo al backend; el backend/servicio de
    notificaciones envía el correo, nunca el cliente móvil.

    ## Criterios de aceptación

    1. Credenciales válidas.
2. Error neutral.
3. Token en secure storage.
4. Datos locales segregados.
5. Solo un usuario utilizable con roles exclusivamente SELLER obtiene sesión
   MOBILE; cualquier otro conjunto recibe rechazo neutral sin tokens, familia
   de sesión ni datos locales.
6. La solicitud de recuperación siempre confirma de manera neutral para un
   correo sintácticamente válido y no revela existencia, rol ni estado.
7. La aplicación envía la solicitud a `/auth/password-recovery-requests`; el
   servicio backend de notificaciones entrega el correo cuando corresponda.
8. El token recibido por enlace seguro permite restablecer la contraseña una
   sola vez; éxito revoca las sesiones anteriores y vuelve al inicio de sesión.

    ## Referencias

    - RF-AUT-001
    - RF-AUT-002

    ## Seguridad y privacidad

    - Usar almacenamiento seguro.
- Rastrear solo durante jornada activa.

    ## Observabilidad

    - Propagar correlationId cuando aplique.
    - Registrar resultado y error sin datos sensibles.
    - Añadir métrica o evento operativo en flujos críticos.

    ## Evidencia mínima para DoF

    - Implementación asociada a la historia.
    - Pruebas y evidencia.
    - Matriz criterio → evidencia.
    - QA independiente.
    - Revisión de seguridad cuando aplique.
    - Contratos y documentación actualizados.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-003` — Autenticar usuario; `EN-013` — Definir autenticación, sesiones y recuperación
- **Historias consecuentes que habilita:** `INT-003` — Autenticación móvil completa; `INT-004` — Alta de vendedor disponible en mobile; `MOB-002` — Renovar y cerrar sesión; `MOB-003` — Solicitar permiso de ubicación; `MOB-027` — Proteger datos locales
- **Validación vertical:** `INT-003` — Autenticación móvil completa; `INT-004` — Alta de vendedor disponible en mobile

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** ADR de autenticación; OpenAPI `/auth/*`; enlace seguro de recuperación y manejo de sesión por cliente.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Identidad autenticada, tenant, rol `SELLER`, expiración, estado de sesión y token de acción de un uso; nunca contraseña o token en logs.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: rol no SELLER, sin datos, sin permiso, recurso
  inactivo, petición repetida o concurrente, dependencia degradada, enlace
  inválido o vencido y cambio de tenant o usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: fuga de credenciales, cache residual, sesión
  vencida, cruce de tenant, rechazo sin emisión de sesión para rol no SELLER y
  no enumeración en recuperación.

## Fuera de alcance

- registro público y almacenamiento inseguro de credenciales.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
