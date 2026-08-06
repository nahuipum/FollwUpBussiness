# Preflight de Seguridad — BE-001 — Crear una empresa

## Identidad, entradas y estado

- **HU:** `BE-001 — Crear una empresa`.
- **Fase/tipo:** `PREFLIGHT` de Seguridad.
- **Estado:** `ADVISORY`.
- **Paquete de entrada:** `docs/handoffs/governance/BE-001-context-package.md`, revisión efectiva `2` (registro append-only y gate vigente).
- **Huella del paquete revisado:** SHA-256 `bb9d94d2db073706d19498ad889179d72ca521120fc56ac0334524ca62d5a434`.
- **Baseline pre-desarrollo:** `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`.
- **Diff funcional y staging:** vacíos (`PASS`), esperado en preflight.
- **Implementación, pruebas y escáneres:** `NOT_EXECUTED`; no existe candidato de implementación.

Este informe corresponde exclusivamente a la baseline pre-desarrollo. Sus controles deberán trazarse y revalidarse contra el candidato de implementación que se fije después de Desarrollo y antes de QA; solo se actualizan si ese candidato cambia la superficie de riesgo.

## Triage y modelo de riesgo

**Triage:** `APLICA`. La superficie incorpora autorización privilegiada, creación del límite de tenant, aislamiento multiempresa, configuración relacionada con ubicación y auditoría crítica.

| Elemento | Contexto |
|---|---|
| Activos | Privilegio `PLATFORM_SUPERADMIN`; empresa, UUID, código, estado y configuración; límite de aislamiento; geocerca/tracking/retención; auditoría durable y `correlationId`. |
| Actores | Superadministrador legítimo; usuario empresarial o actor sin privilegio; actor anónimo o revocado; cliente que manipula payload/contexto/rol; clientes concurrentes o que repiten solicitudes. |
| Límite de confianza | `cliente no confiable → autenticación/autorización → caso de uso → persistencia empresa/configuración + auditoría transaccional → respuesta y telemetría saneada`. |

El payload no puede cruzar el límite como fuente de UUID, tenant, rol, actor, estado o timestamps.

## Matriz de controles de diseño

| Control | Riesgo | Implementación exigida | Prueba de abuso obligatoria | Criterio observable |
|---|---|---|---|---|
| `SEC-BE001-01` | Escalamiento o creación por actor no autorizado | Exigir identidad vigente de plataforma, rol persistido exacto `PLATFORM_SUPERADMIN` y `tenantId/companyId == null`. Autorizar en endpoint y nuevamente en caso de uso. | Anónimo, sesión revocada, rol empresarial/`COMPANY_ADMIN`, rol manipulado y supuesto superadmin con tenant no nulo. | `401/403` neutral; cero empresas/configuraciones creadas. |
| `SEC-BE001-02` | Mass assignment, tenant injection o contaminación cruzada | DTO cerrado. UUID, empresa propietaria, estado, rol, actor y timestamps se generan o derivan en servidor. Rechazar propiedades adicionales y no confiar en headers de tenant. Empresa y configuración persisten con la misma identidad generada. | Enviar `id`, `tenantId`, `companyId`, `role`, `status`, actor o propiedades anidadas adicionales; intentar imponer tenant por header. | `400/422`; cero escritura. En éxito, UUID/estado/propiedad proceden del servidor y `Location` referencia ese UUID. |
| `SEC-BE001-03` | Duplicación por replay, TOCTOU o carrera | Proteger UUID y clave de negocio mediante restricción durable y una única transacción. La comprobación previa no sustituye la restricción. No inventar cabecera de idempotencia fuera del contrato. | Repetición secuencial y solicitudes concurrentes con misma intención; payload distinto que colisiona con misma identidad de negocio. | Exactamente una empresa y una configuración. Perdedoras reciben `409` con correlación; la ganadora no se sobrescribe. |
| `SEC-BE001-04` | Configuración inválida que debilita privacidad o tracking | Validación cerrada y atómica: zona horaria válida conforme a contrato, moneda admitida, radio exacto `100 m`, frecuencia exacta `60 s`; retención de ubicación `90 días` no configurable por cliente. | Zona inexistente, nulos/campos omitidos, propiedades extra, valores negativos/extremos y radio/frecuencia distintos de `100/60`. | `400/422` neutral y ninguna empresa/configuración parcial persistida. |
| `SEC-BE001-05` | Creación crítica sin trazabilidad o auditoría inconsistente | Consumir puerto público de `audit`. Actor, hora, acción, resultado, recurso y correlación proceden de fuentes confiables. Creación y auditoría confirman o revierten juntas; intentos que alcanzan el caso de uso registran resultado durable. | Forzar fallo del adaptador de auditoría durante creación y conflicto; inspeccionar éxito, rechazo y repetición. | Fallo de auditoría revierte creación. Cada resultado exigible deja un único registro mínimo, sin payload, token, headers ni PII completa. |
| `SEC-BE001-06` | Enumeración, log injection o fuga de datos sensibles | Generar o validar longitud/formato de `correlationId`; devolverlo en éxito y errores, incluido `409`. Usar errores neutrales y telemetría estructurada con vocabulario controlado. No registrar cuerpo, credenciales, cabeceras, coordenadas ni configuración completa. | Correlación con CR/LF o longitud extrema y centinelas sensibles en payload; provocar `400`, `401`, `403`, `409` y `422`. | Cada respuesta contiene correlación segura. Errores y logs no revelan existencia/datos de otra empresa ni centinelas, tokens o payload. |

