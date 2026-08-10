# Paquete de contexto — FE-002

- Historia: `FE-002` — Recuperación de contraseña.
- Estado de entrada: `READY_FOR_HANDOFF`.
- Candidate-ID vigente: `1ffbd50 + FE-002-d5977bcf5fc6`.
- Referencia visual única vigente: `../../../../docs/frontendMockups/FE-002-password-recovery-states-v3.html` (Desarrollo puede abrirla completa exactamente una vez por `frontend-mockup-guidance`; referencias FE-002 anteriores quedan obsoletas).
- Predecesoras: `BE-006`, `EN-013` y `EN-017` tienen DoF `PASS`; contratos listos.

## Alcance primario FE-002

Implementar rutas reales de solicitud y restablecimiento, conectadas a `POST /auth/password-recovery-requests` y `POST /auth/password-resets`. La solicitud válida confirma de forma neutral sin revelar existencia de cuenta. Cubrir solicitud inicial, validación, carga sin doble envío, error temporal, cooldown `429`, indisponibilidad `503` y confirmación; además reset inicial/listo, validación, carga, error, éxito y token vencido, inválido o usado. Los estados provienen de router, respuesta API y estado de aplicación; nunca del query param del mockup.

Contrato afectado: recuperación recibe `email` válido de máximo 254 caracteres y responde `202` con `{ accepted: true }`; reset recibe token opaco de 43 caracteres y `newPassword` de 8 a 72 bytes UTF-8. Reset exitoso responde `204`. Mapear `PASSWORD_RESET_TOKEN_EXPIRED`/`410` a vencido; `PASSWORD_RESET_TOKEN_INVALID`/`400` a inválido o ya utilizado sin afirmar cuál cuando el contrato no lo distingue; `PASSWORD_POLICY_VIOLATION`/`422` a rechazo de política; `AUTH_RATE_LIMITED`/`429` a cooldown; `AUTH_RATE_LIMIT_UNAVAILABLE`/`503` a servicio no disponible. No inventar una señal pública específica para token usado.

Requisitos: TypeScript estricto, rutas/páginas como composición, llamadas API fuera de componentes presentacionales, token solo en memoria/URL durante consumo y nunca en almacenamiento persistente o logs. Propagar encabezados `X-Auth-Client: WEB` y `X-Client-Instance-Id` conforme patrón existente. No registrar correo, contraseña, token ni datos personales. Mantener etiquetas, foco, teclado, regiones vivas y diseño responsive. Navegar mediante router real; limpiar campos y estado sensible tras éxito o salida.

## Alcance visual secundario FE-001

Alinear solo shell exterior con FE-002: fondo/composición de página, área decorativa y de marca, presentación del panel, espaciado, proporciones, responsive y tokens fuera de zonas protegidas.

Zonas FE-001 protegidas, sin cambios: formulario completo; campos, etiquetas, validación, botones, enlaces, texto y comportamiento; popups, modales, overlays, alertas, toasts y estilos; estados de carga, validación, error de autenticación y sesión inválida; lógica de autenticación, routing, permisos, llamadas API y pruebas ajenas al shell.

## Controles previos de seguridad

1. Respuesta visible neutral para cuenta existente e inexistente; sin diferencias introducidas por Frontend.
2. Token ausente de logs, almacenamiento persistente, mensajes visibles y navegación posterior al éxito.
3. `429` bloquea duplicados durante cooldown; `503` falla cerrado con mensaje recuperable y sin confirmación falsa.
4. Token inválido/usado comparte semántica pública contractual; vencido usa estado diferenciado permitido.
5. Éxito limpia contraseña, confirmación, token y estado del flujo; no altera sesión existente fuera de lo que autoriza Backend.

Puertos alcanzables: `apiRequest`, History API/router local y almacenamiento ya existente solo para `X-Client-Instance-Id`; sin analytics, consola, caché nueva ni otros sinks.

