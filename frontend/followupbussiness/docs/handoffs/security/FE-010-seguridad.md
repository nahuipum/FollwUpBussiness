# FE-010 — Revisión final de Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `HEAD e7beb3e + 45 rutas modificadas (475+/113-) y 13 no seguidas; árbol concurrente preservado`.

## Superficie y abuso

Se revisaron tenant, equipo/cartera vigente, BOLA por `sellerId`, roles, ubicación/PII, estado de sesión y MapLibre/Geoapify. Backend deriva tenant/rol/supervisor/vendedores desde sesión y acota lista/conteo antes de paginar; Supervisor sin cartera queda vacío y Plataforma se deniega.

**PASS — abuso decisivo:** cambio de contexto tenant con mapa abierto. `npm test -- --run … -t "descarta los clientes del contexto anterior al reemplazar la sesión en el mapa"` — 1 correcta. Requests, lista, marcadores y selección previos desaparecen; no reaparecen respuestas tardías.

No se detectó persistencia/caché local nueva, logs o errores con PII/coordenadas; sin geocodificación, proveedor, clave o dependencia nuevos. Fallback accesible y atribución se preservan.

**No aplicables:** WebSocket, Redis, mensajería, archivos, pagos e infraestructura. Riesgo residual no bloqueante: comprobar en preproducción tiles, atribución efectiva y restricciones por origen/ambiente de la clave Geoapify.
