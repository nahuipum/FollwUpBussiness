# FE-012 — Handoff de Desarrollo Frontend

- **Estado:** READY_FOR_HANDOFF
- **Candidate-ID:** `574be0e+2c60f01eba4f`
- **Alcance:** migración golden de `/company/customer-imports`; FE-013 permanece fuera de alcance.

Implementado: flujo visual de cuatro pasos conforme a `docs/frontendMockups/FE-012.html`; estados de versión/descarga, CSV/XLSX, nombre largo, validación 413/415, aceptación parcial, envío, errores, transición 202 y forbidden; responsive y tema oscuro. Se reutilizaron application shell, `FileUploadField`, `InlineAlert` y `AsyncStateCard`; el uploader compartido evolucionó con input nativo, asociaciones ARIA y retorno de foco.

Se preservan endpoint/métodos, Blob, multipart (`templateVersion`, `partialAcceptance`, `file`), CSRF, `Idempotency-Key`, límite exacto de 10 MiB, no lectura del archivo, un POST por intento, Correlation ID, descarte de solicitudes obsoletas, limpieza de sesión/empresa y navegación `replace` a FE-013. El acceso directo de `SUPERVISOR` no monta el hook ni consulta la plantilla.

Evidencia: suite serial 74 archivos/419 pruebas PASS; grupo FE-012/FE-013/autorización 7 archivos/100 pruebas PASS; visual FE-012 19/19 PASS; `npm run typecheck` PASS; `npm run lint` sin errores (una advertencia preexistente en `useTerritoryForm.test.tsx`); `npm run build` PASS con aviso conocido de chunks >500 kB; `git diff --check` PASS.

Comparación lado a lado revisada en 1440×900, 1280×800, 768×1024 y 390×844, además de oscuro. Divergencias restantes limitadas al shell compartido preexistente: campana/etiqueta de rol y breadcrumb móvil; no se reconstruyó el shell por delimitación. Los archivos y estilos de resultado/polling FE-013 no fueron modificados; sus pruebas focalizadas y la suite completa pasan.