## Rutas y símbolos afectados previstos

- `src/app/App.tsx`, `src/app/navigation.ts`: composición/rutas.
- `src/features/auth/**`: shell compartido FE-001 y nueva capacidad FE-002 por responsabilidad.
- `src/lib/api.ts`: reutilizar transporte, sin cambiar contrato silenciosamente.
- Pruebas focalizadas FE-002 y regresión FE-001 en `src/app/**` o `src/features/auth/**`.
- `src/features/auth/components/LoginForm.tsx`, `AuthErrorDialog.tsx`, `InvalidSessionDialog.tsx`, `hooks/useLoginForm.ts`, `auth.ts`: protegidos salvo integración mínima imprescindible; cualquier cambio exige justificación explícita.

## Verificación requerida a Desarrollo

Pruebas FE-002 focalizadas; regresión FE-001 de formulario, alertas y modal de sesión inválida; `npm run typecheck`; una ejecución equivalente a CI con `npm run lint`, `npm run build` y pruebas aplicables. Resumir comandos/resultados. No modificar mockup, OpenAPI, Backend ni cambios ajenos. No hacer commit.

## Delta visual v3 autorizado vigente

- Estado inicial: candidato anterior con Desarrollo/QA/Seguridad/DoF `PASS`; este ciclo reabre únicamente implementación visual y regresión directa.
- Usar solo `../../../../docs/frontendMockups/FE-002-password-recovery-states-v3.html`. No combinar decisiones visuales de mockups anteriores ni modificar/cargar el HTML v3 en runtime.
- Derivar de v3 todos sus query states e implementar cada presentación: composición desktop/mobile, columnas, `BrandPanel` completo, mapa/capas/rutas/marcadores/glows/pulsos, marca, tipografía, panel derecho, formularios, alertas, status, footer/copyright y modales.
- Mantener `BrandPanel` tipado, presentacional, responsive y compartido solo donde v3 lo exige; conservar icono Lucide de seguridad y nunca restaurar `◌`.
- Mantener `PasswordRecoveryScreen` como composición de layout, formularios, confirmación/éxito, status, diálogo y footer; hooks conservan estado/efectos/timers y servicio conserva HTTP/DTO.
- Preservar sin cambios funcionales: endpoints/payloads, neutralidad, validación, cooldown y aislamiento `429 → retry → 503`, doble envío, interpretación de tokens, token efímero/URL reemplazada/sin persistencia, `SEC-FE002-01`, routing, accesibilidad de diálogo y zonas protegidas FE-001.
- Evidencia visual obligatoria con Playwright existente a 1440×900 y 390×844 para solicitud inicial/validación/carga/error/cooldown/503/confirmación, reset listo/validación/carga/error/éxito y token vencido/inválido/usado. Añadir test renderizado de copyright y regresiones FE-001.
- No repetir integración Backend salvo cambio en API/servicio. Delta sensible inesperado obliga revalidación enfocada; delta estrictamente presentacional permite Seguridad `NOT_APPLICABLE` reutilizando evidencia previa.

## Delta final de Desarrollo

La remediación final alinea copy de solicitud/carga, las cinco reglas visuales de contraseña y el diálogo vencido con la matriz v3. `BrandPanel` conserva capas y geometría previamente comprobadas; no cambia API ni seguridad.

Rutas afectadas: `src/app/App.tsx`, `src/app/navigation.ts`, `src/features/auth/components/BrandPanel.tsx`, `LoginScreen.tsx`, `LoginForm.tsx`, `PasswordRecoveryScreen.tsx`, nuevo componente visual compartido si corresponde, hooks de recuperación/reset, `passwordRecovery.ts`, estilos de login/recuperación y pruebas directas FE-001/FE-002. `LoginForm.tsx` solo puede cambiar el destino accesible de “¿Necesitas ayuda?”; resto del formulario, overlays, autenticación y sesión queda protegido.
