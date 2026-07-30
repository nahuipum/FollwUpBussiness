# ADR-011 — Catálogo de roles base

**Estado:** Propuesto

## Contexto

El contrato funcional distingue administrador de empresa, supervisor,
vendedor y superadministrador de plataforma. EN-011 debe estabilizar esas
referencias antes de que EN-012, BE-057, BE-003 y BE-007 creen usuarios,
transporten roles en sesiones o apliquen autorización. Todavía no existen
usuarios, asignaciones, permisos por recurso ni una estrategia de sesión
aprobada.

RF-AUT-003 exige restringir funcionalidades por rol y RNF-006 exige validar
empresa, usuario, rol y permisos. EN-011 solo aporta el vocabulario estable y
persistente; no declara cumplidas esas validaciones funcionales.

## Decisión

### Códigos y ámbitos

El dominio `identityaccess` es propietario de un catálogo cerrado con versión
1:

| Código estable | Ámbito |
|---|---|
| `PLATFORM_SUPERADMIN` | `PLATFORM` |
| `COMPANY_ADMIN` | `COMPANY` |
| `SUPERVISOR` | `COMPANY` |
| `SELLER` | `COMPANY` |

`BaseRole` y `RoleScope` pertenecen al dominio y no dependen de Spring, JPA,
Flyway ni infraestructura. Los códigos no se traducen, renombran ni derivan
desde etiquetas de interfaz. Un valor recibido del cliente nunca constituye
autoridad; únicamente una identidad autenticada y una asignación persistida
por el servidor podrán otorgar un rol en historias posteriores.

### Persistencia

PostgreSQL es la fuente persistente del catálogo. Flyway crea
`identity_access_role_catalog` mediante
`V1__create_identity_access_role_catalog.sql` y carga los datos de referencia
mediante `R__seed_identity_access_base_roles.sql`.

La tabla usa `code` como clave primaria y restricciones `CHECK` para:

- admitir únicamente los cuatro códigos aprobados;
- admitir solo los ámbitos `PLATFORM` y `COMPANY`;
- fijar la correspondencia entre cada código y su ámbito;
- fijar `catalog_version = 1`.

El seed usa `INSERT ... ON CONFLICT DO UPDATE`, por lo que puede ejecutarse
repetidamente sin duplicar filas y converge al ámbito y versión definidos por
el servidor.

El catálogo no contiene `tenant_id`: son referencias globales inmutables
compartidas por todas las empresas, no asignaciones ni datos empresariales.
Las futuras relaciones usuario-rol sí deberán modelar el tenant y aplicar las
pruebas negativas de aislamiento correspondientes.

### Ownership y superficie

El servidor y sus migraciones son los únicos propietarios del catálogo. EN-011
no crea controlador, endpoint, comando, evento ni mecanismo de importación para
crear, modificar o elevar roles. Spring Security conserva `deny by default`;
las rutas hipotéticas de mutación de roles se prueban como protegidas.

### Línea base de dependencias

Spring Boot 4.1.0 continúa administrando la familia de dependencias. EN-011
sobrescribe únicamente sus propiedades oficiales coordinadas
`postgresql.version=42.7.12` y `jackson-bom.version=3.1.5`. La primera remedia
el rango pgJDBC afectado hasta 42.7.11; la segunda actualiza coordinadamente
Jackson 3.1.x y evita fijar `jackson-databind` de forma aislada.

Una prueba de política inspecciona las versiones reales del classpath y exige
esos mínimos. Las futuras autorizaciones no podrán basarse exclusivamente en
vistas de serialización como `@JsonView`; el servidor deberá validar identidad,
tenant, rol, permiso y recurso con independencia del DTO.

### Evolución

- EN-012 podrá referenciar exclusivamente `PLATFORM_SUPERADMIN` al crear de
  forma controlada el primer operador de plataforma, sin tenant cliente.
- BE-057 podrá asignar exclusivamente `COMPANY_ADMIN` al administrador inicial
  de una empresa activa y autorizada.
- BE-003 podrá transportar una referencia de rol obtenida por el servidor en
  la sesión que defina su ADR; no aceptará autoridad declarada por el cliente.
- BE-007 definirá asignaciones, permisos por recurso, equipos, auditoría y
  autorización multiempresa. Los roles personalizados requerirán una decisión
  y modelo posteriores.

## Alternativas

- Mantener solo constantes Java: rechazada porque EN-011 exige una
  inicialización persistente y verificable en base limpia.
- Crear un catálogo por tenant: rechazado porque duplicaría referencias base y
  confundiría el catálogo global con futuras asignaciones multiempresa.
- Exponer CRUD de roles: rechazado porque abre escalamiento de privilegios y
  pertenece al alcance funcional posterior de BE-007.
- Crear entidades JPA y repositorios anticipados: rechazado porque todavía no
  existe un caso de uso que los consuma y expondría infraestructura innecesaria.
- Usar nombres editables como códigos: rechazado porque rompería sesiones,
  auditoría y relaciones persistentes futuras.

## Consecuencias

- Una base limpia obtiene exactamente cuatro roles tras ejecutar Flyway.
- Los códigos y ámbitos se validan tanto en dominio como en PostgreSQL.
- El arranque operativo requiere PostgreSQL y la contraseña local inyectada,
  sin valor por defecto en `application.yaml`.
- EN-011 no ofrece una forma de autenticarse ni de asignar roles.
- Cambiar o agregar códigos exige una nueva migración, actualización del
  dominio, pruebas y revisión de compatibilidad.

## Riesgos

- Un código renombrado rompería referencias posteriores. Se mitiga tratándolo
  como contrato estable y probándolo literalmente.
- Una asignación futura podría omitir tenant aunque el catálogo sea global.
  EN-012, BE-057 y BE-007 deberán imponer su propio ownership y aislamiento.
- Credenciales de base podrían filtrarse en logs. La integración usa una
  contraseña sentinela y verifica que Flyway no la emita.
- La migración repetible converge datos conocidos, pero no sustituye controles
  de privilegios del usuario de base de datos ni auditoría funcional.
- Los overrides coordinados deben revisarse al actualizar Spring Boot para
  adoptar su nueva línea administrada o una versión corregida posterior; no
  deben degradarse silenciosamente ni fragmentarse en pins individuales.

## Reversión

Antes de aplicar V1, se pueden retirar tipos, dependencias y migraciones EN-011.
Después de aplicada, no se modifica ni elimina la migración versionada: se crea
una nueva migración forward que verifique primero que ninguna relación
usuario-rol referencia el catálogo y luego elimine
`identity_access_role_catalog`. Si EN-012, BE-057, BE-003 o BE-007 ya dependen
de estos códigos, su rollback debe coordinarse antes.
