# EN-016 — Definir privacidad, retención y rastreo

**Área:** Producto / Seguridad / Arquitectura
**Tipo:** Enabler funcional y técnico
**Épica:** Privacidad
**Prioridad:** Must Have
**Fase:** MVP

## Objetivo

Cerrar las decisiones de consentimiento, horario de rastreo, frecuencia,
precisión, retención, acceso y eliminación de ubicaciones antes de implementar
la jornada y el seguimiento.

## Criterios de aceptación

1. Se define política de rastreo exclusivamente durante jornada activa.
2. Se aprueban frecuencia, precisión mínima, antigüedad máxima y tratamiento de
   muestras inválidas.
3. Se define retención por tipo de ubicación y acceso por rol/equipo.
4. Se define el comportamiento ante permisos, GPS o batería desactivados.
5. Se documentan avisos al vendedor, auditoría, soporte y solicitudes de
   eliminación aplicables.
6. La decisión tiene responsables de Producto, Legal/Privacidad y Seguridad.

## Dependencias y desbloqueos

- Depende de las decisiones 7, 8 y 15 del contrato funcional.
- Desbloquea BE-028 a BE-034, BE-054, FE-020 a FE-022 y MOB-003, MOB-007 a
  MOB-011, MOB-026 y MOB-030.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 0 — Fundaciones y decisiones.
- **Predecesoras obligatorias:** No tiene sucesora directa; su cierre alimenta la regresión y el DoF del MVP.
- **Historias consecuentes que habilita:** `BE-028` — Iniciar jornada; `BE-029` — Recibir ubicaciones; `BE-032` — Consultar historial de recorrido; `BE-034` — Validar proximidad; `BE-054` — Configurar geocerca y tracking; `FE-020` — Mapa en tiempo real; `FE-022` — Historial de recorrido; `INT-031` — Retención y eliminación lógica E2E; `MOB-003` — Solicitar permiso de ubicación; `MOB-026` — Mostrar indicador de rastreo; `MOB-030` — Manejar batería y servicios desactivados
- **Validación vertical:** `INT-031` — Retención y eliminación lógica E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** Política de tracking/retención y ADR de almacenamiento local.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Datos locales cifrados, tenant/usuario propietario, retención y estado de tracking.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: rastreo fuera de jornada, cache local residual y retención excesiva.

## Fuera de alcance

- rastreo fuera de jornada y conservación indefinida.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
