# MOB-001 — Seguridad

**Estado:** PASS  
**Candidate-ID:** `e887055 + product-status:862bfcbd01d8`

## Superficie y controles

- **PASS:** Backend exige `BaseRole.SELLER` para `MOBILE` antes de crear familia/JWT; QA Backend verificó 401 neutral, cero familia y cero tokens. Flutter vuelve a exigir canal `MOBILE` y rol exclusivo, como defensa UX sin sustituir autorización.
- **PASS:** Access token queda en memoria; refresh/ticket van a `FlutterSecureStorage`, segregados por empresa/usuario, con limpieza al cambiar alcance o fallar parcialmente. No se hallaron logs/UI con contraseña, token, payload o PII; Backend registra solo resultado, canal y correlationId UUID.
- **PASS:** Recuperación mantiene 202 neutral; token opaco viaja únicamente por notificación Backend al enlace web local. Flutter no tiene ruta/deep link ni API de reset. Reset Backend consume una vez y, dentro de transacción, cambia credencial, revoca todas las sesiones del account/tenant e invalida tokens.
- **PASS:** `git diff --check`.
- **NOT_EXECUTED:** reproducción local única del abuso MOBILE no-SELLER; Maven no pudo crear `C:\.m2\repository`. Se reutiliza evidencia QA PASS del mismo código/caso.

## Hallazgo

- **CERRADO:** release usa exclusivamente `signingConfigs.release`, sin referencia a firma debug. Los cuatro valores se obtienen solo de `FUB_RELEASE_*` o `android/key.properties`, y propiedades/keystores están ignorados. Sin credenciales, release falla antes de generar APK; debug sigue independiente.

No aplican WebSocket, ubicación, archivos, cache/Redis ni pagos. Riesgo residual bajo: falta prueba explícita de consumo concurrente doble del token; el `UPDATE … FOR UPDATE` y la transacción reducen el riesgo.
