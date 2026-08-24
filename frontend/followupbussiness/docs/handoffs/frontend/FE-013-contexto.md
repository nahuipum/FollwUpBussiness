# Paquete de contexto — FE-013 Resultado de importación

**Estado:** `DOF_PENDIENTE`  
**Candidate-ID:** `HEAD e327817 + diff rastreado f6761ba6a5cf6ac1192fe760ead8a9b52ec5fe59 + migración V39 y fuentes/pruebas FE-013 no rastreadas; excluye CSV ajenos clientes-importacion-{invalido,valido-1,valido-2}.csv`.

## Alcance

Continuar `Clientes → Carga de clientes`, sin nueva entrada de sidebar. Tras `POST /customer-imports` de FE-012, navegar usando el `importId` retornado a una ruta protegida solo para `COMPANY_ADMIN`. La vista consulta `GET /customer-imports/{importId}`, hace polling único mientras el estado no sea terminal y presenta un resumen accesible. Reutilizar layout, estilos, alertas y modales existentes; no copiar mockup a producción ni crear modal si uno existente resuelve el feedback.

## Contrato y brechas comprobadas

La implementación actual de `src/features/company-client-import/types.ts` y `api.ts` reconoce `PENDING`, `PROCESSING`, `COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`, con `id`, `totalRows`, `acceptedRows`, `rejectedRows`, `createdAt`, `completedAt`. No expone `duplicateRows`, `errorFileExpiresAt` ni el endpoint `/customer-imports/{id}/errors`.

Brecha: duplicados. **Severidad media**; afecta el criterio de mostrar duplicados. No derivarlos ni mostrarlos: el criterio permite hacerlo solo si Backend los provee explícitamente. Remediación mínima propuesta: añadir un contador explícito y su semántica al contrato. No bloquea el resto, por lo que no se solicita cambio Backend.

Delta: se comprobó que el contrato Backend real tampoco exponía `totalRows` ni `completedAt`. Backend persiste `totalRows` nullable (V39) al finalizar un parseo válido y expone ambos campos en POST/GET; el valor sigue siendo desconocido cuando no existe un conteo fiable. Esto resuelve el resumen sin que Frontend derive datos.

El endpoint y expiración de archivo sí forman parte del contrato indicado para FE-013; Desarrollo debe incorporarlos con parsing defensivo y tratar `400`, `403`, `404`, `410`, sin mostrar contenido/payload del CSV. Si el contrato real disponible contradice esta indicación, registrar el motivo, ruta y sección en el handoff.

## Invariantes y superficie

1. Actor/recurso: solo `COMPANY_ADMIN` puede abrir ruta, consultar resultado o descargar; la UI no sustituye la autorización Backend/tenant.
2. Éxito: navegación desde FE-012 conserva el `importId`; estados terminales paran polling; descarga solo cuando hay rechazos, estado compatible y archivo disponible.
3. Denegación/no encontrado: `403`/`404` no revelan datos/contadores y dan feedback claro; `400` y red degradada dejan reintento seguro; `410` explica expiración y deshabilita descarga.
4. Limpieza: desmontaje, logout o cambio de empresa invalidan requests, cancelan polling, resultado, modal y URL/referencia de descarga; no se duplica polling ni queda solicitud posterior.
5. Privacidad: no renderizar CSV, direcciones, documentos, teléfonos, correos, payloads de error ni registrarlos.

Puertos: `POST /customer-imports` → navegación FE; `GET /customer-imports/{id}` → resultado/polling; `GET /customer-imports/{id}/errors` → blob descargable. API deriva actor/tenant mediante bearer; Frontend codifica el `id` y reacciona a generación/sesión.

## Referencias verificadas

No existe mockup exacto `FE-013` bajo `../../docs/frontendMockups/` (consulta por nombre). Referencias cercanas: `src/features/company-client-import/CompanyClientImportPage.tsx`, `hooks/useCustomerImport.ts`, `api.ts`, `styles/company-client-import.css`, `src/app/App.tsx`, `src/features/auth/auth.ts`, `src/shared/ui/ModalSurface.tsx` y alertas de `shared/ui/error-ui`.

## Fase actual

Desarrollo Frontend. Esperado: `READY_FOR_HANDOFF` o `BLOCKED`; pruebas focalizadas, `npm run typecheck` y CI-equivalente (`npm run lint` y `npm run build`) por cambio de ruta/API/autorización/composición. Artefacto posterior: `docs/handoffs/frontend/FE-013-desarrollo.md` (máx. 300 palabras, español).
