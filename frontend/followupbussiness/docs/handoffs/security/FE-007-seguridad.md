# FE-007 — Revisión de Ciberseguridad

**Resultado:** PASS
**Candidate-ID:** `HEAD 286ad04 + FE007-7f177aa2`

## Superficie revisada

Autorización visual por rol, aislamiento por sesión/empresa, mutación `PATCH /sellers/{sellerId}/status`, invalidación de selección/motivo/envío/listado, tratamiento de `403/404/409` y minimización de datos en diálogo/errores.

## Abuso verificable

**PASS.** Se ejecutó una reproducción focalizada (2 archivos, 6 pruebas): con el diálogo abierto, el cambio de empresa invalida vendedor, motivo y error; después, `submit` queda sin recurso actual y retorna antes de invocar `changeSellerStatus`. Una respuesta de una generación anterior tampoco actualiza la fila. Como `SUPERVISOR`, el menú no permite obtener ni invocar Activar/Inactivar. Comando: `npm test -- --run src/features/company-sellers/hooks/useSellerStatus.test.tsx src/features/company-sellers/components/SellerTable.test.tsx`.

## Controles y hallazgos

- **PASS — autorización/tenant:** la UI limita la acción a `COMPANY_ADMIN`, pero envía bearer y prueba CSRF actuales y mantiene al Backend como autoridad; no deriva `tenantId` ni lo acepta desde entrada del usuario.
- **PASS — efectos prohibidos:** doble envío bloqueado; solo `200` reemplaza por ID. `403/404/409` conservan fila, diálogo y motivo, sin éxito falso.
- **PASS — privacidad:** el motivo solo aparece en el body requerido; los mensajes son genéricos y no renderizan cuerpos del Backend. Solo se muestra el nombre necesario para confirmar identidad.
- **Hallazgos:** ninguno.

## No aplicable y riesgo residual

Sin cambios en secretos, almacenamiento local, WebSocket, caché/Redis, mensajería, archivos, dependencias o infraestructura. **NOT_EXECUTED:** rechazo real de un ID de otro tenant; corresponde al Backend ya establecido. Riesgo residual: el aislamiento definitivo depende de su autorización por recurso.
