# FE-012 — Paquete de contexto

- **Estado:** Desarrollo listo para handoff; QA, Seguridad y DoF anteriores no corresponden al candidato actual.
- **Candidate-ID:** `574be0e+2c60f01eba4f`.
- **Alcance:** migración visual golden de `/company/customer-imports`, exclusiva de `COMPANY_ADMIN`, sin rediseñar FE-013.

## Contrato estable y decisiones

- `GET /customers/import-template`: consulta automática de `X-Template-Version` y descarga Blob CSV/XLSX; recuperación real tras error.
- `POST /customer-imports`: multipart `templateVersion`, `partialAcceptance`, `file`; conserva CSRF e `Idempotency-Key`; un POST por intento lógico; 202 navega con `replace` a `/company/customer-imports/{importId}`.
- CSV UTF-8 o XLSX OOXML sin macros; máximo exacto `10 * 1024 * 1024` bytes. MIME vacío permitido con extensión válida. No se parsea ni previsualiza contenido.
- 400/409/413/415/422 no reenvían automáticamente. Correlation ID se conserva cuando es seguro. 401/403 y cambios de sesión/empresa eliminan archivo, versión, trabajo e idempotencia; solicitudes obsoletas se ignoran.
- Sólo `COMPANY_ADMIN` ve la opción y monta el flujo. El acceso directo de `SUPERVISOR` presenta forbidden sin consultar la plantilla.

## Invariantes

1. Actor/recurso: ruta y navegación exclusivas de `COMPANY_ADMIN`; servidor sigue siendo autoridad final.
2. Éxito: versión vigente acompaña el multipart y un 202 delega el resultado a FE-013.
3. Denegación: no persisten archivo ni información de otra sesión/empresa.
4. Conflictos/rechazos: mensajes contractuales, sin parsing ni reenvío automático.
5. Límite de alcance: no cambian polling, estados, contadores ni descarga de rechazados de FE-013.

## Superficie visual y técnica

- Fuente visual inmutable: `docs/frontendMockups/FE-012.html`; consistencia comprobada con FE-008, FE-010, `_design-system.html`, `_application-shell.html` y `golden-system.css`.
- `CompanyClientImportPage` usa cuatro pasos golden, `FileUploadField`, `InlineAlert`, `AsyncStateCard` y el application shell existente.
- CSS FE-012 aislado bajo `.customer-import-upload*`; los selectores legacy todavía consumidos por FE-013 permanecen protegidos.
- La comparación visual controlada cubre 1440×900, 1280×800, tablet, 390×844 y tema oscuro, además de estados funcionales.

## Delta Development

- Se sustituyó la tarjeta turquesa antigua por el flujo golden aprobado, incluidos estados de plantilla, archivo, aceptación, envío, errores y forbidden.
- `FileUploadField` se homologó con tokens golden y accesibilidad: input nativo, error asociado, nombre largo, quitar archivo con retorno de foco y estados hover/focus/disabled.
- La validación local tipada diferencia 413 de 415 y rechaza XLSM, extensión/MIME incompatibles y tamaños superiores a 10 MiB.
- Se añadió reintento real de versión, bloqueo sincrónico de descarga/envío duplicados y limpieza reforzada al pasar a un perfil no administrador.
- Evidencia: 419/419 pruebas unitarias seriales, 19/19 visuales, typecheck, lint sin errores, build y `git diff --check` correctos.

## Gate siguiente

Estado esperado de QA: `PASS`, `CHANGES_REQUIRED` o `BLOCKED`. QA debe usar este Candidate-ID y el handoff actual; los artefactos QA/Seguridad/DoF con `3c13280+dafdabcf8d32` son históricos y no habilitan el gate actual.
