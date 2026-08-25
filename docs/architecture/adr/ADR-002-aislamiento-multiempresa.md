# ADR-002 — Aislamiento multiempresa
**Estado:** Aceptado

**Aceptación:** Luis Siancas — Owner, 2026-08-25. Se aprueba la estrategia
vigente sin cambios: base/esquema compartidos, `tenant_id` obligatorio y tenant
derivado de la sesión para persistencia, caché, WebSocket, mensajes,
exportaciones y logs.

Usar base y esquema compartidos con `tenant_id` obligatorio. El tenant se deriva de la sesión. Consultas, cache, WebSocket, mensajes, exportaciones y logs deben quedar segregados. Cada módulo tendrá pruebas de acceso cruzado.