**Estado de `SEC-BE001-01..06`:** `NOT_EXECUTED`. Son requisitos para Desarrollo y QA; este preflight no aprueba código.

## Controles no aplicables a esta baseline

- WebSocket, Redis/cache, RabbitMQ, archivos y exportaciones: `NOT_APPLICABLE` mientras el candidato no los modifique.
- Almacenamiento local/mobile: `NOT_APPLICABLE`.
- Dependencias, secretos e infraestructura: `NOT_APPLICABLE`; no existe diff que justifique SCA o escaneo general.
- Procesamiento de muestras de geolocalización: no cambia; aplican únicamente constantes de configuración y retención.
- Autenticación no se rediseña, pero su principal persistido es dependencia obligatoria de `SEC-BE001-01`.

Si el candidato posterior incorpora estas superficies, el Orquestador amplía únicamente los controles afectados.

## Hallazgos y riesgo residual

- `GOV-BE001-01` — **Baja:** el encabezado del paquete dice «revisión 1», mientras su registro append-only y gate vigente declaran revisión 2. Debe reconciliarse antes del siguiente gate para evitar trazabilidad ambigua.
- No hay hallazgos de implementación: todavía no existe candidato.
- Riesgo residual hasta demostrar autorización en profundidad, restricción concurrente durable y atomicidad real con auditoría.
- Desarrollo y QA deberán reportar evidencia por cada `SEC-BE001-*` sobre el mismo candidato fijado.

Este `ADVISORY` no autoriza QA, Seguridad final, DoF ni liberación.

## Revalidación append-only — Precheck ADR-022 — 2026-08-05

**Estado:** `ADVISORY`.

