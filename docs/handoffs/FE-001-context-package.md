# Paquete de contexto — FE-001

**Estado:** READY_FOR_HANDOFF — la prueba dirigida final valida semánticamente la cookie de borrado.
**Candidate-ID vigente:** `HEAD 7099a83644a10efd2979626bcb8acfaba9318f29 + worktree-product 6526367c21ecf761c765419888c6a03c80e7ff8cac6003233dc9b670fc17fbfd`
**Firma rápida:** `git status --porcelain` (sin `docs/handoffs/**`) SHA-256 `326f6089cde9ead5ff0ab685feabf2c06aa7e114a00755f55cfdf9972fcec74f`
**Delta de candidato:** reemplaza `abe62489…`: solo `LogoutControllerTest` cambia respecto al candidato previo. La aserción de limpieza de `__Host-fs-refresh` valida nombre/valor vacío, `Path=/`, `Max-Age=0`, `Secure`, `HttpOnly`, `SameSite=Strict` y ausencia de `Domain`, sin depender de orden, case ni de `Expires` adicional del contenedor. La regresión agrupada y la prueba dirigida reejecutada sobre el diff exacto están en PASS.

## Alcance vigente

- HU: `docs/stories/frontend/FE-001-pantalla-de-inicio-de-sesion.md`.
- Referencia base: `docs/frontendMockups/FE-001.html`.
- Referencia vigente de estados: `docs/frontendMockups/FE-001-login-states.html` (`default`, `loading`, `validation`, `auth-error`, `invalid-session`; escritorio y móvil).
- Frontend: `frontend/followupbussiness`; corregir proxy TLS, completar solo estados sustentados por HU/contrato/mockups y validar autenticación, logout, segundo login, accesibilidad y persistencia.
- Backend separado: controladores login/logout/refresh/recuperación/admin inicial, `JdbcLoginAccountQuery`, filtro JWT, configuración Spring Security y pruebas afectadas. Requiere QA Backend independiente tras reinicio/evidencia HTTPS.

## Decisiones y controles

1. `VITE_DEV_API_PROXY_TARGET` admite solo URL HTTPS válida; valor predeterminado `https://localhost:8080`. `/auth`, `/platform` y `/api` comparten el destino. `secure: false` queda únicamente en `server.proxy` de desarrollo y no afecta build/producción.
2. El navegador usa `VITE_API_BASE_URL` HTTPS. Login envía `identifier`, `credentials: include`, `Content-Type`, `X-Auth-Client: WEB` y `X-Client-Instance-Id`.
3. Password, access token, CSRF y roles no se persisten; refresh queda en cookie `Secure; HttpOnly; SameSite=Strict`. Localmente solo pueden persistirse ID de instancia y marcador de logout no sensible.
4. Logout pendiente WEB usa cookie, `X-Logout-Intent: PENDING` y origen permitido; un 401 no puede crear bucle ni bloquear el login siguiente.
5. El mockup de estados define indicador de carga con spinner/progreso, validación inline, alerta genérica y modal de sesión inválida. No define UI contractual distinta para 400/401/429/503, logout o éxito: usar semántica existente de HU/OpenAPI sin inventar popups o transiciones.

## Evidencia y gates

- Remediación Backend: `SecurityConfigurationTest` aporta mocks explícitos de `JdbcTemplate`, `PlatformTransactionManager` y los casos de uso HTTP que fabricaban transacciones sin `DataSource`; no cambió producción. Desarrollo reejecutó `mvn -q '-Dtest=SecurityConfigurationTest' test`: `PASS`. QA debe revalidar ambos conjuntos sobre `11583f20…`.
- QA Backend final: `PASS` sobre `11583f20…`; `SecurityConfigurationTest` (31 casos) y el conjunto dirigido de login/logout/refresh/JWT/JDBC/servicio pasaron con el repositorio Maven real.
- Delta Backend 2026-08-08: un `GET /platform/companies` con JWT válido no llega a un handler (la ruta solo declara `POST`/`PATCH`), genera 404 y el `ERROR` dispatch reingresaba protegido, produciendo el 401 del entry point. `DispatcherType.ERROR` queda permitido; la prueba de Tomcat aislada obtiene 404 autenticado y 401 sin Bearer. Requiere QA Backend y reinicio de la JVM HTTPS para reproducir contra instancia real.
- Gate Frontend a resolver por QA: el handoff Dev conserva `45a095c8…`; el candidato actual incorpora 15 no rastreados más que el cierre `177c0c7a…`, incluidos componentes/hooks/estilos Frontend y el mockup `FE-001-login-states-v2.html`. No se atribuye aprobación de Desarrollo a ese delta.
- QA Frontend: `BLOCKED`; no ejecutó pruebas, build ni E2E porque el handoff Dev no corresponde a `11583f20…`. Seguridad y DoF no están autorizados. Cierre: atribuir el delta Frontend completo en el handoff Dev sin cambiar producción; si cambia código o pruebas, recalcular candidato.

- OpenAPI: `docs/api/openapi.yaml`, rutas `/auth/login`, `/auth/logout`, `/auth/refresh`, `LoginRequest.identifier` y headers WEB.
- Desarrollo Frontend debe ejecutar las pruebas dirigidas indicadas y `npm run build`, y reemplazar el Candidate-ID tras su última modificación incluyendo archivos no rastreados.
- QA Backend, QA Frontend y Seguridad deben compartir exactamente el Candidate-ID final. DoF solo procede con sus estados autorizantes.
- Flujo real requiere entorno TLS y cuenta WEB autorizada; no inventar ni registrar credenciales. Si no está disponible, registrar la evidencia faltante y su impacto.

## Inventario del candidato

- Frontend FE-001: `App*`, `auth*`, `global.css`, `vite.config*`, `.env.example`, `src/lib/*`, `LoginScreen.test.tsx`, componentes/hooks/estilos de login, navegación, estado de sesión, modal compartido y mockup `FE-001-login-states.html`.
- Backend autenticación: controladores de login/logout/refresh/recuperación/admin inicial, `InboundJwtAuthenticationFilter`, `JdbcLoginAccountQuery`, `SecurityConfigurationTest` y pruebas JWT/JDBC.
- Infraestructura/configuración necesaria por verificar: `.env.example`, `application.yaml`, `docker-compose.yml`, V23, `docs/development/local-https.md` y `infrastructure/postgres/provision-audit-roles.sh`; configuraciones de auditoría, tenancy y notificaciones afectadas por wiring.
- Fuera del alcance de QA FE-001: `CompanyUserController`, `CompanyUserService` y `docs/frontendMockups/FE-001-login-states-v2.html`; permanecen dentro de la firma y deben separarse o justificarse antes de release.
- IDE: el cambio real es `backend/.idea/compiler.xml` (no existe la ruta indicada `backend/followupbussiness/.idea/compiler.xml`); debe quedar fuera de cualquier commit salvo justificación funcional explícita.

## No rastreados incluidos

Backend/infra: V23, `InboundJwtAuthenticationFilterTest`, `JdbcLoginAccountQueryTest`, guía HTTPS y script de roles. Frontend: ambos mockups de estados, `.env.example`, `LoginScreen.test.tsx`, `auth.test.ts`, `src/lib/*`, `vite.config.test.ts` y todos los componentes/hooks/estilos/navegación compartidos listados por `git ls-files --others --exclude-standard` (27 rutas en total).
