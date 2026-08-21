# FE-036 — Revisión de Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `e7beb3e+ab9c84d218f4`

## Superficie y abuso

Se revisaron ruta/navegación administrativa, asignación individual y masiva, IDs de cliente/vendedor/territorio, sesión/empresa, resultados parciales e idempotencia. Amenaza: BOLA/IDOR o divulgación de cartera al cambiar de tenant con una asignación preparada o en vuelo.

Durante un `PUT` pendiente se sustituyó `admin-a/tenant-a` por `admin-b/tenant-b`; la prueba focalizada pasó. La respuesta obsoleta no publicó resultados ni errores, no recargó datos y la limpieza descartó clientes, vendedores, territorios, selección y resultados previos. `COMPANY_ADMIN` es el único acceso UI; los IDs proceden de opciones Backend y no incluyen `tenantId`.

Los resultados parciales muestran solo estado y mensaje genérico, sin IDs ni `errorCode`; no hay persistencia/caché de esta feature ni consola/telemetría. La clave se conserva por intención, el doble envío se bloquea y los resultados reemplazan el estado visual.

## Hallazgos y riesgo residual

Sin hallazgos. La autorización tenant y el rechazo de IDs ajenos permanecen bajo autoridad Backend; las respuestas reales 403/404/409/422/red no se ejecutaron en esta fase y QA cubre sus estados simulados.
