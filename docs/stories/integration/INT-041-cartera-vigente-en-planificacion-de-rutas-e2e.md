# INT-041 — Cartera vigente consumida en planificación de rutas E2E

**Área:** Integración  
**Tipo:** Historia de integración E2E  
**Épica:** Rutas  
**Prioridad:** Must Have  
**Fase:** MVP  

## Historia

**Como** vendedor autorizado  
**Quiero** recibir en mi ruta únicamente clientes de mi cartera vigente  
**Para** planificar y ejecutar recorridos sin mezclar clientes ni empresas

## Alcance

Validar el consumo de la cartera materializada por `BE-060` en creación,
sugerencia y consulta de rutas, incluidos panel y mobile cuando dichas
superficies estén implementadas.

## Criterios de aceptación

1. La creación, sugerencia y consulta de rutas usan la cartera vigente en la
   fecha operativa, sin depender de filtros o caché del cliente.
2. `SELLER` recibe solo clientes de su cartera vigente; `SUPERVISOR` consulta
   únicamente rutas y cartera de su equipo; ningún actor infiere otro tenant.
3. Una reasignación posterior no altera los puntos, responsable ni resultados
   históricos de rutas ya publicadas o ejecutadas.
4. Cartera futura, cliente/vendedor inactivo, BOLA por ID, replay y conflicto
   concurrente se rechazan o resuelven según contrato sin escrituras parciales.
5. Panel y mobile muestran carga, vacío, error, acceso denegado y dato
   desactualizado; limpian el estado local al logout o cambio de empresa.

## Dependencias

- `INT-034`, `BE-021`, `BE-022`, `BE-061`, `FE-014`, `FE-015`, `MOB-004` y
  `MOB-029`.

## Seguridad y privacidad

- Validar actor, tenant, cartera vigente y alcance de equipo en cada puerto y
  endpoint de rutas alcanzable.
- No registrar direcciones completas, coordenadas, tokens ni payloads de ruta
  sensibles.

## Evidencia mínima para DoF

- Flujo Admin: asignar cartera → crear/sugerir/publicar ruta → vendedor la
  consulta en la fecha operativa.
- Pruebas tenant/BOLA, cambio de vigencia, reasignación histórica, replay y
  concurrencia.
- QA independiente y revisión de seguridad sin hallazgos Critical o High.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 4 — Planificación y entrega de rutas.
- **Predecesoras obligatorias:** `INT-034`, `BE-021`, `BE-022`, `BE-061`, `FE-014`, `FE-015`, `MOB-004` y `MOB-029`.
- **Historias consecuentes que habilita:** `INT-013`, `INT-014`, `INT-039`.
- **Validación vertical:** Cierra la unión entre cartera vigente y rutas antes de validar ejecución en campo.

## Fuera de alcance

- Optimización avanzada, tráfico en tiempo real y geocodificación externa.
<!-- delivery-traceability:end -->
