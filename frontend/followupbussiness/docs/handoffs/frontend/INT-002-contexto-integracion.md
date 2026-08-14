# INT-002 — Paquete de contexto de integración

- **Candidate-ID:** `75ea5ff` (árbol Git limpio al inicio).
- **Estado de entrada:** listo para QA de integración; no hay cambios de desarrollo en esta ejecución.
- **Alcance:** autenticación web extremo a extremo: login válido e inválido, acceso y denegación de rutas protegidas, renovación/restauración, logout con revocación y limpieza local, y aislamiento de tenant cuando sea observable con la cuenta autorizada.
- **Contrato:** `docs/api/openapi.yaml`, superficies `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` y `GET /me`. WEB usa cookie refresh HttpOnly, `X-CSRF-Token` y no persiste access/refresh tokens.
- **Servicios requeridos:** frontend web y API local con dependencias de autenticación. La comprobación inicial no detectó un listener en `127.0.0.1:8080`; `GET /actuator/health` no fue accesible. No se inició ni modificó ningún servicio.
- **Credenciales:** existen en el `.env` de raíz y solo se usarán localmente si el entorno queda disponible; quedan prohibidas en salida, artefactos y comandos.
- **Automatización localizada:** no se identificó una prueba E2E/integración específica de login; la única especificación Playwright localizada cubre recuperación de contraseña. Si los servicios están disponibles, realizar validación manual controlada sin almacenar datos sensibles.
- **Invariantes:** sin sesión se deniega el recurso protegido; login válido establece sesión WEB y obtiene identidad autorizada; login inválido es genérico y no filtra datos; refresh rota/restaura mediante cookie+CSRF; logout deja cookie/sesión/caché local sin capacidad de acceder ni renovar; los datos y roles proceden de la identidad/tenant del servidor.
- **Salida esperada de QA:** `PASS`, `CHANGES_REQUIRED` o `BLOCKED`; en caso de bloqueo, detener Seguridad y DoF.

## Delta de revalidación de tenant

- El solicitante confirmó dos identidades autorizadas, una por tenant, en el `.env` raíz. Se leerán solo dentro de la ejecución local, sin exponer valores ni nombres de variables.
- Alcance adicional: comprobar A→B y B→A tras logout, incluida limpieza de estado local, cookie refresh y la imposibilidad de restaurar o acceder con la sesión del tenant anterior.
- Esta evidencia reemplaza el límite de observabilidad anterior y exige QA, Seguridad y DoF de revalidación sobre el mismo Candidate-ID.
- Mapeo autorizado recibido para la ejecución local: las dos parejas de tenant se obtienen de las variables acordadas por el solicitante; sus nombres y valores no se incluirán en nuevos artefactos ni salidas.
