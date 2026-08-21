# FE-010 — Mapa de clientes

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor
    **Quiero** ver en un mapa los clientes dentro de mi alcance autorizado
    **Para** analizar la cobertura de la empresa o de mi equipo

    ## Alcance

    Mapa y lista alternativa. El administrador accede a los clientes de su
    empresa; el supervisor, únicamente a los clientes de las carteras vigentes
    de los vendedores que tiene asignados.

    ## Criterios de aceptación

    1. Marcadores diferenciados.
2. Filtros sincronizados entre mapa y lista, siempre dentro del alcance autorizado.
3. Lista accesible con el mismo alcance y resultados que el mapa.
4. Fallo del proveedor manejado sin perder la lista alternativa.
5. El administrador solo visualiza clientes de su tenant; el supervisor solo
   visualiza clientes de las carteras vigentes de sus vendedores asignados.
6. El alcance se aplica en Backend antes de filtros, conteo y paginación. Un
   supervisor sin vendedores o carteras autorizadas recibe un resultado vacío,
   sin ampliar su acceso.
7. Clientes, marcadores, identificadores y totales fuera del alcance no se
   revelan mediante la interfaz, la API, errores ni consultas directas.

    ## Referencias

    - RF-CLI-006

    ## Seguridad y privacidad

    - Derivar tenant, identidad, rol y equipo desde la sesión; no aceptarlos
      como autoridad desde filtros o parámetros del cliente.
- Aplicar autorización por tenant, equipo y cartera vigente en Backend antes de
  filtros, conteo y paginación.
- No usar ocultamiento visual como único control.
- Limpiar cache y estado al cerrar sesión o cambiar de empresa/usuario.

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
- **Predecesoras obligatorias:** `BE-016` — Listar y filtrar clientes; `EN-014` — Definir proveedor de mapas, geocodificación y navegación; `FE-008` — Listado y filtros de clientes
- **Historias consecuentes que habilita:** `INT-005` — Cliente visible en mapa
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
