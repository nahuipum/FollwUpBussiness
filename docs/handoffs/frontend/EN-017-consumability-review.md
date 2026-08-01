# Revisión de consumibilidad Frontend — EN-017

## Estado

`PASS` — el diseño EN-017 y los contratos disponibles son consumibles por
Frontend para la futura `FE-002`. Esta revisión no aprueba EN-017, ADR-017,
los contratos ni la futura implementación de FE-002.

## Alcance y snapshot revisado

- `docs/stories/enablers/EN-017-definir-canales-de-notificacion.md`
- `docs/architecture/adr/ADR-017-canales-notificacion.md`
- `docs/events/notification-contract.md` y `docs/events/event-catalog.yaml`
- `docs/handoffs/governance/EN-017-decisions.md`
- `docs/handoffs/backend/EN-017-development-handoff.md`
- `docs/stories/enablers/EN-013-definir-autenticacion-sesiones-y-recuperacion.md`,
  `docs/architecture/adr/ADR-008-autenticacion-sesiones.md` y
  `docs/stories/frontend/FE-002-recuperacion-de-contrasena.md`
- Superficie OpenAPI afectada: `POST /auth/password-recovery-requests` y
  `POST /auth/password-resets` en `docs/api/openapi.yaml`.
- `frontend/followupbussiness/`: solo existe el scaffold (`App` y su prueba);
  aún no hay cliente, rutas, caché de sesión ni UI de recuperación o push.

El worktree contiene cambios documentales ajenos y no rastreados de EN-017
(ADR, contrato, decisiones y handoff Backend), además del cambio rastreado en
el catálogo; no fueron modificados. No hay diff de Frontend ni código Frontend
que revisar para esta historia.

## Consumibilidad FE-002 confirmada

| Necesidad de FE-002 | Evidencia de contrato/diseño | Comportamiento Frontend exigible al implementarla |
|---|---|---|
| Solicitud sin enumerar cuentas | `POST /auth/password-recovery-requests` responde el mismo `202` para una entrada válida, sin token ni estado de cuenta. | Durante el envío se deshabilita la acción y se expone estado accesible; al `202` se muestra un único mensaje neutral, sin condicionar el texto al correo ni al resultado de entrega. |
| Error y reintento seguro | OpenAPI define `400`, `429` y `503`; ADR-008 mantiene el mismo rate limit para entradas existentes/inexistentes y define `Retry-After` para los límites/no disponibilidad. | `400` se limita a validación sintáctica; `429`/`503` muestran un error genérico y reintento controlado, respetando `Retry-After` si está presente. Nunca se infiere que una cuenta existe ni que el email fue entregado. |
| Restablecimiento y expiración | `POST /auth/password-resets` devuelve `204`; `410 PASSWORD_RESET_TOKEN_EXPIRED`; `400` para token inválido/consumido; `422` para política de contraseña. | Tras `204`, borrar token y contraseña del estado y dirigir a inicio de sesión. `410` debe ofrecer solicitar un nuevo enlace; `400` debe ser un estado seguro de enlace no usable; `422` debe asociarse accesiblemente al campo de contraseña, sin registrar valores. |
| Separación email de identidad / push operativo | ADR-017 D1/D6 y `notification-contract.md`: el email transaccional es exclusivo de identidad; push `route.*` es best-effort, genérico en pantalla bloqueada y se refresca desde Backend. | FE-002 no consume ni muestra eventos `route.*`, ni registra dispositivos, ni usa push como confirmación de recuperación. No debe anunciar envío/entrega de email ni mezclar textos de ruta con el flujo de identidad. |
| Sesión, empresa y privacidad | ADR-017 exige revocación de vínculos de dispositivo en logout/cambio de usuario o tenant; ADR-008 revoca sesiones al reset y obliga a limpiar estado local. | Al implementar FE-002, su estado transitorio no puede sobrevivir logout, cambio de usuario/empresa ni reset exitoso; no persistir token, contraseña, email ni resultados sensibles en caché o logs. |

No se detecta conflicto material que requiera devolver la Fase 2: EN-017 no
agrega una dependencia de SDK, endpoint, WebSocket, permiso ni proveedor al
panel web. La separación explícita evita que Frontend confunda email de
identidad con notificaciones operativas móviles.

## Criterios y reproducción para FE-002

1. Enviar un email válido existente y uno inexistente: ambos deben producir el
   mismo estado UI neutral después de `202`, sin diferencia observable de
   cuenta, token o entrega.
2. Simular `429` y `503`: la UI muestra estado de error accesible, no revela
   identidad, evita reenvío concurrente y habilita reintento según
   `Retry-After` cuando exista.
3. Abrir el restablecimiento con token expirado (`410`), inválido/consumido
   (`400`) y contraseña inválida (`422`): comprobar los estados diferenciados
   anteriores, el foco/announcements accesibles y que no se conserva el token
   o la contraseña.
4. Completar `204`, cerrar sesión o cambiar de empresa/usuario: confirmar que
   la vista y cualquier estado/caché asociado se limpian y que el acceso vuelve
   a autenticarse.
5. Recibir un aviso de ruta en paralelo: no debe modificar la UI ni el estado
   de recuperación; el panel no usa push como fuente de verdad.

## Verificación ejecutada

- Consulta Graphify acotada intentada para los puntos de integración EN-017;
  no fue ejecutable porque el único `python.exe` disponible es el alias de
  WindowsApps sin acceso y `graphify-out/.graphify_python` no existe. Se usó
  la inspección selectiva de los artefactos arriba enumerados como fallback.
- `npm run typecheck` — PASS.
- `npm test` — PASS (1 archivo, 1 prueba).
- `npm run lint` — PASS.

Un primer intento de prueba con `--runInBand` falló porque Vitest no admite esa
opción; no corresponde a una falla de la suite. La ejecución posterior usó el
script oficial `npm test` y pasó.

## Riesgos y siguiente paso

Riesgo residual: FE-002 no está implementada; el scaffold actual no demuestra
los estados, accesibilidad, limpieza por sesión/empresa ni manejo de los
contratos. Su historia deberá añadir cliente tipado, UI y pruebas dirigidas sin
alterar reglas de Backend. La implementación de push corresponde a Mobile y a
las historias posteriores, no a FE-002.

No se modificaron archivos de producto, ADR, contratos ni historia EN-017. No
se hicieron commits.
