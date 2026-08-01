# MOB-004 — Descargar ruta del día

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Ruta  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** descargar mi ruta  
    **Para** trabajar sin internet

    ## Alcance

    Sincronizar ruta y clientes.

    ## Criterios de aceptación

    1. Disponible offline.
2. Última sincronización.
3. No mezcla usuarios.
4. Actualiza cambios.

    ## Referencias

    - RF-RUT-007
- RF-UBI-001

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

- **Sprint objetivo:** Sprint 4 — Planificación y entrega de rutas.
- **Predecesoras obligatorias:** `BE-061` — Consultar rutas y ruta del día; `EN-015` — Definir persistencia local y sincronización móvil; `MOB-002` — Renovar y cerrar sesión; `MOB-027` — Proteger datos locales
- **Historias consecuentes que habilita:** `INT-007` — Creación manual E2E; `MOB-005` — Ver clientes pendientes y visitados; `MOB-007` — Iniciar jornada; `MOB-029` — Recibir ruta asignada o modificada
- **Validación vertical:** `INT-007` — Creación manual E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/routes`; eventos `route.*`; versión de ruta para mobile.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Ruta publicada, versión local, clientes ordenados y estado de ejecución.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: copia local obsoleta, fecha operativa incorrecta y datos ajenos.

## Fuera de alcance

- navegación embebida giro a giro y modificación local de una ruta publicada.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
