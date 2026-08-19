# FE-008 — Desarrollo Frontend

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD c4bf994 + FE008 085f8866153c`.

## Implementación

- `src/features/company-clients/`: reemplaza datos simulados por `GET /customers` con parser estricto, filtros contractuales, paginación del servidor y referencias permitidas (`GET /territories`, `GET /sellers`). La tabla minimiza PII: nombre, segmento, cantidad de vendedores y estado; no muestra documento, contacto, dirección, UUID ni ubicación.
- El hook descarta respuestas obsoletas y limpia filas, filtros, opciones, metadatos y errores ante cambio de sesión/empresa. `403` revoca inmediatamente esos datos; errores recuperables marcan los datos como no vigentes, con última actualización visible.
- Estados accesibles: carga inicial, actualización stale, vacío, cero resultados con limpieza, error y prohibido. No hay acciones de escritura.
- Rutas/navegación: Admin `/company/clients`; Supervisor `/supervisor/clients`; Seller no obtiene ruta ni navegación.

## Contrato y evidencia

- Usado: `GET /customers` y opciones `GET /territories`, `GET /sellers`, con autorización de sesión. Se abrió `../../docs/api/openapi.yaml` únicamente para resolver la ambigüedad de tipos requeridos de `Customer.location` (`GeoPoint`) en el parser; secciones `/customers`, `Customer`, `CustomerPage`, `GeoPoint`.
- Sin mockup FE-008; se preservó el esqueleto de `company-clients` y no se modificaron mockups.

## Verificación

- `npm test -- src/features/company-clients/api.test.ts src/features/company-clients/components/ClientTable.test.tsx src/app/App.test.tsx` — 31 pruebas correctas.
- `npm run typecheck`, `npm run build`, `git diff --check` — correctos.
- `npm run lint` — sin errores; persiste una advertencia preexistente ajena en `company-territories/hooks/useTerritoryForm.test.tsx`.

## Riesgo/reproducción

El backend decide cartera/tenant; para comprobar, iniciar como Supervisor, abrir **Clientes**, combinar filtros y cambiar de sesión: las filas previas se eliminan y una respuesta tardía no reaparece.
