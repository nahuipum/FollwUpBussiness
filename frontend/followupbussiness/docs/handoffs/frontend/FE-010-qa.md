# FE-010 — QA independiente

**Estado:** `PASS`  
**Candidate-ID:** `HEAD e7beb3e + 45 rutas modificadas (475+/113-) y 13 no seguidas; árbol concurrente preservado`.

## Mapeo y evidencia

- Backend: tenant/equipo/cartera se resuelven antes de filtros, conteo y paginación; Admin queda tenant-acotado, Supervisor usa vendedores activos de su equipo, sin cartera queda vacío; `sellerId` ajeno y Plataforma se deniegan. Reasignación/equipo se resuelven en cada lectura. `clean verify` correcto para el candidato.
- Frontend: Admin/Supervisor acceden a sus rutas/submenús; Seller/Plataforma no. Mapa/lista usan `GET /customers`, preservan vacío, forbidden, fallback, limpieza de contexto, accesibilidad y minimización. Prueba inicial: 47 correctas.
- Revalidación: se eliminó búsqueda local desincronizada; una prueba confirma que marcador y fila cambian juntos. `lastUpdated` y aviso de datos posiblemente no vigentes están visibles y cubiertos (2 pruebas correctas).

## Corrección aplicada

QA inicial detectó filtro local y falta de fecha de actualización. Desarrollo los corrigió una vez; revalidación focal `PASS`. No se modificaron contratos, proveedores ni producción Backend.

`git diff --check` correcto. Riesgo residual: atribución efectiva y tiles reales requieren comprobación preproductiva; el fallback está cubierto.