- **Paquete revisado:** `docs/handoffs/governance/BE-001-context-package.md`, revisión vigente `5`, SHA-256 `441e1d2e8d814f8a3d9aa1ec796636858f7068dd2a2c8af169b6114e9f7bae06`.
- **ADR revisado:** `docs/architecture/adr/ADR-022-auditoria-transaccional-creacion-empresa-plataforma.md`, SHA-256 `2532147205a95e909eb438729103d822b944a6812b946aea64afe05390d7c45e`.
- **Baseline pre-desarrollo:** `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging y diff funcional vacíos.
- **Implementación, pruebas y escáneres:** `NOT_EXECUTED`; no existe candidato de implementación.

ADR-022 resuelve el bloqueo **arquitectónico** de `SEC-BE001-05`: define el
puerto específico, contexto confiable, vocabularios cerrados, invariante
`scope`/`tenantId` y transacción compartida. No aprueba implementación; los
controles de esta sección deberán trazarse al candidato posterior.

| Control | Amenaza y exigencia de diseño | Abuso obligatorio | Criterio observable en el candidato |
|---|---|---|---|
| `SEC-BE001-05` revisado | Confused deputy, mass assignment o bypass interdominio. `tenancy` consume exclusivamente `RecordPlatformCompanyAuditUseCase`; el comando contiene solo `resourceId` generado por servidor y resultado cerrado. Se prohíben actor, rol, tenant, tiempo, correlación, headers, payload, secretos o PII de entrada; tampoco imports de `audit.adapter..` ni acceso a tablas. Recurso/acción exactos `COMPANY`/`CRITICAL_MUTATION`. | Verificar contrato público y frontera arquitectónica; intentar introducir contexto no confiable o usar adaptadores/tablas internos; inspeccionar éxito, rechazo y repetición con centinelas sensibles. | Única vía interdominio por puerto específico; registro mínimo saneado y sin datos prohibidos; bypass impedido por arquitectura. |
| `SEC-BE001-07` nuevo | Suplantación de contexto y contaminación de scope. `audit` deriva y valida principal persistido vigente, rol exacto `PLATFORM_SUPERADMIN`, hora y correlación de servidor. Invariante de dominio y persistencia: solo `PLATFORM + tenantId null`; rechazar `PLATFORM + tenantId no nulo` y todo scope no plataforma con tenant nulo. | Actor ausente/revocado, rol empresarial/manipulado, superadmin con tenant; matriz `scope`/`tenantId`, incluida escritura directa inválida y migración con auditorías tenant existentes. | Contexto inválido falla cerrado y no deja empresa/configuración/auditoría parcial. La base rechaza combinaciones inválidas y conserva auditorías tenant válidas. |
| `SEC-BE001-08` nuevo | Transacción dividida, estado parcial o privilegios excesivos. El escritor crítico usa exactamente el mismo `DataSource` y `PlatformTransactionManager` que `tenancy`, participa en la transacción existente y no abre `REQUIRES_NEW`; empresa, configuración y auditoría confirman o revierten juntas. El purgador permanece separado. | Fallo de auditoría después de iniciar empresa/configuración; fallo de empresa o configuración; conflicto/replay concurrente; wiring hacia otro transaction manager; intento de `UPDATE`/`DELETE` con escritor crítico. | Cero estados parciales; fallo de auditoría revierte empresa/configuración; no hay éxito sobre mutación revertida; rechazos exigibles no duplican empresa; privilegios destructivos denegados. |

`SEC-BE001-01..04,06` se reutilizan sin cambios y continúan `NOT_EXECUTED`.
WebSocket, Redis/cache, RabbitMQ, archivos, mobile/local storage, muestras de
geolocalización, dependencias, secretos, CI/CD y escaneos generales siguen
`NOT_APPLICABLE` para esta baseline.

**Riesgo residual:** wiring transaccional, propagación, migración/restricción,
compatibilidad de auditorías tenant, privilegios del escritor y conflictos
durables solo podrán verificarse sobre el candidato de implementación. No hay
hallazgos de diseño bloqueantes. Este `ADVISORY` no autoriza Desarrollo, QA,
Seguridad final, DoF ni liberación por sí mismo.

## Revalidación append-only — Preflight de remediación de Seguridad — 2026-08-05

**Estado:** `ADVISORY`.

- **Paquete revisado:** `docs/handoffs/governance/BE-001-context-package.md`,
  revisión vigente `8`, SHA-256
  `c3c56a41865a6a80df5a8264b083d7f21bd792056bc6a8a0d73d7ad5b5701e3f`.
- **Revisión final que activa la remediación:**
  `docs/handoffs/security/BE-001-security-review.md`, estado `BLOCKED`, SHA-256
  `977dadd30ec888adaeaa3efaafb2087d8c97481d2833d03de1814ed14134610d`;
  hallazgos abiertos `SEC-BE001-F01` (`HIGH`) y `SEC-BE001-F02` (`MEDIUM`).
- **Preflight canónico previo a esta sección:** SHA-256
  `802a1683ec9a4af2c2641918200be32620a6cd81a96df384700439514cbb1b92`.
- **Candidato de referencia, no inspeccionado en este preflight:** HEAD
  `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; manifiesto Backend de 28 rutas
  SHA-256 `6a42c21d1dcfdacbb1d79c3de22e79215fa39846bb6ea4b436a9f753670bee5e`.
- **Implementación, pruebas, Desarrollo, QA, Seguridad final, DoF y
  escáneres:** `NOT_EXECUTED`.

### Triage y modelo de riesgo acotado

**Triage:** `APLICA`. La remediación cambia auditoría crítica, la compatibilidad
de la migración V14, sesiones y logout de plataforma, límites de tenant y
comportamiento transaccional. Son superficies de autenticación/autorización,
multiempresa y auditoría definidas por el flujo de Seguridad.

| Elemento | Contexto de remediación |
|---|---|
| Activos | Sesión y familia revocable de `PLATFORM_SUPERADMIN`; capacidad de logout/refresh; evidencia append-only; disponibilidad de migración; límite `scope`/`tenantId`; trazabilidad de rechazos privilegiados. |
| Actores | Superadministrador legítimo sin tenant; usuario empresarial con tenant; principal inconsistente que combina autoridad de plataforma y tenant; cliente que intenta contaminar tenant/correlación; operador que actualiza V13→V14. |
| Límites de confianza | Principal/sesión persistidos → autorización/caso de uso → revocación o rotación → auditoría crítica → PostgreSQL y restricción V14; y cliente no confiable → frontera web → rechazo tenant-bound dentro del caso de uso → auditoría saneada. |
| Abusos | Mantener utilizable una sesión privilegiada porque el `INSERT` de auditoría revierte el logout; bloquear el despliegue con evidencia histórica tenantless; ampliar `tenant_id IS NULL` hasta aceptar combinaciones arbitrarias; inyectar tenant en una auditoría de rechazo; negar repetidamente sin dejar evidencia durable; dejar estado parcial ante fallo transaccional. |

