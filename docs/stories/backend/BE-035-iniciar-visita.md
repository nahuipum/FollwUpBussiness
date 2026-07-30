# BE-035 — Iniciar visita

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** iniciar visita  
    **Para** registrar atención

    ## Alcance

    Crear visita idempotente.

    ## Criterios de aceptación

    1. Jornada activa.
2. Una visita activa.
3. Guarda coordenadas y distancia.
4. Reintento no duplica.

    ## Referencias

    - RF-VIS-002
- RF-VIS-003
- RF-VIS-004
- HU-040

    ## Seguridad y privacidad

    - Validar tenant y autorización por recurso.
- No registrar secretos ni datos personales completos.

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

- **Sprint objetivo:** Sprint 7 — Visitas y ejecución de ruta.
- **Predecesoras obligatorias:** `BE-024` — Publicar ruta; `BE-034` — Validar proximidad; `BE-055` — Implementar outbox transaccional
- **Historias consecuentes que habilita:** `BE-036` — Finalizar visita; `BE-037` — Registrar visita fuera de ruta; `BE-038` — Autorizar excepción de geocerca; `BE-040` — Consultar visitas y pendientes; `INT-013` — Check-in por geocerca E2E; `INT-015` — Visita offline sincronizada; `MOB-013` — Iniciar visita online; `MOB-014` — Iniciar visita offline
- **Validación vertical:** `INT-013` — Check-in por geocerca E2E; `INT-015` — Visita offline sincronizada

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/visits`; eventos `visit.*`; comandos sync `visit.*`.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Visita, jornada, ruta/cliente, inicio/cierre, coordenadas, resultado, excepción y duración.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: duplicados, visita simultánea, fraude de ubicación y pérdida offline.

## Fuera de alcance

- borrar historial o convertir automáticamente toda visita en venta.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
