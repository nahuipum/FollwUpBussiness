# BE-012 — Asignar territorios

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Workforce  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** asignar zonas  
    **Para** organizar cobertura

    ## Alcance

    Gestionar una o más zonas.

    ## Criterios de aceptación

    1. Zonas pertenecen a empresa.
2. Admite varias.
3. Filtros reflejan cambio.
4. Auditoría.

    ## Referencias

    - RF-VEN-005

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
- **Predecesoras obligatorias:** `BE-059` — Listar y consultar vendedores; `BE-062` — Gestionar zonas y territorios
- **Historias consecuentes que habilita:** `FE-006` — Formulario de vendedor
- **Validación vertical:** La validación se incorpora a la historia E2E de la épica y a la regresión `INT-032` cuando afecte el flujo crítico.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/sellers` y `/territories`; autorización por equipo.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Perfil vendedor, usuario de acceso, supervisor, zona/territorio, estado y vigencia.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: relaciones entre tenants, usuario/perfil desalineado y eliminación de historial.

## Fuera de alcance

- nómina, asistencia laboral y eliminación física de historial.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
