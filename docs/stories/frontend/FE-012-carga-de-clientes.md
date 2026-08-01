# FE-012 — Carga de clientes

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Importaciones  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** importar archivo  
    **Para** acelerar configuración

    ## Alcance

    Flujo de upload.

    ## Criterios de aceptación

    1. Plantilla descargable.
2. Valida extensión/tamaño.
3. Progreso.
4. Evita doble envío.

    ## Referencias

    - RF-CLI-004

    ## Seguridad y privacidad

    - No usar ocultamiento visual como único control.
- Limpiar cache y estado al cerrar sesión.

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

- **Sprint objetivo:** Sprint 3 — Importación y configuración operativa.
- **Predecesoras obligatorias:** `BE-018` — Generar plantilla de clientes; `BE-019` — Procesar importación de clientes; `FE-008` — Listado y filtros de clientes
- **Historias consecuentes que habilita:** `FE-013` — Resultado de importación; `INT-006` — Importación completa de clientes
- **Validación vertical:** `INT-006` — Importación completa de clientes

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/customers/imports`; eventos de importación y archivo de errores.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Trabajo de importación, versión de plantilla, archivo, fila, validación, resultado y archivo de errores.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: archivo malicioso, fórmula CSV, carga parcial y reintento duplicado.

## Fuera de alcance

- ejecutar macros, aceptar archivos sin límites y ocultar rechazos parciales.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
