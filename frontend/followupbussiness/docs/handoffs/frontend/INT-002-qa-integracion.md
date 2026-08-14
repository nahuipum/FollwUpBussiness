# INT-002 — QA de integración (revalidación tenant)

- **Candidate-ID:** `75ea5ff` (HEAD coincidente).
- **Veredicto:** **PASS**.

| Criterio | Implementación/superficie | Prueba | Evidencia |
|---|---|---|---|
| Sesión y rutas protegidas | `POST /auth/login`, `GET /me` y ruta WEB | Validaciones manuales previas | Login válido autorizado; inválido `401` genérico; sin sesión no muestra dashboard. |
| Restauración | `POST /auth/refresh` con cookie HttpOnly y CSRF | Recarga posterior al login | La sesión se restaura correctamente. |
| Logout y revocación | `POST /auth/logout`, `GET /me`, cookie y estado local | Secuencias manuales A→B y B→A | En ambos sentidos, login `200`, logout `204` y el access token previo en memoria queda rechazado por `/me` (`401`). |
| Aislamiento de tenant y caché | Identidad/empresa de servidor; cookie refresh, CSRF y marcador local | Cambios A→B y B→A controlados | Antes de cada login del tenant opuesto se eliminan cookie refresh, CSRF de `sessionStorage` y marcador local del tenant previo; las identidades y compañías son distintas. La limpieza final queda confirmada tras logout A. |

**Comandos:** `git status --porcelain`; `git rev-parse HEAD`; `git diff --check`. El candidato coincide y `git diff --check` no informa errores; solo existen los artefactos de handoff sin seguimiento.

**Regresión directa:** logout no permite conservar acceso con los tokens revocados de A o B y no restaura la sesión del tenant anterior. Consola sin credenciales ni tokens.

**Hallazgos y riesgos:** ninguno reproducible en el alcance validado. Seguridad es **aplicable** por autenticación, revocación y aislamiento tenant; debe evaluar la nueva evidencia.
