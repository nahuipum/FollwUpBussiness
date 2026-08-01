# BE-003 — Fase 0 / Ready de implementación

## Estado

`BLOCKED`

## Snapshot revisado

- Worktree: `C:\tmp\field-sales-be003-impl`.
- Rama: `feature/be-003-authenticate`.
- Base solicitada: commit `48ef86f` (EN-012 DoF `PASS`).
- No se modificó código, contratos, migraciones ni configuración durante esta
  fase de análisis.

## Alcance evaluado

`BE-003 — Autenticar usuario` requiere un login seguro y, como mínimo:

| Criterio | Estado de preparación | Evidencia |
|---|---|---|
| CA1: credenciales válidas crean sesión | Preparado en diseño | ADR-008 define JWT RS256, familia y transporte por canal. |
| CA2: usuario o empresa inactiva se rechaza | **Bloqueado** | No existe contrato/puerto de `tenancy` ni fuente de verdad para resolver y validar el estado de la empresa. |
| CA3: error no revela existencia | Preparado en diseño | ADR-008 exige `401 AUTHENTICATION_FAILED` neutral. |
| CA4: sesión asociada a empresa y rol | Bloqueado para cuentas de empresa | El rol se conserva en `identity_access_account`, pero no existe la relación/estado de empresa que permita derivar y verificar el tenant en runtime. |

## Dependencias verificadas

- EN-012 está cerrado en
  `docs/handoffs/governance/EN-012-dof.md`. Su migración V2 crea únicamente
  la cuenta `PLATFORM_SUPERADMIN`, explícitamente sin empresa.
- EN-013 está cerrado en
  `docs/handoffs/governance/EN-013-dof.md`; ADR-008 y
  `docs/api/openapi.yaml` estabilizan el contrato de autenticación.
- ADR-008 resuelve la decisión de RS256: duración, claims, `kid`, secreto fuera
  del repositorio y validación de firma. No es el bloqueo actual.

## Rutas y ownership revisados

- Historia: `docs/stories/backend/BE-003-autenticar-usuario.md`.
- Dominio de autenticación: `backend/followupbussiness/.../identityaccess/`.
- Modelo persistente actual: `backend/followupbussiness/src/main/resources/db/migration/V2__create_identity_access_account_and_bootstrap_audit.sql`.
- Catálogo de roles: `backend/followupbussiness/src/main/resources/db/migration/V1__create_identity_access_role_catalog.sql`.
- Dominio/paquetes reservados para empresas: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/`; no contiene contrato, entidad, adaptador ni migración de empresa.
- El único `company_id` actual es una columna nullable de
  `identity_access_account`; no hay tabla referenciada, FK ni estado de empresa.

## Decisión requerida

Arquitectura/Product Owner debe proporcionar, antes de implementar BE-003, un
contrato público de `tenancy` (puerto de consulta o contrato equivalente) que
permita a `identityaccess` derivar desde la cuenta persistida la empresa y
validar su estado activo en cada login y cada aceptación de access token. Debe
definir además la fuente de verdad, la semántica de estados, la consulta
tenant-bound y la migración/orden de entrega que cree dichas empresas.

No es aceptable para desbloquear BE-003 que `identityaccess` invente una tabla,
un estado de empresa o acceda directamente a una tabla interna futura de
`tenancy`. Tampoco es aceptable declarar como terminado un login exclusivo de
plataforma: dejaría CA2 y CA4 sin implementación para las cuentas de empresa.

## Verificación realizada

- Se leyó la historia BE-003, los AGENTS global/locales, ADR-008, ADR-010,
  OpenAPI `/auth/login` y handoffs EN-012/EN-013 aplicables.
- Se inspeccionó el estado/diff del worktree y los símbolos de
  `identityaccess`, `tenancy`, migraciones, seguridad y DLQ/mensajería.
- `git diff --check` no reportó diferencias en el snapshot revisado.
- La ejecución Maven dirigida no produjo evidencia: `mvnw.cmd` no pudo iniciar
  en el sandbox antes de ejecutar pruebas. No se sustituye por una suite ni se
  usa como evidencia de aprobación.

## Reproducción

```powershell
Set-Location C:\tmp\field-sales-be003-impl
rg -n -C 3 "company_id|company|tenant|estado" backend\followupbussiness\src\main\resources\db\migration backend\followupbussiness\src\main\java\com\nahui\followupbussiness\tenancy
Get-Content -Raw docs\stories\backend\BE-003-autenticar-usuario.md
Get-Content -Raw docs\architecture\adr\ADR-008-autenticacion-sesiones.md
```

## Próximo paso

Registrar el contrato/ADR aplicable de `tenancy` y su dependencia de entrega.
Después, reabrir Fase 0, diseñar el puerto explícito y recién entonces
implementar el login completo junto con pruebas PostgreSQL/Testcontainers,
MockMvc, JWT y autorización runtime.
