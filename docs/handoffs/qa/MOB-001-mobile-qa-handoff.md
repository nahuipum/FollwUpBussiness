# MOB-001 — Handoff QA Mobile

**Estado:** PASS  
**Candidate-ID:** `e887055 + product-status:862bfcbd01d8`

## Revalidación de cierre de seguridad Android

| Criterio | Implementación | Evidencia independiente |
|---|---|---|
| Release no usa firma debug | `buildTypes.release` referencia `signingConfigs.release` | No hay referencia a `signingConfigs.debug`. |
| Credenciales externas | Variables `FUB_RELEASE_*`; alternativa `android/key.properties` | Solo esas fuentes; `key.properties`, `*.keystore` y `*.jks` están ignorados. |
| Fallo seguro sin credenciales | `check(...)` condicionado a tarea release | `assembleRelease --dry-run --offline --no-daemon` falla en configuración con mensaje claro; no genera APK. |
| Debug sin regresión | Configuración debug intacta | `:app:compileDebugJavaWithJavac --stacktrace` → `BUILD SUCCESSFUL` (53 tareas). |

Comandos ejecutados desde `mobile/followupbusiness/android`, con `GRADLE_USER_HOME=C:\Users\LUIS\.gradle` temporal y sin variables `FUB_RELEASE_*`:

- `gradlew.bat :app:compileDebugJavaWithJavac --stacktrace` → PASS.
- `gradlew.bat :app:assembleRelease --dry-run --offline --no-daemon` → fallo esperado: exige las cuatro variables o `android/key.properties` local ignorado.

`git diff --check` PASS (advertencias CRLF ajenas). No hay cambios de UI ni auth. Riesgo no bloqueante: avisos AGP/compileSdk 37 y deprecaciones Kotlin/Gradle; no afectan esta condición. QA funcional anterior continúa PASS.
