# ADR-012 — Bootstrap controlado del superadministrador de plataforma

**Estado:** Propuesto

## Contexto

EN-012 debe crear el primer operador interno con rol
`PLATFORM_SUPERADMIN` antes de que existan autenticación, sesiones o una
empresa cliente. EN-010 estableció Spring Security con denegación por defecto
y gestión local de secretos; EN-011 definió el catálogo estable de roles.
Todavía no existe un actor autenticado capaz de ejecutar BE-001 o BE-057, por
lo que se necesita un mecanismo operativo excepcional sin convertirlo en un
registro público ni en una tarea automática de arranque.

El contrato exige hash seguro de contraseñas, control de acceso, aislamiento
por empresa y trazabilidad. El superadministrador es una identidad de
plataforma: no pertenece a una empresa cliente. La estrategia de
autenticación, sesión o token continúa reservada para BE-003.

## Decisión

### Mecanismo explícito del operador

El bootstrap se ejecuta como un comando local one-shot sobre la aplicación,
sin endpoint HTTP. Requiere simultáneamente:

1. el perfil Spring `bootstrap-superadmin`;
2. `spring.main.web-application-type=none`;
3. la bandera no secreta
   `followupbussiness.bootstrap.platform-superadmin.enabled=true`.

El perfil por sí solo no ejecuta nada. La bandera sin el perfil tampoco
registra el comando. Si el contexto es web, el adaptador falla antes de
invocar el caso de uso. Al terminar una ejecución válida, el proceso no-web
finaliza; no queda un servidor escuchando.

El arranque ordinario no activa perfil ni bandera y nunca ejecuta el
bootstrap. No existe planificador, listener de arranque global, migración con
credenciales, usuario predeterminado ni fallback automático.

### Variables locales

El operador debe inyectar mediante el entorno del proceso:

- `FOLLOW_UP_BUSSINESS_BOOTSTRAP_SUPERADMIN_IDENTITY`;
- `FOLLOW_UP_BUSSINESS_BOOTSTRAP_SUPERADMIN_PASSWORD`.

No existen valores por defecto. La configuración lee ambas variables
manualmente y aplica validación segura para impedir que errores de binding
incluyan valores rechazados. Los errores mencionan únicamente el nombre de la
variable y la regla incumplida.

La identidad se normaliza eliminando whitespace de extremos y convirtiendo a
minúsculas con `Locale.ROOT`. Se rechazan valores vacíos, modificados por la
normalización de extremos, con caracteres de control o fuera del límite de
320 caracteres. La identidad completa se persiste porque será la referencia
de acceso de BE-003, pero nunca aparece en auditoría ni logs.

La contraseña debe ser no vacía, tener al menos 16 caracteres, no contener
whitespace en los extremos y no coincidir con placeholders públicos conocidos.
Además, debe ocupar como máximo 72 bytes en UTF-8. Este límite se valida antes
del hash para respetar el máximo aceptado por BCrypt también con caracteres
multibyte y producir un error seguro, sin incluir el valor recibido.
Se transforma mediante BCrypt con factor de trabajo 12 antes de llegar a
persistencia. La contraseña original nunca se registra ni se guarda.

`.env.example` declara únicamente los nombres de las dos variables con valores
vacíos y un comentario no sensible. `.env` y los archivos locales de secretos
continúan ignorados por Git.

### Caso de uso y arquitectura

`identityaccess` es el dominio propietario. El adaptador CLI construye el
comando y llama a un puerto de entrada. El servicio de aplicación depende de
puertos de salida para persistencia, hash y auditoría. JDBC, BCrypt, Spring y
logging permanecen en adaptadores o configuración. El dominio no depende de
frameworks.

No se añade controlador, request/response HTTP, evento, usuario de prueba,
flujo de login, sesión, JWT ni permiso funcional. OpenAPI no recibe ninguna
operación de bootstrap.

### Persistencia e idempotencia

Flyway crea una tabla mínima `identity_access_account`, extensible mediante
migraciones futuras, con:

- UUID generado por el servidor;
- identidad canónica;
- hash de contraseña;
- referencia al catálogo de roles;
- `company_id` nullable;
- fecha de creación.

Las restricciones imponen que `PLATFORM_SUPERADMIN` tenga `company_id IS
NULL`, que los roles de empresa requieran empresa y que el hash tenga formato
BCrypt con factor 12. Un índice parcial garantiza como máximo un
`PLATFORM_SUPERADMIN`; otro protege la identidad canónica de plataforma.

