# Revisión de Seguridad — INT-005

**Estado:** `PASS`  
**Candidate-ID:** `HEAD d87b9be + diff 9a24366a7167c41067fab935aad6b331bedb185e`.

- BOLA/tenant: lectura masiva parametrizada y tenant-scoped sobre clientes ya autorizados; prueba cross-tenant `PASS`.
- Roles: no cambian los scopes de admin, supervisor o seller; el frontend mantiene rutas/UI y el backend conserva la autoridad.
- Ubicación/privacidad: no hay coordenadas textuales, contacto, persistencia local ni logs nuevos. Marcadores usan geometría solo para actores autorizados.
- Geoapify: no se modifican clave, configuración, proveedor ni dependencias; no se revelan secretos.

Riesgo residual bajo: la geometría exacta llega al navegador autorizado para dibujar el mapa; las restricciones de origen/cuota de la clave son control operativo externo. No se ejecutó HTTP E2E ni validación externa de cuota, sin impacto decisivo en este candidato.
