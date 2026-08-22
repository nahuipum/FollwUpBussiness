# INT-034 — Paquete de contexto

**Estado:** PASS
**Candidate-ID:** `11c3909+8a9504501289`

## Decisiones e invariantes

- La asignación futura queda programada: no integra la cartera vigente, filtros, detalle ni rutas antes de `effectiveFrom`.
- Solo `COMPANY_ADMIN` asigna, reasigna o retira; Backend deriva actor y tenant. `SUPERVISOR` solo consulta su equipo y `SELLER` solo su cartera vigente.
- Cada lectura y escritura debe limitar tenant, recurso y alcance antes de revelar existencia. Rechazos no escriben ni auditan una transición exitosa.
- La transición individual debe ser atómica y concurrente devuelve conflicto; el lote conserva idempotencia por tenant y clave.
- Visitas, ventas y rutas anteriores conservan sus referencias históricas; la cartera cambia solo hacia adelante.

## Diagnóstico y alcance aprobado

Se corrigen: mapeos REST incompatibles de asignación individual/lote, revisión/conflicto de cartera, vigencia temporal, historial expuesto con autorización, consumo de cartera vigente en rutas, límite UI de 1000 y estado desactualizado. No se impone cobertura vendedor-territorio: no existe regla contractual que la defina.

## Superficies y evidencia

- Contrato: `../../docs/api/openapi.yaml` (`/customers`, asignación, historial, rutas).
- Backend: módulo `customers`, persistencia PostGIS de `customer`/`customer_portfolio`, `routing` y `audit`.
- Frontend: `src/features/company-customer-assignments`, clientes, vendedores y territorios.
- Mobile no consume directamente la cartera; su superficie es `GET /routes/my-route`.

## Verificación exigida

Pruebas focalizadas de contratos, tenant/BOLA, inactivo, futuro, duplicado, idempotencia, concurrencia, historial y ruta; validación CI-equivalente Backend por persistencia/transacciones/contrato, y validación Frontend tras su modificación. Seguridad obligatoria por tenant, autorización, ubicación e historial.

## Resultado de Development

Frontend listo: límite de 1000, mensajes accesibles de actualización y defensa API; pruebas focalizadas, typecheck y build correctos. Backend listo para la superficie existente: DTOs REST contractuales, idempotencia, bloqueo por cliente, `409`, y lectura de cartera vigente con prueba PostgreSQL; pruebas focalizadas y `clean verify` correctos. Tras QA se corrigió la programación futura: la cartera actual permanece vigente hasta `effectiveFrom`; la nueva comienza en esa fecha mediante intervalo `effective_to`.

Frontend añadió la recarga al cambiar sesión/empresa: limpia estado previo y consulta opciones de la nueva sesión; prueba focalizada y `npm run typecheck` correctos.

## Decisiones y dependencias resueltas

- **Vigencia futura MVP:** una primera programación futura es válida; otra pendiente para el mismo cliente devuelve `409 Conflict` antes de escribir, registrar historial o auditar éxito. Evita solapes y preserva una única proyección pendiente sin inventar reemplazo automático.
- **Rutas:** su consumidor E2E se difiere a `INT-041` en Sprint 4. INT-034 valida productor de cartera, filtros/detalle, tenant, auditoría e historial persistido; no afirma validar rutas inexistentes.

**Aclaración de alcance:** `/customers/{customerId}/history` corresponde a `BE-017`, `FE-011` e `INT-020`; el historial de cartera se persiste, pero aún no hay API para consultarlo. Mobile no consume directamente cartera ni rutas. QA y Seguridad deben comprobar la candidata; DoF solo procede si ambas fases pasan.
