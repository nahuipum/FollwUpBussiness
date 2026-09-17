# FE-013 — Revisión de Seguridad

Estado: `PASS`  
Candidate-ID: `574be0e+68eeffcc89a6`

## Superficie revisada

Ruta y navegación de resultado, autorización `COMPANY_ADMIN`, consulta/polling y descarga, aislamiento por cambio de sesión/empresa, manejo de 403/404/410, validación de respuesta, Correlation ID y ciclo de vida de Blob/Object URL. Se revisaron el paquete, los handoffs Dev/QA, el diff y el código/pruebas afectados; no fue necesario reabrir historia, contrato ni ADR.

## Controles y evidencia

- `PASS` — La ruta dinámica acepta únicamente UUID acotado y `canAccessPath` exige `COMPANY_ADMIN`; la UI no deriva rol ni tenant desde URL o controles.
- `PASS` — Consulta y descarga usan autorización de la sesión activa, sin `tenantId` suministrado por el cliente. El transporte invalida generaciones anteriores y el hook aborta y limpia trabajo, métricas, errores y descarga al cambiar sesión/empresa o desmontarse.
- `PASS` — 403 elimina el trabajo visible; 404 de consulta es neutral; 404 de descarga conserva solo el resumen ya autorizado; 410 marca el archivo vencido.
- `PASS` — La respuesta se reduce al modelo permitido; la vista no muestra UUID, tenant, datos personales, CSV ni `duplicateRows`. El Correlation ID pasa por validación UUID v4 antes de exponerse.
- `PASS` — El CSV se trata como Blob opaco, con nombre fijo `errores-importacion-clientes.csv`; no se interpreta contenido ni cabeceras de nombre, y el Object URL se revoca tras activar la descarga.
- Evidencia reutilizada QA: 76/76 pruebas focalizadas y 22/22 visuales, además de typecheck, lint, build y `git diff --check` correctos para el mismo candidato.
- Reproducción de abuso: un resultado previamente visible recibe 403 en la actualización; la prueba focalizada confirmó que `job` queda `null`, no se conservan contadores y se activa el estado prohibido (`1/1 PASS`).

## Hallazgos

Sin hallazgos de seguridad abiertos.

## Controles no aplicables y riesgo residual

`NOT_EXECUTED` por no formar parte del diff: secretos, WebSocket, almacenamiento local nuevo, cache/Redis, mensajería, pagos, dependencias e infraestructura.

Riesgo residual: la autorización y el aislamiento entre tenants dependen en última instancia de la validación del Backend; este candidato conserva esa frontera y no introduce un `tenantId` controlable desde Frontend.

Delta visual 2: `NOT_APPLICABLE` para reapertura de Seguridad; solo añade separación y apilado responsive al grupo de botones, sin cambiar lógica, datos, permisos ni descargas.
