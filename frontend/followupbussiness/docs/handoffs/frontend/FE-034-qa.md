# FE-034 — Handoff QA Frontend

Estado: `PASS`  
Candidate-ID: `f027a0b + 337464cb`

Revalidación independiente de la remediación de carrera `401`; se preservaron cambios ajenos. El informe Security referido en el paquete no está disponible en el árbol; se trata como metadato ausente y no altera esta decisión QA.

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| A inicia solicitud; B reemplaza identidad/tenant antes de resolver; `401` A no afecta B | `apiRequest` asocia la generación de sesión, aborta/descarta respuestas obsoletas antes de publicar. `useGlobalApiError` vuelve a validar generación; `clearSession` rota generación. | `App.test.tsx`: A recibe `401/corr-a` tardío y rechaza `ApiRequestObsoleteError`; B conserva `admin-b/tenant-b`, ruta y permiso de empresa, sin diálogo, alerta, redirección ni `corr-a`. |
| `401` vigente de B conserva el flujo seguro | Solo el evento de la generación vigente publica el error y limpia sesión una vez. | La misma prueba recibe después `401/corr-b`: muestra el diálogo y `corr-b`, y revoca la sesión de B. |
| Regresión directa | Normalización y flujos existentes de `401` permanecen acotados a la sesión activa. | `npm test -- --run src/app/App.test.tsx src/lib/api.test.ts`: 30/30 correctas. `git diff --check`: correcto. |

No hay hallazgos abiertos. Riesgo residual: los consumidores de `apiRequest` deben tratar `ApiRequestObsoleteError` como resultado descartado, sin UI ni reintento.