### Vigencia exacta de los controles previos

No se retira ningún ID ni se crea una matriz paralela. A partir de esta sección,
la siguiente tabla determina el texto vigente para la remediación:

| Control previo | Tratamiento | Vigencia y evidencia |
|---|---|---|
| `SEC-BE001-01` | **Vigente sin cambios** | Se reutiliza su diseño y evidencia previa de autorización salvo el escenario tenant-bound que ya alcanzó el caso de uso; la trazabilidad durable de ese rechazo se valida bajo `SEC-BE001-05`. |
| `SEC-BE001-02` | **Vigente sin cambios** | Se reutiliza completo; la remediación no autoriza actor, rol, tenant, scope ni datos de auditoría provenientes del cliente. |
| `SEC-BE001-03` | **Ampliado en evidencia** | Conserva su texto de unicidad/replay y añade la prueba de carrera real descrita abajo. Su conclusión previa no basta para cerrar esa carrera. |
| `SEC-BE001-04` | **Vigente sin cambios** | Se reutiliza completo; no cambia configuración, privacidad ni tracking. |
| `SEC-BE001-05` | **Ampliado** | Conserva puerto público, minimización y auditabilidad de resultados; añade auditoría durable y saneada del rechazo tenant-bound dentro del caso de uso y los escenarios de sesión de plataforma. |
| `SEC-BE001-06` | **Vigente sin cambios** | Se reutilizan normalización única de correlación, respuestas neutrales y ausencia de secretos/PII; toda nueva evidencia debe conservar estas propiedades. |
| `SEC-BE001-07` | **Sustituido** | Se sustituye únicamente su matriz absoluta «solo `PLATFORM` admite `tenantId null`». Rige la matriz cerrada compatible con autenticación tenantless definida abajo; no se reutiliza la conclusión previa sobre V14. |
| `SEC-BE001-08` | **Ampliado** | Su parte de creación empresa/configuración/auditoría sigue vigente; se amplía a seguridad transaccional de revocación/rotación y auditoría de sesiones de plataforma. |

### Matriz vigente de controles de remediación

| Control | Amenaza e implementación exigida | Prueba de abuso obligatoria | Criterio observable |
|---|---|---|---|
| `SEC-BE001-03` ampliado | Carrera real que duplique empresa/configuración o produzca resultados de auditoría incoherentes. La unicidad durable y la transacción siguen siendo la autoridad; una comprobación previa o una prueba secuencial no bastan. | Lanzar al menos dos creaciones simultáneas reales del mismo `code`, con conexiones/transacciones independientes y PostgreSQL, no mocks. | Exactamente una empresa y una configuración; un único ganador; perdedoras con `409` neutral y correlación segura; ningún estado parcial ni sobrescritura. |
| `SEC-BE001-05` ampliado | Pérdida de trazabilidad o tenant injection al denegar un principal que combina autoridad `PLATFORM_SUPERADMIN` y `tenantId` no nulo. El rechazo decidido dentro del caso de uso debe usar un puerto público de auditoría y contexto derivado de fuentes persistidas/confiables. La evidencia usa acción/recurso/resultado cerrados, no convierte el tenant presentado en scope auditado y no acepta actor, rol, tenant, tiempo, headers, payload, token ni PII completa desde el cliente. | Presentar el principal inconsistente que supera la regla web y es rechazado por el caso de uso; incluir tenant y centinelas sensibles manipulados; repetir el intento y forzar fallo del escritor de auditoría. | Sin empresa/configuración; respuesta `403` neutral cuando la auditoría está disponible; exactamente una evidencia durable `REJECTED` mínima y saneada por intento exigible, con correlación segura y sin el tenant contaminante. Si la auditoría falla, nunca hay `2xx`, mutación ni bypass, y el fallo no se disfraza como rechazo auditado. |
| `SEC-BE001-07` sustituto | Constraint demasiado estrecho que rompe auditoría tenantless o demasiado amplio que permite contaminación. V14 debe expresar una matriz cerrada: `PLATFORM` solo con `tenantId null`; auditoría de autenticación/sesión de plataforma puede usar `ANONYMOUS_AUTH` con tenant nulo únicamente cuando actor y sesión de plataforma se derivan en servidor; scopes tenant-bound exigen tenant no nulo. Cualquier otra combinación falla cerrada. La migración debe aceptar evidencia histórica legítima sin relajar genéricamente el `NULL`. | Upgrade PostgreSQL V13→V14 con evidencia histórica `ANONYMOUS_AUTH + tenant_id NULL`; instalación limpia; escrituras directas `PLATFORM + tenant`, scope tenant-bound sin tenant y scope desconocido; refresh/logout de `PLATFORM_SUPERADMIN` con `company_id NULL`. | Upgrade e instalación limpia completan; evidencia histórica legítima se conserva; combinaciones inválidas son rechazadas por dominio y base; refresh/logout tenantless producen auditoría con vocabulario cerrado sin fabricar tenant ni aceptar uno del cliente. |
| `SEC-BE001-08` ampliado | Acoplamiento transaccional que resucite credenciales al fallar auditoría. El logout autenticado de plataforma debe dejar la familia/sesión durablemente inutilizable aun si falla la escritura final de auditoría; ningún rollback de auditoría puede devolverla a estado utilizable. En refresh, un fallo de auditoría no puede exponer un sucesor ni dejar dos credenciales válidas. La solución debe preservar auditabilidad saneada sin usar solo logs ni introducir `REQUIRES_NEW` o un segundo gestor transaccional sin decisión arquitectónica explícita. | Inyectar fallo del escritor de auditoría después de iniciar logout y refresh de plataforma; reusar después el access/refresh token anterior, buscar sucesores y repetir la operación. Verificar también fallo antes y durante commit. | Logout: tokens/familia quedan revocados y todo reuso falla aunque la auditoría falle. Refresh: no se devuelve ni queda utilizable un sucesor sin auditoría; no hay doble familia activa. Éxito normal confirma estado y evidencia juntos; el fallo deja estado seguro, observable y sin datos sensibles. |