La primera ejecución crea exactamente una cuenta con rol
`PLATFORM_SUPERADMIN` y sin empresa. Una ejecución posterior con la misma
identidad devuelve `ALREADY_PROVISIONED`, conserva el UUID y el hash existentes
y no eleva privilegios. Una identidad distinta, o una identidad existente con
otro rol/empresa, devuelve `CONFLICT` sin modificar datos. El `INSERT ... ON
CONFLICT DO NOTHING` seguido de relectura hace seguro el reintento concurrente.

El bootstrap y su auditoría se ejecutan dentro de una transacción. PostgreSQL
es la fuente de verdad; Redis no participa.

### Auditoría y observabilidad

Cada intento que alcanza el caso de uso persiste un registro técnico con:

- `operation=PLATFORM_SUPERADMIN_BOOTSTRAP`;
- `result=CREATED`, `ALREADY_PROVISIONED` o `CONFLICT`;
- `correlation_id` generado por el servidor;
- UUID de cuenta solo cuando existe;
- instante de servidor.

El log operativo contiene únicamente `operation`, `result` y
`correlationId`. No contiene identidad completa, contraseña, hash, token,
secretos, cabeceras ni payloads. Los fallos de configuración previos al caso
de uso emiten solo el nombre de la variable y una regla segura.

La tabla de auditoría técnica pertenece temporalmente a `identityaccess` para
no acoplar este enabler al dominio `audit`, que todavía no tiene contrato
público. Una integración futura deberá usar un puerto o evento versionado, no
acceso directo entre repositorios.

### Rotación, reintento y retiro de secretos

Antes de la primera creación, el operador puede sustituir identidad o
contraseña y repetir el comando. Después de `CREATED`, reejecutar con la misma
identidad no rota la contraseña: conserva el hash para impedir cambios
privilegiados accidentales. La rotación de credenciales persistidas pertenecerá
a BE-003 o a una historia operativa aprobada.

Tras el comando, el operador elimina las dos variables del entorno del proceso
y del archivo local ignorado. Ante timeout o resultado incierto, repite con la
misma identidad; la respuesta idempotente confirma la cuenta existente sin
crear otra. Nunca debe cambiar a otra identidad para forzar el reintento.

## Alternativas

- Endpoint público o protegido temporalmente: rechazado porque todavía no
  existe autenticación ni actor autorizado y ampliaría la superficie.
- Ejecutar desde una migración: rechazado porque obligaría a entregar
  credenciales a Flyway y repetiría lógica sensible durante despliegues.
- Ejecutar con solo un perfil: rechazado porque un perfil persistido podría
  convertir el bootstrap en una tarea automática de cada arranque.
- Usuario, correo o contraseña por defecto: rechazado por exposición y
  escalamiento de privilegios.
- Actualizar contraseña en cada reintento: rechazado porque una segunda
  ejecución dejaría de ser una confirmación idempotente.
- Argon2 con proveedor criptográfico adicional: pospuesto para evitar una
  dependencia nueva en este enabler. BCrypt 12 está disponible en la línea
  aprobada de Spring Security y cumple el hash seguro requerido.

## Consecuencias

- Un entorno vacío puede obtener un único operador de plataforma mediante un
  procedimiento explícito y auditable.
- El operador debe disponer de PostgreSQL migrado y proporcionar identidad y
  contraseña solo durante el comando.
- EN-012 no permite autenticarse; BE-003 consumirá la cuenta y definirá la
  estrategia de sesión/token.
- BE-057 deberá extender el modelo para administradores de empresa, agregar la
  relación autorizada con una empresa activa y conservar las restricciones de
  tenant.

## Riesgos

- Un operador puede conservar variables en su shell o `.env`. La documentación
  exige retirarlas al finalizar y nunca imprimirlas.
- El esquema mínimo requerirá evolución en BE-003/BE-057. Toda evolución será
  forward-only mediante Flyway y deberá mantener compatibilidad.
- Un proceso con acceso al entorno o a la base puede acceder a material
  sensible. La gestión productiva de secretos, cifrado en reposo y controles
  operativos pertenecen a infraestructura posterior.
- BCrypt 12 debe revisarse conforme cambie la línea de seguridad y el costo
  operativo aprobado.

## Reversión

Antes de aplicar la migración se pueden retirar clases, configuración,
documentación y migración EN-012. Después de aplicada, no se modifica ni
elimina la migración versionada: se crea una migración forward que deshabilite
primero cualquier consumo posterior, conserve o exporte la auditoría requerida
y elimine las tablas solo si BE-001, BE-003 y BE-057 aún no dependen de ellas.

Como reversión operativa inmediata, no se activa el perfil ni la bandera y se
retiran del entorno las variables locales. Si una cuenta fue creada por error,
su desactivación o rotación requiere un procedimiento aprobado posterior; no
se borra ni se reemplaza mediante un nuevo bootstrap.
