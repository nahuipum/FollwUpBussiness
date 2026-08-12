# FE-004 — QA independiente (revalidación)

**Estado:** PASS  
**Candidate-ID:** `HEAD+71a31cc / FE-004-95444c0a9a91`

| Criterio | Implementación | Evidencia |
|---|---|---|
| Foco inicial | `StatusConfirmation` pasa su `dialogRef` a `useFocusTrap` | Prueba focalizada: foco en «Cancelar» al abrir |
| Tab / Shift+Tab | Hook compartido cicla último→primero y primero→último | Rama `event.shiftKey` revisada; prueba focalizada confirma Tab |
| Escape y retorno | Hook cierra mediante `onClose` y su limpieza restaura el disparador guardado | Prueba focalizada confirma cierre y foco en «Más acciones» |
| Bloquear/reactivar e integración | El mismo `StatusConfirmation` atiende ambos estados; solo se añadieron hook, ref y prueba | Sin cambios a API, mutaciones, permisos, rutas, CSS o `DashboardLayout` |

**Reproducción:** como `COMPANY_ADMIN`, abrir «Más acciones» y elegir bloquear (o reactivar). El foco inicia en «Cancelar»; `Tab` y `Shift+Tab` permanecen entre acciones; `Escape` cierra y devuelve el foco al botón que abrió el menú.

**Validación:** `npm test -- src/features/company-users/CompanyUsersPageRoute.test.tsx` correcto (4/4). Se reutiliza `npm run typecheck` correcto del handoff de Desarrollo para este Candidate-ID. Riesgo residual heredado, no alterado por esta remediación: faltan pruebas focalizadas de 403/409/422, vacío/error y logout durante mutación.