### Evidencia de integración obligatoria para la revalidación

Desarrollo deberá producirla y QA repetirla de forma independiente sobre el
mismo candidato remediado. Seguridad final podrá reutilizar resultados
coincidentes del mismo commit, distinguiendo `PASS`, `FAIL` y `NOT_EXECUTED`:

1. **Éxito:** PostgreSQL/Flyway en instalación limpia y upgrade V13→V14;
   refresh y logout de `PLATFORM_SUPERADMIN` con `tenantId/company_id null`
   confirman revocación/rotación y una auditoría mínima correcta.
2. **Rechazo:** principal tenant-bound que alcanza el caso de uso obtiene
   rechazo neutral, cero mutación y exactamente una auditoría durable saneada;
   los centinelas de payload, headers, token y tenant manipulado no aparecen.
3. **Fallo transaccional:** fallo inyectado de auditoría durante logout y
   refresh demuestra mediante reuso real de credenciales y consulta de estado
   que no queda sesión privilegiada insegura, sucesor expuesto ni estado
   parcial. Debe cubrir los límites antes/durante commit, no solo excepciones de
   mocks.
4. **Matriz de constraint:** escrituras válidas e inválidas de
   `scope`/`tenantId`, incluida la evidencia histórica tenantless, se prueban
   contra la restricción efectiva de base.
5. **Carrera residual:** solicitudes concurrentes reales con el mismo `code`
   satisfacen el criterio ampliado de `SEC-BE001-03`.

### Controles no aplicables y riesgos residuales

- WebSocket, Redis/cache, RabbitMQ, archivos/exportaciones, almacenamiento
  local/mobile, ubicación, dependencias, secretos, infraestructura y CI/CD
  siguen `NOT_APPLICABLE`: la remediación delimitada no cambia esas superficies.
  No se justifican SCA/SAST/DAST ni escaneos generales en este preflight.
- Rate limiting, disponibilidad general del servicio y rediseño completo de
  autenticación quedan fuera de esta remediación; no deben usarse para ampliar
  el diff.
- Riesgo residual hasta disponer del candidato remediado: wiring exacto,
  atomicidad bajo fallos de commit, compatibilidad de datos históricos,
  idempotencia de auditoría de rechazo y ausencia de doble credencial solo
  pueden probarse con PostgreSQL y consumidores reales.

Este `ADVISORY` define el alcance verificable de la remediación. No aprueba
código, no cierra `SEC-BE001-F01` ni `SEC-BE001-F02`, y no ejecuta ni autoriza
por sí mismo Desarrollo, QA, Seguridad final, DoF o liberación.

## Revalidación append-only — Preflight de enmienda MVP de denegación tenant-bound — 2026-08-05

**Estado:** `ADVISORY`.

- **Paquete revisado:** `docs/handoffs/governance/BE-001-context-package.md`,
  revisión vigente `12`, SHA-256
  `7a75101f8f4998eddb23ed5e325d7d8730588f524f33ae568556309f769157a6`.
- **Decisión revisada:** enmienda MVP de
  `docs/architecture/adr/ADR-022-auditoria-transaccional-creacion-empresa-plataforma.md`,
  SHA-256
  `20c7566ef523e678c70daf821cbd29977c87b5aa95120aa5fb025be72e0804d1`.
