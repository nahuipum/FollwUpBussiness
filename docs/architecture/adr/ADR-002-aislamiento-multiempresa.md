# ADR-002 — Aislamiento multiempresa
**Estado:** Propuesto

Usar base y esquema compartidos con `tenant_id` obligatorio. El tenant se deriva de la sesión. Consultas, cache, WebSocket, mensajes, exportaciones y logs deben quedar segregados. Cada módulo tendrá pruebas de acceso cruzado.
