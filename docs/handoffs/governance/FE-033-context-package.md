# FE-033 — Paquete de contexto visual vigente

- **Alcance:** implementar exclusivamente el área de contenido del mockup aprobado por el usuario `docs/frontendMockups/FE-033.html`, estudiado junto con `_design-system.html` y `assets/golden-system.css`. El archivo es un prototipo de contenido con 14 estados por `?state=` y modo oscuro por `?theme=dark`; no contiene una marca independiente de aprobación ni está versionado aún. Conservar `CompanyWorkspaceLayout` y no incluir toolbar de previsualización ni anotación de brechas en UI.
- **Candidate-ID:** `HEAD:574be0e+diff:d56c4e1c` (diff de la feature y componentes compartidos afectados). Estado: Development `READY_FOR_HANDOFF`, QA `PASS` funcional y visual, Seguridad `PASS` conciliada con delta posterior de presentación sin cambio de amenaza/control, DoF `PASS`.
- **Superficie propia:** `frontend/followupbussiness/src/features/company-settings/{CompanySettingsPage.tsx,hooks/useCompanySettings.ts,api.ts,types.ts,styles/company-settings.css,styles/company-settings-standard.css}` y pruebas correspondientes. La ruta ya se compone en `src/app/App.tsx` dentro de `CompanyWorkspaceLayout` para empresa, supervisor y vendedor; no editar shell.
- **Referencia compartida:** usar variantes visuales ya existentes de `Button`, `ReadOnlyNotice`, `AsyncStateCard`, `TimeField`, alertas y tokens `--visual-*` de `src/styles/theme.css` cuando correspondan. No duplicar fuentes, radios, bordes, colores ni espaciado de esos componentes.

## Trazabilidad antes de editar

| Mockup | Implementación actual y cambio esperado |
| --- | --- |
| Encabezado y metadatos `unchanged/pending/saving/success/save-error/conflict/refreshing/readonly` | `CompanySettingsPage` presenta encabezado antiguo y solo fecha al pie; llevar encabezado, badge de estado, versión ETag y última actualización arriba. El hook tiene `snapshot`, `loading`, `saving`, `error`, `conflict`, `lastUpdated`; falta acuse de éxito explícito. |
| Avisos `refreshing/conflict/save-error/success/readonly` | Página usa `InlineAlert` y `ReadOnlyNotice` default; aplicar variantes compartidas del refactor y bloqueo de edición durante refresco/conflicto. `reloadAfterConflict` está en el hook. |
| `loading/load-error/forbidden` | Página usa `TableLoadingIndicator` y `AsyncStateCard` default; componer estado visual de contenido, reintento y 403 con `AsyncStateCard` golden; mantener GET y limpieza de sesión. |
| Jornada `validation-pair/validation-order` | `TimeField` controla valores HH:MM y validación de pareja/orden; conservar null y el mensaje actual; mostrar ayuda/error accesibles junto a cada control. |
| Plazo `validation-window` | Campo numérico de página, límite 0–10080 y null; preservar API: null se omite del PATCH. Añadir feedback de rango/entero y estados disabled. |
| Datos de empresa y política fija | `types.ts` y `api.ts` tipan y validan zona, moneda, radio 100, frecuencia 60, retención 90; página muestra moneda/zona deshabilitadas y política. Llevar a `dl` solo lectura, valores server backed y notas visuales. |
| Guardar y conflicto | `api.ts` usa GET/PATCH `/company/settings`, ETag citado e If-Match; `useCompanySettings` guarda, invalida respuestas viejas por generación y expone conflicto 409. Preservar y probar. |
| Responsive/oscuro | Dos hojas actuales contienen turquesa, hardcodes y overrides; consolidar lo necesario en una con tokens visuales y eliminar selectores sin uso. |

## Invariantes y decisiones

1. Actor/recurso: tenant desde sesión; GET/PATCH sin tenant editable. `COMPANY_ADMIN` puede PATCH; `SUPERVISOR` solo consulta. `SELLER` está bloqueado actualmente en React aunque OpenAPI `docs/api/openapi.yaml` línea 733 y `CompanySettingsService.viewer` permiten GET: no cambiar rol durante esta tarea visual; reportar discrepancia.
2. Denegación/conflicto/error: ningún PATCH tras 403, formulario desfasado, conflicto 409 o sesión cambiada; 409 no sobrescribe valores y exige recarga/revisión. No crear eventos, revocaciones ni auditoría cliente ficticios.
3. Validación: pareja de horarios completa o vacía, inicio anterior a fin; plazo null o entero 0–10080; moneda y zona solo consulta según pantalla actual. El contrato de `api.ts` envía moneda, horario y plazo no nulo, jamás política fija.
4. Cambios de sesión/empresa: descartar respuesta previa y no presentar ni enviar datos del tenant anterior, incluso con el mismo ETag.
5. Brecha funcional: la historia dice «Confirma» y «Auditoría», pero no define confirmación previa ni consulta de historial. Backend registra evento; mockup lo anota como brecha y no lo representa como UI de producto. Radio configurable futuro contradice política MVP fija de 100 m.

## Verificación requerida

Pruebas afectadas de página/hook/API, typecheck/lint/build; evidencia visual lado a lado de contenido con mismos datos, viewport y estados desktop/móvil, incluidos conflicto y solo lectura; accesibilidad de etiquetas, foco, teclado, anuncio y contraste. Respetar los cambios ajenos sin revertirlos.
