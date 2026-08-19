# Paquete de contexto — FE-007

## Estado y predecesoras

- Historia: `FE-007 — Activar o inactivar vendedor`.
- Estado: `READY_FOR_QA`; Candidate-ID: `HEAD 286ad04 + FE007-7f177aa2` (calculado una vez tras Development; cambios FE-007 en `company-sellers` y sus artefactos).
- `BE-010` está terminado: DoF `PASS` y contrato estable para `PATCH /sellers/{sellerId}/status`.
- `FE-005` está terminado: DoF `PASS`; aporta el listado, menú de acciones, estado de sesión y limpieza de tenant en `company-sellers`.

## Alcance y referencia visual

- Solo confirmación e integración de cambio lógico de estado en `src/features/company-sellers/`. Se preservan tabla, menú, diseño, composición, responsive y overlays existentes; no modificar mockups.
- No existe `docs/frontendMockups/FE-007.html`; usar el patrón compatible de estado/modal y foco de `src/features/company-users/`.

## Contrato y permisos

- `PATCH /sellers/{sellerId}/status`; body `ChangeEntityStatusRequest`: `status` y `reason` obligatorios; motivo de 5–500 caracteres como ayuda UI. Respuestas: `200`, `400`, `403`, `404`, `409`.
- Solo `COMPANY_ADMIN` ve y ejecuta la acción. `SUPERVISOR` consulta sin acción; `SELLER` no cambia estados. Backend conserva autoridad sobre autorización y tenant.
- Éxito `200`: sustituir la fila por el `Seller` devuelto o recargar. Errores, incluido `409`, no alteran fila ni anuncian éxito; `409` conserva diálogo y motivo.

## Invariantes y UX

1. Actor/recurso: admin del tenant; la UI no sustituye la validación de Backend.
2. Éxito: diálogo confirma vendedor, acción real y motivo; doble envío bloqueado y progreso visible.
3. Denegación/error: `400/403/404/red` no escriben estado local ni éxito; `409` es recuperable y mantiene el formulario.
4. Inactivar advierte revocación de acceso y ausencia de nuevas rutas, sin promesas extra; activar no restituye sesiones/rutas/asignaciones previas.
5. Sesión/empresa: cerrar diálogo, limpiar selección/envío y caché de vendedores al cambiar o cerrar sesión.

Accesibilidad obligatoria: modal semántico, foco inicial, trampa/retorno de foco, labels, anuncio de error y teclado. No borrar ni editar entidades o relaciones fuera de alcance. El motivo no se registra ni se expone fuera de la solicitud necesaria.

## Superficies y evidencia esperada

- Código: `api.ts`, tipos, hook/estado, tabla/página y diálogo dentro de `company-sellers`; reutilización adaptada de `company-users`.
- Pruebas focalizadas: éxito, validación, cancelación/doble envío, errores (`409`, `403`, `404`, red), roles, sesión/empresa y accesibilidad. Development ejecuta pruebas focalizadas y `npm run typecheck`; por cambiar API/sesión/composición, ejecutar lint/build completo si corresponde.
