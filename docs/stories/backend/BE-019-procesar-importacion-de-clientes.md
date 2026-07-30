# BE-019 — Procesar importación de clientes

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Importaciones  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** importar CSV o Excel  
    **Para** evitar carga manual

    ## Alcance

    Proceso asíncrono con validación.

    ## Criterios de aceptación

    1. Valida tipo y estructura.
2. Errores por fila.
3. Detecta duplicados.
4. Resume insertados/rechazados.
5. Audita.

    ## Referencias

    - RF-CLI-004
- HU-011

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

- **Sprint objetivo:** Sprint 3 — Importación y configuración operativa.
- **Predecesoras obligatorias:** `BE-015` — Detectar clientes duplicados; `BE-018` — Generar plantilla de clientes; `BE-056` — Gestionar reintentos y DLQ
- **Historias consecuentes que habilita:** `BE-020` — Descargar errores de importación; `FE-012` — Carga de clientes; `FE-013` — Resultado de importación; `INT-006` — Importación completa de clientes; `INT-027` — Reintentos y DLQ E2E
- **Validación vertical:** `INT-006` — Importación completa de clientes; `INT-027` — Reintentos y DLQ E2E

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
