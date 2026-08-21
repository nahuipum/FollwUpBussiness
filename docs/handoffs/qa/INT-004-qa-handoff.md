# INT-004 — QA independiente

Estado: `PASS`
Candidate-ID: `d2f2a26 + INT-004:c584aaebb2c3`.

## Mapeo y evidencia

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| Alta consistente | `SellerService` audita `INVITED`, igual al vendedor/cuenta. | `SellerCreationTransactionIntegrationTest`: vendedor `INVITED`, rol `SELLER`, tenant y auditoría `INVITED`. |
| Activación y login móvil | Integración de recuperación y `LoginService`. | La misma prueba activa vendedor/cuenta y crea sesión `MOBILE` en el tenant correcto. |
| Rechazo móvil seguro | `parseSeller` exige usuario y empresa `ACTIVE`. | `auth_http_repository_test`: `INVITED`/`INACTIVE` de usuario y empresa inactiva devuelven fallo neutral sin `replaceSession`; el retorno previo al coordinador impide navegación. |

## Ejecución

Entorno: Windows, Flutter/Dart local; Java/Maven con Docker Desktop, PostgreSQL/Testcontainers.

- `flutter test test/auth_http_repository_test.dart test/auth_session_test.dart` — PASS.
- `mvn -q "-Dtest=SellerCreationTransactionIntegrationTest,SellerServiceTest" test` — PASS.
- `git diff --check` sobre los cuatro archivos del candidato — PASS.

No hay hallazgos reproducibles. Regresión directa: respuesta `MOBILE` activa conserva persistencia; estados no activos no persisten ni navegan. No se atribuyen al candidato los cambios de splash/UI (`android/`, `ios/`, `lib/app/`, coordinador, widgets y sus pruebas), presentes separadamente en `git status`.

## Delta de revalidación

- `SellerCreationTransactionIntegrationTest` confirma que inactivar revoca la familia de sesión e invalida tokens de acción; el siguiente login `MOBILE` falla.
- `SellerStatusServiceTest` conserva denegaciones/conflictos con dobles de usuario válidos.
- `mvn -q "-Dtest=SellerStatusServiceTest,SellerCreationTransactionIntegrationTest" test` y `git diff --check` — PASS.

Riesgo residual: depende de que login/refresh entregue ambos estados; ausencia o valor distinto se rechaza de forma segura. GPS, tracking, cola offline, reintentos, reinicio, almacenamiento seguro y segregación local no cambian en este candidato; la sesión existente sigue cubierta por `auth_session_test`.
