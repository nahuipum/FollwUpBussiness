# FE-013 — Paquete de contexto

Estado: `DEVELOPMENT`
Candidate-ID: `574be0e+68eeffcc89a6`

## Objetivo y fuente visual

Migrar `/company/customer-imports/{importId}` al resultado golden aprobado de `docs/frontendMockups/FE-013.html`, sin modificar los mockups. Continuidad visual consultada: FE-012, FE-010, FE-008, `_design-system.html` y `_application-shell.html`. FE-012 es región visual y funcional protegida.

## Criterios y decisiones

- Estados: carga inicial, error inicial, 404 neutral, forbidden, PENDING, PROCESSING, stale, COMPLETED, COMPLETED_WITH_ERRORS, FAILED, INVALID_TEMPLATE y estados de descarga listo/en curso/completado/error/vencido/no disponible.
- Un único panel golden con encabezado semántico, descripción, badge, última actualización, tres métricas reales, alertas, acciones y archivo de rechazados cuando corresponda.
- `totalRows: null` se presenta como “No disponible”. No existe porcentaje contractual.
- `duplicateRows` no existe en `CustomerImportJob` ni OpenAPI: no mostrar, calcular, leer del CSV ni fingir. Requiere decisión contractual separada.
- Conservar endpoints, estados contractuales, polling de 2 s, timeout de 15 s, una request activa, abort/invalidation, Blob, nombre `errores-importacion-clientes.csv`, revocación del Object URL y validación segura de Correlation ID.
- 403 limpia el job; 404 de consulta es neutral; 410 de descarga marca vencido; 404 de descarga conserva el resumen y marca solo el archivo como no disponible.
- Ruta válida mediante UUID acotado; `COMPANY_ADMIN`; recarga restaurable; Clientes expandido; Carga de clientes activa; breadcrumb `Carga de clientes / Resultado`; UUID ausente del contenido.
- Accesibilidad: `aria-live="polite"` breve, `role="status"` para polling, alertas con `role="alert"`, métricas en `<dl>`, `<time>` válido, busy/disabled, foco visible y sin progreso porcentual.

## Invariantes de seguridad y efectos

1. Actor/recurso: solo `COMPANY_ADMIN` de la sesión activa consulta o descarga el recurso; tenant y rol nunca se derivan de URL o UI.
2. Éxito: solo respuestas contractuales validadas actualizan job/métricas; la descarga se trata como Blob opaco y no se inspecciona.
3. Denegación: 403 aborta/limpia job, métricas y descargas; no conserva datos del tenant o perfil anterior.
4. Conflicto/neutralidad: 404 de trabajo no revela propiedad; 404 de archivo conserva únicamente el resumen ya autorizado y no se etiqueta como vencido.
5. Fallo/rollback: stale conserva el último éxito y detiene polling; timeout, desmontaje y cambio de sesión abortan e ignoran respuestas obsoletas; no hay escrituras, eventos ni credenciales expuestas.

## Superficie prevista

`CompanyClientImportResultPage.tsx`, `hooks/useCustomerImportResult.ts`, sus pruebas, `styles/company-client-import-result.css`, limpieza del bloque FE-013 en `company-client-import.css`, `CompanyWorkspaceLayout.tsx`/pruebas, `App.tsx`/pruebas y `tests/visual/company-client-import-result.visual.spec.ts`. `api.ts`/`types.ts` solo si la corrección focalizada lo requiere. Preservar todos los cambios ajenos del worktree.

## Validación esperada

Pruebas focalizadas de página, hook, API, navegación y FE-012; visuales FE-013 con reloj/red controlados; lint, typecheck, build/CI equivalente; comparación con el golden en 1440×900, 1280×800, tablet y 390×844, claro/oscuro. No actualizar snapshots sin revisar diferencias.

## Delta de corrección 1

QA `CHANGES_REQUIRED` sobre `574be0e+76a31b3cefcd`: completar badge/iconos/copys y estados explícitos de descarga, éxito, vencimiento y no disponibilidad; separar acciones y pie por polling/stale/terminal; añadir pruebas de página y el spec visual obligatorio con red/reloj controlados y comparación multiview/tema. Corregir además la activación del menú para aceptar solo la ruta exacta o la ruta dinámica con UUID válido (no `startsWith`) y retirar exclusivamente el bloque legacy FE-013 ya sin consumidores de `company-client-import.css`, preservando todo FE-012.

## Delta visual 2

La captura de usuario evidencia que los botones `Actualizar` y `Volver a cargas` quedan unidos. Aplicar al contenedor de acciones el patrón golden `display:flex`, `flex-wrap`, alineación final y `gap: 8px`; en móvil mantener el grupo y ambos botones al 100% para que se apilen sin overflow. Cambio exclusivo de FE-013; FE-012 permanece protegido.
