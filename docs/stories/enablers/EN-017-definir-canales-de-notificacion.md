# EN-017 — Definir canales de notificación

**Área:** Arquitectura / Producto
**Tipo:** Enabler técnico
**Épica:** Notificaciones
**Prioridad:** Must Have
**Fase:** MVP

## Objetivo

Definir los canales y proveedores para activación/recuperación de cuenta y para
avisos de ruta al dispositivo móvil.

## Criterios de aceptación

1. Se separan notificaciones transaccionales de identidad y push operativo.
2. Se define registro/rotación de dispositivos y revocación al cerrar sesión.
3. Los mensajes en pantalla bloqueada no exponen datos sensibles.
4. Se definen reintentos, caducidad, deduplicación, métricas y fallback.
5. Secretos, costos, cuotas y ambientes quedan documentados mediante ADR o
   configuración aprobada.

## Dependencias y desbloqueos

- Depende de EN-013 para identidad y EN-015 para el comportamiento mobile.
- Desbloquea BE-006, BE-053, MOB-029 e INT-009.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 0 — Fundaciones y decisiones.
- **Predecesoras obligatorias:** `EN-013` — Definir autenticación, sesiones y recuperación; `EN-015` — Definir persistencia local y sincronización móvil
- **Historias consecuentes que habilita:** `BE-006` — Recuperar contraseña; `BE-053` — Notificar ruta publicada o modificada; `FE-002` — Recuperación de contraseña; `MOB-029` — Recibir ruta asignada o modificada
- **Validación vertical:** La validación se incorpora a la historia E2E de la épica y a la regresión `INT-032` cuando afecte el flujo crítico.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** Eventos `route.*`, contrato de dispositivo y proveedor de notificaciones.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Evento, destinatario, dispositivo/canal, caducidad, intento y resultado de entrega.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: duplicados, dispositivo antiguo y exposición en pantalla bloqueada.

## Fuera de alcance

- usar push como fuente de verdad o mostrar datos sensibles bloqueado.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
