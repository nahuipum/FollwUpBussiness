# FE-013 — Development handoff

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `574be0e+68eeffcc89a6`

## Entregado

- Se completa el panel golden con badge de estado, icono/títulos, copys específicos de plantilla inválida y acciones/pie para polling, stale y terminales. La región `aria-live` queda limitada al estado de polling; los `time` solo se generan para fechas válidas y la descarga expone `aria-busy`.
- Descarga cubre listo, curso, éxito, error, vencido y no disponible. 404 preserva el resumen; 410 deshabilita el archivo; 403 conserva la limpieza. Blob, nombre, revocación y abort existentes permanecen.
- La navegación activa acepta solamente la ruta exacta o UUID válido; el breadcrumb se entrega como tres elementos reales: empresa, `Carga de clientes`, `Resultado`.
- Se retiró el bloque legacy FE-013 sin consumidores de `company-client-import.css`, preservando FE-012. Añadidas pruebas de página/hook/API/navegación y visuales FE-013 con reloj/red controlados, 1440, 1280, tablet, móvil y oscuro. No se modifica mockup ni se inventa `duplicateRows`.
- Ajuste visual 2: el grupo de acciones del footer usa flex, wrap, alineación final y separación de 8 px; en móvil ocupa el ancho disponible y apila sus botones sin overflow. FE-012 y la lógica permanecen intactos.

## Contratos y criterios

Ruta UUID acotada y autorización siguen en las capas existentes. `totalRows: null` se representa como `No disponible`; no hay porcentaje. El contenido no expone UUID, tenant ni contenido de CSV.

## Evidencia

- `npx vitest run src/features/company-client-import/CompanyClientImportResultPage.test.tsx src/features/company-client-import/hooks/useCustomerImportResult.test.tsx src/features/company-client-import/api.test.ts src/features/company-client-import/CompanyClientImportPage.test.tsx src/app/App.test.tsx src/app/components/CompanyWorkspaceLayout.test.tsx --environment jsdom --reporter=dot` — 76 correctas.
- `npx playwright test tests/visual/company-client-import-result.visual.spec.ts --reporter=line` — 22 correctas; cubre loading, error inicial, 404, forbidden 403 sin métricas, pending/total desconocido/processing/stale, terminales, plantilla inválida, descarga lista/en curso/error/410/404, móvil y oscuro con reloj/red controlados.
- `npm run typecheck`, `npm run lint`, `npm run build` y `git diff --check` correctos; lint conserva un warning ajeno preexistente en `useTerritoryForm.test.tsx`, build el aviso de chunks >500 kB.

## Riesgos y reproducción

Las capturas visuales son artefactos de ejecución, no baselines versionados; QA debe revisar la comparación con el golden. Para reproducir el cambio crítico, abrir un resultado terminal con rechazos y responder `404` a `GET /customer-imports/{id}/errors`: el resumen permanece y el archivo queda como no disponible; con `410` queda vencido y con `403` se limpia y se muestra forbidden.
