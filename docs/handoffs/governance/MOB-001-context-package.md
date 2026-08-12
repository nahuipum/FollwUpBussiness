# MOB-001 — Paquete de contexto

**Estado:** READY_FOR_DOF  
**Candidate-ID:** `e887055 + product-status:862bfcbd01d8`  
**Alcance:** Backend `MOBILE` solo para roles exclusivamente `SELLER`; Flutter conecta login, recuperación y restablecimiento sin variación visual.

## Criterios y decisiones

- `POST /auth/login` envía `X-Auth-Client: MOBILE` y `X-Client-Instance-Id` estable. Backend rechaza cualquier rol no exclusivamente `SELLER` con `401 AUTHENTICATION_FAILED`, antes de familia/tokens.
- Flutter valida respuesta completa y `channel: MOBILE`; su comprobación de rol es defensa UX, nunca autorización. `SELLER` navega solo a pantalla con texto `SELLER`.
- Access token queda en memoria; únicamente refresh token y ticket se almacenan con secure storage, segregados por usuario y empresa. Cualquier cambio o persistencia parcial limpia sesión/caché.
- Recuperación es neutral (`202`); backend/notificaciones entrega correo. Reset consume un token de enlace seguro existente, una vez, y revoca sesiones. Si no existe configuración de enlace, se bloquea esa integración sin inventar URL/deep link.
- Prohibido registrar secretos, PII o payloads. Se conserva exclusivamente correlationId técnico.

## Invariantes de control

1. Actor/recurso: cuenta autenticable y canal móvil; solo `roles == {SELLER}` obtiene sesión.
2. Éxito: credenciales/canal/respuesta válidos; no hay doble envío.
3. Denegación: demás roles, canal/respuesta incompletos y credenciales inválidas no dejan tokens, familia, caché ni navegación.
4. Fallo: storage/API/recovery/reset limpian parciales y presentan estado existente neutral.
5. Tenant: usuario o empresa nueva invalida antes el estado local anterior.

## Superficies y evidencia esperada

- Backend: `LoginService` y pruebas de no emisión/no familia; contrato OpenAPI.
- Mobile: `mobile/followupbusiness/lib/features/auth/**` y pruebas; mockup inmutable `docs/mobileMockups/MOB-001-mobile-auth-mockups.html`.
- Validación: pruebas enfocadas backend; `flutter analyze` y pruebas enfocadas mobile. QA cubre un negativo por superficie. Seguridad revisa emisión, logs/storage, enumeración y revocación.

## Estado inicial

El árbol ya contiene cambios no confirmados del usuario, incluidos backend y una migración de carpeta Flutter. Se preservan; los revisores compararán Candidate-ID y `git status --porcelain`.

## Resultado de Desarrollo

- Backend: `READY_FOR_HANDOFF`; pruebas `LoginServiceTest,LoginControllerTest` PASS. La restricción se aplica antes de crear la familia de sesión.
- Mobile: `API_BASE_URL` ya se inyecta desde `.vscode/launch.json` por `--dart-define`, y `flutter analyze`/`flutter test` PASS. La integración no puede declararse lista: sigue sin existir una configuración ya aprobada de enlace seguro/deep link que entregue el token de reset. No se inventó URL ni esquema.
- Transición: ambos desarrollos están `READY_FOR_HANDOFF`; QA independiente puede iniciar.

## Delta de decisión local

Para entorno local queda aprobado el enlace de recuperación web `http://localhost:5173/password-reset?token=...`. El backend/notificaciones debe entregarlo conforme a su configuración local; Flutter no recibe ni persiste el token y no se crea deep link temporal. El navegador ejecuta el reset y el usuario vuelve a iniciar sesión desde Flutter. Desarrollo debe verificar esta ruta sin modificar la presentación móvil; el bloqueo previo de enlace móvil queda sustituido por esta decisión limitada a local.

## Cierre de Desarrollo

- Mobile: `READY_FOR_HANDOFF`; retiró reset del contrato interno móvil. `flutter analyze` y `flutter test` (5) PASS; presentación sin modificaciones.
- Backend: `READY_FOR_HANDOFF`; SMTP ya entrega el enlace web local y se añadió cobertura del correo. `PasswordRecoveryServiceTest`, `IdentityNotificationDeliveryWorkerTest` y `SmtpTransactionalEmailGatewayTest` PASS. El enlace local solo es válido para desarrollo.

## QA

- Backend: PASS. Confirmó denegación MOBILE sin tokens/familia, `SELLER` válido, recuperación neutral, correo backend y revocación de sesiones. Riesgo bajo: falta prueba explícita de doble consumo concurrente.
- Mobile: PASS. `flutter analyze` sin incidencias; pruebas dirigidas HTTP/storage/widget: 11 PASS; `git diff --check` PASS. Confirmó reset web local sin deep link ni token Flutter y presentación inalterada.
- Transición: QA Backend y Mobile PASS; Seguridad aplicable puede iniciar. DoF espera Seguridad PASS.

## Delta Android

- Se cambió exclusivamente `android/app/build.gradle.kts` a `compileSdk = 37` por requisito de `flutter_secure_storage`.
- Desarrollo Mobile verificó que no altera UI, autenticación, rutas, contratos ni límites de SDK; `:app:compileDebugJavaWithJavac --stacktrace` terminó `BUILD SUCCESSFUL` usando la caché Gradle local.
- QA Mobile revalida esta corrección de infraestructura y conserva el bloqueo previo de análisis/pruebas solo si no puede reproducir una ejecución independiente.

## Seguridad

**Estado:** CHANGES_REQUIRED. Controles de autenticación, secretos, almacenamiento seguro, recuperación neutral, reset web y revocación: PASS. Hallazgo alto: `buildTypes.release` usa `signingConfigs.debug`, permitiendo que la identidad distribuida pueda ser replicada con la clave de desarrollo. Cierre requerido: firma release con clave protegida externa al repositorio y fallo del build si falta; verificar certificado no-debug. Se remite únicamente a Desarrollo Mobile. La reproducción Maven de abuso no se ejecutó porque el entorno no pudo crear `C:\.m2\repository`; se reutilizó QA Backend PASS.

## Revalidación de Seguridad

**PASS.** El hallazgo de firma está cerrado: release usa exclusivamente `signingConfigs.release`; los cuatro valores provienen de `FUB_RELEASE_*` o `android/key.properties` ignorado; no hay referencia a firma debug. QA confirmó que release sin credenciales falla en configuración sin APK y debug compila independiente. `git diff --check` PASS. Ningún control sensible restante cambió.

## Delta de Candidate

El Candidate se fija sobre el estado de producto (`git status --porcelain` excluyendo únicamente `docs/handoffs/**` generados por las puertas). Los artefactos de flujo no cambian código, contrato ni superficie sensible y no invalidan las validaciones ya registradas.