- **Contradicción que origina este preflight:** última sección de
  `docs/handoffs/backend/BE-001-backend-qa.md`, `CHANGES_REQUIRED`, SHA-256
  `6c72d7f92dff69566f093aad740af63d103f4be977412b2cb0a42aaaf5c36c96`;
  la protección que rechaza un principal tenant-bound en el contexto
  `PLATFORM` sigue siendo una invariante válida.
- **Preflight canónico previo a esta sección:** SHA-256
  `b7cedf426942a614d1d01e633420b9a8ef1a22545c3cb5fe7cf5e20fcb80741a`.
- **Candidato de referencia, no inspeccionado:** HEAD
  `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging vacío; manifiesto
  Backend de 31 rutas SHA-256
  `9d2e3168a5f8a0b69714759f1e1340457cd757232f1bd9971ae296335cba9374`.
- **Implementación, diff funcional, pruebas, escáneres y fases posteriores:**
  `NOT_EXECUTED`. Este preflight no inspecciona ni aprueba el candidato.

### Triage, activos, actores y límites de confianza

**Triage:** `APLICA`. La enmienda cambia un puerto público de `audit`, la
identidad y el tenant que atraviesan el límite de dominio, la matriz cerrada
`scope`/`tenantId`, la persistencia de una denegación y su frontera
transaccional. Son superficies de autorización, aislamiento multiempresa,
auditoría y API pública.

| Elemento | Modelo acotado de la enmienda |
|---|---|
| Activos | Identidad técnica real del actor; tenant real; privilegio `PLATFORM_SUPERADMIN`; evidencia append-only de denegación; empresa/configuración que no deben existir; correlación e identificador de intento; invariantes `PLATFORM` y de autenticación ya desplegadas. |
| Actores | Principal de plataforma legítimo sin tenant; principal inconsistente `PLATFORM_SUPERADMIN` tenant-bound; actor no plataforma; cliente que manipula tenant, claims, payload, cabeceras, token o PII; escritor de auditoría o base que falla. |
| Límites | Cliente no confiable → autenticación/principal persistido → caso de uso de `tenancy` → puerto público `RecordCompanyDenialAuditUseCase` → contexto confiable de `audit` → PostgreSQL compartido → commit de evidencia → traducción web neutral a `403`. |
| Abusos | Suplantar la denegación como `PLATFORM`; descartar el tenant real o aceptar uno del cliente; contaminar auditoría con payload/headers/token/PII; permitir combinaciones `scope`/tenant abiertas; responder `403` antes del commit; usar una transacción independiente y conservar evidencia falsa o estado parcial; disfrazar un fallo del escritor como rechazo auditado. |

### Compatibilidad cerrada de contrato, datos y semántica

| Límite | Contrato/invariante vigente | Éxito, rechazo y fallo exigidos | Prueba-invariante requerida |
|---|---|---|---|
| Puerto público | `RecordPlatformCompanyAuditUseCase` permanece exclusivo de operaciones reales de plataforma. `RecordCompanyDenialAuditUseCase` es separado y solo representa denegación de creación de empresa; no se amplía ningún puerto con tenant opcional. | El puerto de denegación no puede producir una auditoría `PLATFORM` ni habilitar la creación. Un actor/contexto no representable falla cerrado. | Pruebas de contrato y arquitectura demuestran que `tenancy` usa solo el puerto público correspondiente, sin importar `audit.adapter..`, escribir tablas de `audit` ni reutilizar el puerto de plataforma para F02. |
| Comando y contexto | El comando de denegación no acepta actor, rol, tenant, scope, correlación cruda, payload, cabeceras, token, PII ni tiempo del cliente. Acepta únicamente el identificador de intento generado por servidor; `audit` deriva del principal/contexto confiable el identificador técnico del actor, tenant real no nulo, hora y correlación ya normalizada por servidor. | Una denegación válida produce `COMPANY` / `CRITICAL_MUTATION` / `DENIED` y `TENANT_BOUND_DENIAL`; no conserva nombre, email, claims, cuerpo, configuración, header, token ni tenant manipulado como atributo. | Pruebas negativas intentan inyectar todos los campos prohibidos y usan centinelas. La evidencia solo contiene el tenant real en su campo estructurado, el identificador técnico mínimo del actor y el identificador de intento de servidor. |
| Matriz `scope`/tenant | `PLATFORM` exige tenant nulo. `TENANT_BOUND_DENIAL` exige tenant real no nulo. `ANONYMOUS_AUTH` tenantless y los scopes tenant-bound existentes conservan exactamente las reglas aprobadas por el preflight anterior. Scope desconocido o cualquier combinación no enumerada se rechaza en dominio y PostgreSQL. | La nueva fila no relaja `PLATFORM`, no rompe refresh/logout tenantless y no fabrica ni elimina tenant para hacer encajar una identidad. | Integración de migración/constraint cubre las combinaciones válidas existentes y las nuevas, además de `PLATFORM + tenant`, `TENANT_BOUND_DENIAL + null`, scope tenant-bound + null y scope desconocido como inválidas. |
| Persistencia y respuesta | La denegación se expresa como resultado dentro de una única transacción con el mismo `DataSource` y `PlatformTransactionManager` de `tenancy`. No usa `REQUIRES_NEW`, segundo gestor/DataSource, asincronía, logs sustitutos ni acceso directo entre dominios. | Éxito de denegación: exactamente una evidencia durable y cero empresa/configuración; solo después del commit se traduce a `403` neutral. Fallo del escritor: cero mutación y cero evidencia ficticia; se propaga como fallo de infraestructura y no como denegación auditada ni `2xx`. | PostgreSQL real demuestra commit/rollback y el orden commit→`403`; comprobaciones de wiring prueban identidad del gestor/DataSource y ausencia de propagación o gestor alternativo. |

### Vigencia exacta de controles previos y texto aplicable a F02

No se retira ni renumera ningún control. Esta sección cambia únicamente la
superficie F02 invalidada por la revisión 11 del paquete:

| Control previo | Tratamiento después de la enmienda |
|---|---|
| `SEC-BE001-01` | **Vigente sin cambios.** Se conserva autorización en profundidad y rechazo sin mutación; la evidencia específica de auditoría del principal tenant-bound pertenece a `SEC-BE001-05/07/08`. |
| `SEC-BE001-02` | **Vigente sin cambios.** Continúa prohibiendo mass assignment y contexto de identidad/tenant procedente del cliente. |
| `SEC-BE001-03` | **Vigente sin cambios respecto de su ampliación anterior.** Se conserva la carrera PostgreSQL de creación; la enmienda no cambia unicidad ni semántica de `409`. |
| `SEC-BE001-04` | **Vigente sin cambios.** Configuración, ubicación, privacidad y tracking no cambian. |
| `SEC-BE001-05` | **Sustituido parcialmente y extendido solo para F02.** Se elimina el texto anterior que representaba el rechazo tenant-bound mediante auditoría `PLATFORM`, tenant nulo o descarte del tenant real. Para F02 rige `RecordCompanyDenialAuditUseCase`, identidad/tenant reales derivados en servidor, `TENANT_BOUND_DENIAL`, vocabularios cerrados y minimización definidos abajo. La creación exitosa por `RecordPlatformCompanyAuditUseCase` permanece vigente. |
| `SEC-BE001-06` | **Vigente sin cambios.** Correlación segura, respuesta neutral y telemetría sin secretos/PII continúan aplicando; no habilita pasar la cabecera cruda al comando ni a la evidencia. |
| `SEC-BE001-07` | **Extendido.** Conserva `PLATFORM + tenantId null`, `ANONYMOUS_AUTH` tenantless y las reglas de scopes tenant-bound existentes; añade exclusivamente `TENANT_BOUND_DENIAL + tenantId real no nulo`. Queda sustituida cualquier interpretación F02 que sanee un principal tenant-bound convirtiéndolo a `PLATFORM`. |
| `SEC-BE001-08` | **Extendido.** Conserva las garantías de creación exitosa y de sesiones de plataforma; añade la transacción de denegación, el commit previo al `403` y el fallo del escritor sin falso rechazo auditado. |

El texto verificable vigente para la superficie modificada es:

| Control | Amenaza e implementación exigida | Abuso obligatorio | Criterio observable |
|---|---|---|---|
| `SEC-BE001-05` F02 sustituido/extendido | Confused deputy, suplantación de plataforma o contaminación de evidencia. Usar exclusivamente `RecordCompanyDenialAuditUseCase`; identidad técnica del actor y tenant real se derivan en servidor. El registro es `COMPANY` / `CRITICAL_MUTATION` / `DENIED`, scope `TENANT_BOUND_DENIAL` e identificador de intento generado por servidor. El comando/evidencia no admiten datos de identidad declarados, tenant manipulado, payload, cabeceras, token, PII, configuración ni tiempo del cliente. | Presentar `PLATFORM_SUPERADMIN` tenant-bound con tenant/claims/payload/headers/token/PII centinela; intentar invocar el puerto de plataforma, alterar el identificador de intento o repetir el mismo comando. | Cero empresa/configuración; exactamente una evidencia mínima por intento de servidor confirmado, con actor/tenant reales y vocabularios exactos; ningún centinela ni tenant manipulado aparece; puerto incorrecto y contexto no representable fallan cerrados. |
| `SEC-BE001-07` extendido | Confusión o relajación de scopes. Dominio y restricción PostgreSQL implementan una allowlist: `PLATFORM` solo con null, `TENANT_BOUND_DENIAL` solo con tenant real no nulo y las combinaciones de autenticación/scopes tenant-bound existentes sin cambios. | Probar cada combinación válida y cruzada, incluida escritura directa inválida; intentar fabricar tenant, borrar tenant real, usar scope desconocido o convertir el rechazo a `PLATFORM`. | Combinaciones válidas persisten; inválidas fallan en dominio y base. Refresh/logout tenantless y auditoría de plataforma conservan su semántica previa. |
| `SEC-BE001-08` extendido | Split transaction o respuesta engañosa. Escritor de denegación y `tenancy` comparten exactamente `DataSource`/`PlatformTransactionManager`, una sola transacción y sin `REQUIRES_NEW` ni segundo gestor. El resultado denegado se confirma antes de traducirse a `403`. | Inyectar fallo del escritor antes/durante commit; provocar fallo de empresa/configuración; intentar wiring alternativo o lanzar la excepción de acceso dentro de la transacción. | Denegación normal: una evidencia durable y ninguna mutación antes del `403`. Fallo: ninguna mutación/evidencia ficticia y no se responde como rechazo auditado. Creación exitosa conserva commit conjunto y su fallo de auditoría revierte empresa/configuración. |

### Evidencia PostgreSQL obligatoria para Desarrollo y QA

Sobre el mismo candidato fijado, Desarrollo debe producir y QA repetir de forma
independiente, distinguiendo `PASS`, `FAIL` y `NOT_EXECUTED`:

1. **Denegación confirmada:** integración PostgreSQL/Flyway con principal
   tenant-bound demuestra cero filas de empresa/configuración, exactamente una
   fila durable `TENANT_BOUND_DENIAL` con tenant real no nulo,
   `COMPANY`/`CRITICAL_MUTATION`/`DENIED`, actor técnico/correlación derivados y
   un identificador de intento generado por servidor; la transacción confirma
   antes de que la frontera web emita `403` neutral.
2. **Minimización y repetición:** centinelas en tenant presentado, payload,
   propiedades extra, headers, token y PII no aparecen en comando, atributos,
   logs ni fila. Intentos distintos reciben identificadores de servidor
   distintos; reejecutar el mismo identificador no duplica evidencia.
3. **Fallo del escritor y commit:** fallo real o inyectado en el escritor y en
   el límite de commit deja cero empresa, configuración y evidencia ficticia;
   no produce `2xx` ni `403` que afirme una denegación auditada. La evidencia de
   wiring identifica el mismo `DataSource` y `PlatformTransactionManager` y
   descarta `REQUIRES_NEW`/segundo gestor.
4. **Matriz cerrada:** integración contra la restricción PostgreSQL efectiva
   acepta `PLATFORM + null`, `TENANT_BOUND_DENIAL + tenant no nulo` y las
   combinaciones de autenticación/tenant-bound previamente aprobadas; rechaza
   los cruces, tenant ausente, tenant indebido y scope desconocido sin perder
   evidencia histórica válida.
5. **Regresión de creación exitosa:** la creación legítima de plataforma sigue
   confirmando empresa, configuración y auditoría `PLATFORM + tenant null` en
   una sola transacción; si falla su auditoría, empresa y configuración
   revierten juntas. También permanece verde la invariante que impide al
   proveedor `PLATFORM` aceptar un principal tenant-bound.

### Controles no aplicables, hallazgos y riesgo residual

- WebSocket, Redis/cache, RabbitMQ, archivos/exportaciones, almacenamiento
  local/mobile, ubicación, dependencias, secretos, infraestructura y CI/CD:
  `NOT_APPLICABLE` para esta enmienda. No se justifican SAST, SCA, DAST ni
  escaneos generales mientras el candidato no cambie esas superficies.
- F01, refresh/logout tenantless, V14, correlación, validación de configuración
  y carrera de creación no se reabren; su evidencia previa solo es reutilizable
  si el Orquestador confirma que el candidato posterior no modifica sus rutas.
- **Hallazgos de diseño:** ninguno bloqueante después de la enmienda ADR-022.
- **Riesgo residual:** `NOT_EXECUTED` hasta existir candidato remediado. Quedan
  por demostrar el contrato real del puerto, derivación de contexto,
  minimización, constraint/migración, wiring transaccional, orden commit→`403`,
  fallo durante commit e idempotencia del identificador de intento en
  PostgreSQL.

Este `ADVISORY` sustituye solo la definición F02 incompatible del preflight
anterior. No aprueba código, no cierra `SEC-BE001-F02` y no autoriza por sí
mismo QA, Seguridad final, DoF ni liberación.
