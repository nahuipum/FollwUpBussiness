# FE-013 — Desarrollo

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD e327817 + diff rastreado f6761ba6a5cf6ac1192fe760ead8a9b52ec5fe59 + migración V39 y fuentes/pruebas FE-013 no rastreadas; excluye CSV ajenos clientes-importacion-{invalido,valido-1,valido-2}.csv`.

## Implementado

- Tras aceptar `POST /customer-imports`, la carga navega a `/company/customer-imports/{importId}`. La ruta dinámica está protegida para `COMPANY_ADMIN` y conserva el layout de Clientes.
- Nueva vista de resultado con carga, resumen accesible, última actualización, polling único hasta estado terminal y aviso de dato desactualizado con reintento.
- `GET /customer-imports/{id}/errors` descarga únicamente un `Blob`; no se interpreta ni muestra el CSV. Maneja 400/red, 403/404 sin conservar contadores, y 410 con explicación y descarga deshabilitada.
- Las solicitudes, polling y estado se invalidan al desmontar, cerrar sesión o cambiar empresa. Se añadió `errorFileExpiresAt` defensivo; no se muestra contador de duplicados porque Backend no lo entrega.
- Delta Backend: `totalRows` se persiste y se devuelve junto a `completedAt`; no se deriva en Frontend. El consumidor asíncrono reconstruye el contexto de auditoría desde el trabajo persistido para permitir procesar filas sin confiar en el mensaje RabbitMQ.

El delta Backend está `READY_FOR_HANDOFF`: V39 declara `total_rows` nullable/no negativo; el conteo se guarda solo tras parseo válido e incluye aceptadas y rechazadas. La consulta y la creación preservan el filtro de tenant y no exponen datos del archivo.

## Archivos

`src/features/company-client-import/{CompanyClientImportResultPage.tsx,api.ts,types.ts,hooks/useCustomerImportResult.ts}`; integración mínima en `src/app/App.tsx` y `src/features/auth/auth.ts`; pruebas focalizadas del feature.

## Evidencia

- `npm run test -- src/features/company-client-import/api.test.ts src/features/company-client-import/hooks/useCustomerImport.test.tsx src/features/company-client-import/hooks/useCustomerImportResult.test.tsx` → 3 archivos, 11 pruebas OK.
- `npm run typecheck`, `npm run build` y `git diff --check` → OK.
- `npm run lint` → sin errores; persiste un warning preexistente en `src/features/company-territories/hooks/useTerritoryForm.test.tsx`.
- Backend: `mvn -q clean verify` y `git diff --check` → OK.

## Riesgos y reproducción

El contrato aún no entrega `duplicateRows`; queda fuera de UI según paquete. Para verificar: como `COMPANY_ADMIN`, carga un archivo, abre la URL resultante, espera estado terminal y descarga errores; responder 410 en `/errors` debe explicar vencimiento y deshabilitar el botón. Se consultó `src/lib/api.ts` por nueva superficie de cancelación; se usó `AbortSignal` ya soportado.
