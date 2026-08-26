# ADR-023 — Snapshot de planificación para rutas manuales

- **Estado:** Aceptado
- **Fecha:** 2026-08-25
- **Historia:** EN-022
- **Propietario:** `routing`

## Contexto

Una edición de orden necesita estimaciones reproducibles sin consultar un proveedor durante la edición. `POST /routes` admitía hasta 500 clientes, mientras ADR-014 solo cubre una matriz de 11 nodos. El límite no es compatible con una matriz completa de planificación bajo el presupuesto MVP.

## Decisión

- Una ruta manual admite como máximo **50 puntos**. El snapshot contiene una matriz dirigida completa de hasta **52 nodos**: inicio, puntos y fin.
- PostgreSQL/PostGIS es la única autoridad del snapshot. Redis puede cachear resultados no autoritativos y siempre incluye tenant; no conserva ni decide validez de snapshots.
- La captura usa el proveedor Matrix estático y el perfil de ADR-014, en lotes limitados por su contrato. Un snapshot máximo requiere 2,652 pares dirigidos entre nodos distintos; el consumo efectivo, latencia y precio se miden por ambiente y se incorporan al pricing por uso de producción. Pruebas locales usan matrices sintéticas.
- La ruta puede quedar `DRAFT` sin snapshot si no se logra capturarlo. No tiene estimaciones confirmadas y no se puede reordenar hasta una regeneración autorizada. No hay aproximación, duración cero, tráfico ni fallback.
- El snapshot es válido hasta terminar la fecha operativa en su zona IANA, salvo invalidación inmediata por cambio de sus entradas autorizadas. Se purga físicamente, incluidas copias, a los 30 días de quedar vencido, reemplazado o invalidado. Auditoría conserva 365 días solo metadatos saneados.
- Un proveedor/matriz autogestionado no forma parte del MVP. Es una evolución condicionada a clientes consolidados, capacidad y una ADR sucesora.

## Consecuencias

`BE-023` y `BE-064` solo pueden confirmar una modificación si existe un snapshot vigente, completo, del mismo tenant/ruta/versión. El contrato baja el límite de creación a 50 y declara estados de snapshot como conflictos neutrales. Un reordenamiento exitoso crea atómicamente una nueva revisión `VALID` ligada a la nueva versión de ruta, con el mismo contenido inmutable y sin proveedor; la revisión anterior queda `SUPERSEDED`. La materialización futura requiere migraciones forward-only y puertos públicos para obtener datos de `customers`, `workforce`, `journeys` y `tenancy`; ninguno consulta tablas ajenas.

## Alternativas descartadas

1. Mantener 500 puntos: una matriz completa excede de forma desproporcionada la cuota/coste y latencia MVP.
2. Matriz dispersa o estimación lineal: no cubre una permutación arbitraria y fabricaría estimaciones.
3. Infraestructura de matriz autogestionada ahora: añade operación, seguridad y coste incompatibles con el MVP.
