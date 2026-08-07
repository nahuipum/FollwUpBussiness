# FE-001 — Revisión de Seguridad

**Candidate-ID:** `HEAD 12dd1eb + diff e82d07dfae52d73092db127b4a5be79610e57848` (coincide con QA).

**Dictamen:** `PASS`

**Superficie revisada:** login WEB, validación de respuesta, access token/CSRF en memoria, cookie refresh implícita, logout compensatorio, marcador local y guardas por rol.

## Modelo de riesgo

- **Activos:** credenciales, tokens, cookie HttpOnly, identidad/roles y separación de rutas.
- **Actores:** usuario legítimo, atacante con respuesta manipulada o estado local controlado y backend de autenticación.
- **Límites:** navegador↔`/auth/*`; respuesta no confiable↔sesión en memoria; `localStorage`↔marcador/UUID no autoritativos.

## Resultado y evidencia

- **PASS — Abuso reproducido:** `200` con rol no contractual tras una posible emisión de cookie. Vitest dirigido: 1 prueba PASS; sin navegación, `hasSession=false`, ruta denegada y segunda petición `POST /auth/logout` con `X-Logout-Intent: PENDING`. El cierre pendiente no incluye access token, CSRF, identificador ni contraseña; tras `204` no queda marcador renovable.
- **PASS — Secretos/PII:** access token y CSRF solo viven en memoria; contraseña se limpia; persistencia limitada a UUID de instancia y booleano no secreto.
- **PASS — Autorización cliente:** correspondencia exacta ruta→rol y denegación cerrada; no se deriva tenant ni autoridad desde entrada del formulario.
- Evidencia QA reutilizada: 9 Vitest, typecheck, lint, build y `git diff --check` — **PASS**.
- Revocación/borrado real de cookie en navegador contra backend — **NOT_EXECUTED**.

**Hallazgos:** ninguno Critical/High/Medium/Low.

**No aplicables:** ubicación, WebSocket, cache/Redis, mensajería, archivos, secretos, pagos e infraestructura. El lockfile raíz de frontend está vacío; no introduce dependencias.

**Riesgos residuales:** la eficacia del `PENDING` depende del contrato backend; `X-Client-Instance-Id` es controlable por cliente y el servidor no debe tratarlo como identidad. El paquete conserva Candidate-ID pre-Desarrollo, advertencia de trazabilidad no decisiva porque QA y esta revisión coinciden.
