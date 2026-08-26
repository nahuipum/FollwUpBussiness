# BE-026 — Paquete de contexto

- Fase actual: Security `PASS` tras cierre de SEC-BE026-01.
- Candidate-ID: `HEAD 9aae01d + 4fef2ff15cc3`.
- Alcance solicitado: `POST /routes/{routeId}/copy` crea una ruta independiente
  en `DRAFT` para otra fecha y vendedor, sin modificar/publicar la fuente ni
  copiar ejecución histórica.

## Decisiones de producto aprobadas

1. **Autorización aprobada.** `COMPANY_ADMIN` puede copiar cualquier ruta de
   su tenant hacia un vendedor activo del mismo tenant. `SUPERVISOR` puede
   hacerlo únicamente si vendedor fuente y vendedor destino pertenecen a su
   equipo vigente. `SELLER` queda denegado. Esta decisión concilia el contrato
   funcional con los roles de OpenAPI; requiere dejar explícito el alcance en
   el contrato antes del handoff.
2. **Resultado.** El `201` será aditivo: `CopyRouteResponse { route,
   warnings[] }`. Cada warning contiene exclusivamente `code`, `resourceType`
   y `sourcePointId` opcional; no nombres, direcciones ni coordenadas. Códigos:
   `SOURCE_SELLER_INACTIVE`, `CUSTOMER_INACTIVE`,
   `CUSTOMER_OUTSIDE_TARGET_PORTFOLIO`, `TERRITORY_NOT_EFFECTIVE` y
   `POINT_NOT_COPIED`.
3. **Rechazo o copia parcial.** Vendedor destino inexistente/no activo, fecha
   inválida o fuera de alcance: rechazo sin escritura. Vendedor fuente
   inactivo: la copia procede y advierte. Cliente inactivo, fuera de la cartera
   vigente del destino o territorio no vigente: se omite ese punto y se emite
   warning. Si todos los puntos quedan omitidos, se crea igualmente el borrador
   vacío con warnings para que el actor lo complete explícitamente.
4. **Contenido.** La fecha destino debe ser distinta de la fuente y no puede
   ser pasada. `name` toma el valor solicitado; si falta, conserva el de la
   fuente. Se copian ubicación de inicio y referencias/ubicaciones de los
   puntos elegibles; sus identificadores se regeneran, se renumeran y quedan
   `PENDING`. No se copian `plannedArrivalAt` ni estimaciones dependientes de
   la fecha. La ruta inicia `DRAFT`, versión `1`, sin `publishedAt`.

## Invariantes preparados

- Éxito: nueva identidad, fecha y vendedor válidos; `DRAFT`, versión inicial,
  puntos nuevos e independientes.
- Fuente: sin mutar ruta, puntos, historial, visitas, ventas, estado ni versión.
- Denegación: actor/recurso fuera de tenant o equipo no genera escritura ni
  revelación adicional.
- Conflicto: la misma clave idempotente y comando no crea otro borrador;
  reutilización incompatible devuelve `409` sin mutación.
- Rollback/observabilidad: ruta, puntos y auditoría transaccionales; solo
  `correlationId`, resultado técnico y métricas sin PII ni payloads.

Tras estas decisiones, Development usará los puertos de autorización,
vendedores, cartera/territorios, persistencia, idempotencia y auditoría bajo la
arquitectura hexagonal. Las verificaciones Maven incluirán
`-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository`.

## Delta Development

- Se incorporó el caso de uso `CopyRouteUseCase` con transacción serializable,
  autorización por ruta y ambos vendedores, idempotencia `COPY`, auditoría sin
  PII y puntos independientes `PENDING`; el borrador puede quedar vacío.
- OpenAPI responde `CopyRouteResponse { route, warnings }`, sin detalles de
  cliente/ubicación en warnings. No se requirió migración: `route_idempotency`
  ya segmenta por `operation`.

## Delta QA

- PASS revalidado para `HEAD 9aae01d + 4fef2ff15cc3`: supervisor fuera de
  alcance recibe el mismo `403` con fecha fuente igual o distinta, sin reserva,
  escritura ni auditoría de éxito. `CopyRouteServiceTest` PASS.
- Sin hallazgos reproducibles; persiste riesgo bajo por cobertura automatizada
  de replay idempotente y rollback de auditoría.

## Delta Development — SEC-BE026-01

- Se autorizan ruta y vendedores antes de comparar la fecha con la fuente.
  Un supervisor fuera de alcance recibe siempre `403`, incluso cuando adivina
  la fecha, sin reserva, escritura ni auditoría de éxito.
- La prueba negativa compara fecha igual y distinta contra una ruta fuera de
  equipo y verifica los efectos prohibidos.

## Delta Security

`SEC-BE026-01` cerrado: la autorización precede cualquier validación dependiente
de la ruta fuente; el abuso decisivo con fechas igual y distinta devuelve `403`
sin reserva, persistencia ni auditoría de éxito.
