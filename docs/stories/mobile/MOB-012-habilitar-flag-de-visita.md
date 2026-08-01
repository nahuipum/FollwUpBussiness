# MOB-012 — Habilitar flag de visita

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Geocerca  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** habilitar botón dentro de geocerca  
    **Para** registrar visita

    ## Alcance

    Estado derivado de jornada y GPS.

    ## Criterios de aceptación

    1. Fuera deshabilitado.
2. Dentro habilitable.
3. Ubicación inválida deshabilita.
4. Evita doble toque.

    ## Referencias

    - RF-VIS-002
- HU-040

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

- **Sprint objetivo:** Sprint 7 — Visitas y ejecución de ruta.
- **Predecesoras obligatorias:** `MOB-011` — Calcular proximidad local
- **Historias consecuentes que habilita:** `INT-013` — Check-in por geocerca E2E; `MOB-013` — Iniciar visita online; `MOB-014` — Iniciar visita offline; `MOB-018` — Registrar visita fuera de ruta
- **Validación vertical:** `INT-013` — Check-in por geocerca E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI de proximidad/visitas y contrato de configuración de geocerca.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Cliente, ubicación del dispositivo, precisión, antigüedad, radio y distancia calculada.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: GPS impreciso o falso, configuración obsoleta y diferencia cliente-servidor.

## Fuera de alcance

- confiar solo en el cálculo del cliente y ocultar excepciones.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
