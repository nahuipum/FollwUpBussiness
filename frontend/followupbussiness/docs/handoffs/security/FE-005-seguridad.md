# FE-005 — Revisión de Seguridad

Estado: `PASS`  
Candidate-ID: `f712293 + 3E5D437F6C9B`

## Superficie revisada

Cierre del hallazgo previo: reemplazo de sesión, empresa e identidad/roles; revocación del detalle y estado en memoria con PII de vendedores. Se mantuvieron como evidencia del mismo candidato los controles ya revisados de guardias, `403`, filtros y acotamiento Backend por tenant/equipo.

## Resultado

- `PASS` — Hallazgo **Alta** cerrado. `sellerSessionKey` incorpora generación de sesión, usuario, empresa mediante `company.id` cuando existe y roles; `useSellers` invalida solicitudes, resultado, filtros y marca temporal. `CompanySellersPage` escucha el mismo cambio y cierra `detail`.
- Reproducción focalizada ejecutada: abrir el detalle del tenant A, reemplazar la sesión por B y cargar su listado. `npm test -- src/app/App.test.tsx -t "revoca el detalle del tenant anterior al reemplazar la sesión"` pasó (1/1): desaparecieron correo, nombre y código de A; no quedó diálogo con PII anterior y se mostró el vendedor B.
- `PASS` — No se incorporó persistencia de vendedores en `localStorage`, `sessionStorage`, IndexedDB o cache; tampoco llamadas de log/console en `company-sellers`. La PII permanece únicamente en estado React efímero y se revoca con el evento de sesión.

## Controles no aplicables y riesgo residual

`NOT_EXECUTED` por no aplicar al delta: WebSocket, Redis/cache persistente, mensajería, archivos, secretos, dependencias e infraestructura.

Riesgo residual aceptado: la UI reduce exposición local, pero Backend continúa siendo la autoridad para autorización y aislamiento por tenant/equipo. Cualquier futuro dato sensible fuera de `useSellers` deberá suscribirse a la misma revocación de sesión.
