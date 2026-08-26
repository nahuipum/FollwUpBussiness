# EN-022 — Definir snapshot de planificación y estimaciones de ruta

**Área:** Arquitectura / Backend / Producto  
**Tipo:** Enabler funcional y técnico  
**Prioridad:** Must Have  
**Fase:** MVP

## Objetivo

Cerrar y materializar la fuente de verdad que permite recalcular estimaciones
de una ruta al reordenarla, sin inventar distancias, duraciones, jornadas ni
ventanas, y sin consumir un proveedor ni aplicar un fallback silencioso durante
la edición.

## Alcance

- Definir el snapshot durable, versionado y tenant-scoped de planificación:
  ruta y versión base, perfil, zona horaria, inicio, puntos, matriz o
  representación equivalente de desplazamientos, duración de servicio,
  ventanas y jornada autorizadas.
- Determinar la fuente pública y autorizada de cada dato, incluido el caso de
  rutas manuales creadas por `BE-021`; ningún módulo consulta tablas internas
  de otro dominio.
- Resolver explícitamente la capacidad de rutas de hasta 50 puntos frente a
  los límites de matriz de EN-018, presupuesto, latencia y almacenamiento. El
  contrato debe declarar el máximo realmente soportado y el comportamiento
  para una ruta que no pueda obtener snapshot; no admite límite implícito.
- Definir cuándo se crea, invalida y reemplaza el snapshot, su relación con
  `Route.version` y cómo una edición humana recalcula llegada/salida desde el
  mismo snapshot sin llamar a un proveedor externo.
- Definir persistencia, índices, retención y acceso de mínimo privilegio para
  datos geográficos; PostgreSQL es la fuente de verdad y Redis no conserva el
  snapshot autoritativo.
- Establecer puerto hexagonal de recálculo, errores REST verificables,
  transacción con orden/estimaciones/versión y matriz de pruebas.

## Criterios de aceptación

1. Cada campo de entrada de ETA tiene fuente, propietario, unidad, zona
   horaria y semántica pública; duración cero, distancia lineal inferida,
   tráfico y valores por defecto no son admisibles.
2. El diseño demuestra cómo cubre la capacidad aprobada de rutas manuales,
   incluido el máximo de 50 puntos aprobado, o actualiza explícitamente los
   contratos y dependencias antes de usar un límite menor.
3. El snapshot queda ligado a tenant, ruta y versión base; una lectura o
   reutilización cross-tenant, obsoleta o incompleta es imposible o se
   rechaza antes de modificar la ruta.
4. Reordenar usa exclusivamente el snapshot válido, recalcula estimaciones de
   forma determinista y no reserva cuota ni invoca el proveedor de matriz.
5. Ausencia, invalidez, caducidad o fallo de acceso al snapshot tiene error
   público, neutral y documentado; no confirma orden, estimación o versión
   parcial.
6. La solución conserva dominio puro, puertos explícitos y migraciones
   forward-only; cualquier cambio de modelo, persistencia o contrato queda
   respaldado por ADR y OpenAPI antes de las historias consumidoras.
7. Pruebas cubren cálculo determinista, límites de capacidad, rollback,
   concurrencia, tenant A→B/B→A y ausencia de coordenadas/datos sensibles en
   logs, métricas, auditoría y errores.

## Fuera de alcance

- Proveedor nuevo, tráfico en tiempo real, optimización automática,
  navegación, publicación de ruta, notificaciones y modificación local Mobile.
- Relajar el límite de EN-018 o cambiar el máximo de puntos sin evidencia de
  capacidad, coste y aprobación de contrato.

## Referencias

- EN-018 — Motor de rutas y límites del MVP.
- BE-021 — Crear ruta manual.
- BE-023 — Reordenar puntos de ruta.
- BE-064 — Editar ruta publicada antes de iniciar jornada.

## Seguridad y privacidad

- Tenant y actor se derivan de sesión en cada puerto; snapshots, caché y claves
  incluyen el tenant y nunca aceptan su sustitución desde la entrada.
- Matriz, coordenadas, direcciones, clientes, tokens y payloads completos no se
  exponen ni se registran; la observabilidad usa solo resultado, latencia,
  conteos y `CorrelationId`.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 4 — Planificación y entrega de rutas, antes de BE-023.
- **Predecesoras obligatorias:** `EN-018` — Definir motor de rutas y límites del MVP; `BE-021` — Crear ruta manual.
- **Historias consecuentes que habilita:** `BE-023` — Reordenar puntos de ruta; `BE-064` — Editar ruta publicada antes de iniciar jornada.
- **Validación vertical:** ampliar `INT-007` con creación de snapshot, reordenamiento determinista y degradación segura.

## Puerta de Ready para las historias desbloqueadas

- ADR, OpenAPI, modelo de persistencia y puertos de snapshot/recálculo aprobados.
- El límite de capacidad, coste y disponibilidad está evidenciado y no contradice las rutas manuales admitidas.
- Pruebas de cálculo, concurrencia, aislamiento tenant y fallo transaccional aprobadas; no quedan reglas de ETA abiertas.
<!-- delivery-traceability:end -->
