# BE-058 — Revisión final de Seguridad

## Dictamen vigente

- Estado: `PASS`
- Candidate-ID: `HEAD d6c3460b54ef8223531b1672e233ababb95a8424 + test-isolation 329a72f4e739`
- Autorización DoF: SÍ.

### Gate y firma

- `HEAD` coincide.
- Handoff Dev: `READY_FOR_HANDOFF`.
- Handoff QA: `PASS` y mismo `Candidate-ID`.
- Delta BE-058: `CompanyUserControllerTest` y handoffs asociados; sin producción, contratos, migraciones, dependencias ni infraestructura.
- El paquete conserva el candidato pre-Desarrollo. Es una diferencia administrativa no bloqueante porque el candidato vigente queda inequívocamente identificado por Dev, QA y esta revisión.

### Superficie revisada

Aislamiento de autenticación en pruebas: identidad, tenant y rol del `AuthenticatedActor` propagado desde `SecurityContext` mediante `AuthenticationPrincipalArgumentResolver`.

Activos: integridad del actor entregado al caso de uso y confiabilidad de la evidencia de autorización. Actor adverso simulado: una prueba anterior que deja un `SELLER` residual. Límite de confianza: `SecurityContextHolder` compartido por el hilo de pruebas → resolver → controlador → servicio simulado.

### Amenaza y evidencia

- PASS — contaminación entre pruebas: cada prueba instala explícitamente un `COMPANY_ADMIN`; `@AfterEach` elimina el contexto.
- PASS — propagación del actor: `get`, `update`, `status` y `list` verifican el mismo actor configurado; lista conserva filtros y paginación.
- PASS — abuso conocido: QA ejecutó `LogoutControllerTest,CompanyUserControllerTest`, reproduciendo el orden contaminante, con 11/11 pruebas aprobadas.
- Hallazgos abiertos: ninguno.
- FAIL: ninguno.
- NOT_EXECUTED: Maven, Docker, escaneos generales y una nueva reproducción de abuso; no se justifican porque QA ya reprodujo el único abuso relevante y el delta no cambia runtime.

### Controles no aplicables

No cambian autorización o tenant en producción, secretos, PII/ubicación, almacenamiento local, WebSocket, Redis/cache, mensajería, archivos, dependencias ni infraestructura.

### Riesgo residual

Bajo: `LogoutControllerTest` continúa siendo un posible productor de contexto residual para otras pruebas que no se aíslen. No afecta producción ni invalida esta corrección; la suite completa y controles generales permanecen a cargo de CI.
