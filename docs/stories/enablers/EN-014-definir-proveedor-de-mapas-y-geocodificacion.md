# EN-014 — Definir proveedor de mapas, geocodificación y navegación

**Área:** Arquitectura
**Tipo:** Enabler técnico
**Épica:** Geolocalización
**Prioridad:** Must Have
**Fase:** MVP

## Objetivo

Seleccionar mediante ADR el proveedor o combinación de proveedores para mapas,
geocodificación y apertura de navegación, con costos, cuotas, privacidad,
restricciones de licencia y estrategia de degradación.

## Criterios de aceptación

1. Se documentan volumen esperado, cuotas, costo estimado y límites operativos.
2. Se define qué datos se envían al proveedor y cómo se protege la información
   multiempresa.
3. Se define el comportamiento sin proveedor, sin clave, sin red o con cuota
   agotada.
4. Se separan mapa, geocodificación y navegación para evitar dependencias
   implícitas.
5. La decisión incluye pruebas, observabilidad, rotación de claves y rollback.

## Dependencias y desbloqueos

- Depende de EN-005 y de la estimación de vendedores/empresas del piloto.
- Desbloquea BE-013, BE-015, FE-009, FE-010, FE-016, FE-020, FE-022 y MOB-006.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 0 — Fundaciones y decisiones.
- **Predecesoras obligatorias:** `EN-005` — Configurar Docker Compose con PostGIS, Redis y RabbitMQ
- **Historias consecuentes que habilita:** `BE-013` — Registrar cliente; `BE-015` — Detectar clientes duplicados; `EN-018` — Definir motor de rutas y límites del MVP; `FE-009` — Formulario de cliente y mapa; `FE-010` — Mapa de clientes; `FE-019` — Comparar ruta planificada y ejecutada; `FE-020` — Mapa en tiempo real; `FE-022` — Historial de recorrido; `MOB-006` — Abrir navegación al cliente
- **Validación vertical:** La validación se incorpora a la historia E2E de la épica y a la regresión `INT-032` cuando afecte el flujo crítico.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** ADR de mapas/geocodificación/navegación y política de datos.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Identificadores, tenant/propietario, estado, timestamps de negocio y auditoría aplicables.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: permisos, aislamiento multiempresa, concurrencia, recuperación y observabilidad.

## Fuera de alcance

- capacidades no descritas en el alcance y cambios de arquitectura sin ADR.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
