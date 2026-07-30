# BE-013 — Registrar cliente

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** crear un cliente geolocalizado  
    **Para** incluirlo en rutas

    ## Alcance

    Persistir datos y punto PostGIS.

    ## Criterios de aceptación

    1. Valida datos y coordenadas.
2. SRID correcto.
3. Advierte duplicados.
4. Queda disponible si activo.

    ## Referencias

    - RF-CLI-001
- RF-CLI-002
- HU-010

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

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera.
- **Predecesoras obligatorias:** `BE-062` — Gestionar zonas y territorios; `EN-014` — Definir proveedor de mapas, geocodificación y navegación
- **Historias consecuentes que habilita:** `BE-014` — Editar cliente y ubicación; `BE-015` — Detectar clientes duplicados; `BE-016` — Listar y filtrar clientes; `BE-018` — Generar plantilla de clientes; `BE-021` — Crear ruta manual; `BE-027` — Sugerir clientes por frecuencia; `BE-034` — Validar proximidad; `BE-060` — Asignar cartera de clientes; `FE-009` — Formulario de cliente y mapa; `INT-005` — Cliente visible en mapa
- **Validación vertical:** `INT-005` — Cliente visible en mapa

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/customers`; modelo PostGIS, filtros y asignación de cartera.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Cliente, dirección, punto PostGIS, estado, zona, vendedor responsable e historial de asignación.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: duplicados, coordenadas erróneas, asignación desactualizada y BOLA.

## Fuera de alcance

- CRM omnicanal, cobranzas y geocodificación aceptada sin confirmación.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
