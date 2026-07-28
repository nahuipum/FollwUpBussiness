# ADR-010 — Línea base de seguridad y secretos locales

**Estado:** Propuesto

## Contexto

EN-010 antecede a las historias de usuarios, autenticación, sesiones y
autorización funcional. El backend necesita una postura segura por defecto y
un mecanismo reproducible para recibir secretos locales sin versionarlos,
pero todavía no existen identidades, roles, permisos ni una estrategia de
sesión aprobada.

RNF-004 exige seguridad en el transporte, RNF-005 prohíbe almacenar
contraseñas en texto plano, RNF-006 exige validar empresa, usuario, rol y
permisos, RNF-007 limita el acceso a datos personales y de ubicación y
RNF-008 requiere trazabilidad de operaciones críticas. EN-010 solo establece
la base técnica necesaria para que las historias posteriores implementen
esas reglas; no declara que ya estén resueltas funcionalmente.

## Decisión

### Mecanismo de seguridad

Spring Security será el mecanismo de seguridad HTTP del backend. La
configuración utilizará una `SecurityFilterChain` explícita, sin usuario
generado, formulario de login, HTTP Basic, logout, JWT ni autenticación
temporal.

### Política deny by default

Toda solicitud deberá estar autenticada salvo excepciones públicas
enumeradas explícitamente. En esta etapa no hay endpoints públicos. En
particular, `/auth/login`, `/auth/refresh` y `/auth/logout` no se habilitan ni
se exceptúan: sus historias y contratos todavía no están definidos.

No se expone health/readiness en EN-010. Cuando se incorpore observabilidad,
su exposición deberá aprobarse y limitarse a estado técnico no sensible, sin
detalles de configuración, secretos, dependencias internas ni datos de
negocio.

Los rechazos HTTP usarán respuestas JSON mínimas y consistentes:

- `401` cuando falta o falla la autenticación;
- `403` cuando una identidad autenticada carece de autorización.

La protección CSRF se aplica a solicitudes mutables cuyo contexto de
autenticación ya está establecido. Así, una solicitud mutable sin identidad
alcanza primero la decisión de autorización y responde `401`, mientras que
una solicitud autenticada sin el token CSRF requerido responde `403`. BE-003
deberá revisar esta regla al elegir el mecanismo de autenticación.

Ninguna respuesta incluirá stack traces, excepciones, valores de
configuración, credenciales, tokens o datos sensibles.

### Evolución de identidad y acceso

- BE-003 definirá el contrato de autenticación, las validaciones de usuario y
  empresa, el tratamiento seguro de contraseñas y la estrategia concreta de
  sesión/token.
- BE-004 implementará la renovación conforme a la estrategia aprobada en
  BE-003, con límites y revocación.
- BE-005 implementará cierre y revocación sin afectar otros tenants.
- BE-007 incorporará roles, permisos y autorización por recurso cuando
  existan las entidades y relaciones necesarias.

Hasta entonces, ninguna ruta de negocio puede abrirse y no se declaran roles
ni permisos funcionales. La estrategia concreta de sesión/token queda
reservada para el ADR de BE-003; este ADR no decide JWT, refresh tokens,
sesiones opacas, persistencia ni rotación.

### Gestión local de secretos

El backend exige `FIELD_SALES_SECURITY_LOCAL_SECRET` como comprobación
fundacional del canal de inyección de secretos. EN-010 valida su presencia y
fortaleza mínima al arrancar, pero no lo utiliza como contraseña, clave de
firma, token ni material criptográfico: el uso concreto dependerá de las
decisiones de BE-003. No habrá valor por defecto.

Los secretos locales llegan mediante variables de entorno del proceso. Para
desarrollo se puede crear un `.env` a partir de `.env.example`; el archivo
`.env` no es cargado automáticamente por Spring Boot y la herramienta de
arranque debe exportar sus valores al entorno. También se permiten archivos
locales de configuración que Spring pueda importar explícitamente, siempre
que usen los patrones ignorados documentados y nunca se versionen.

`.env.example` contiene únicamente nombres de variables y placeholders
deliberadamente no utilizables fuera de desarrollo. `.gitignore` debe excluir
`.env`, variantes locales, directorios de secretos, claves privadas,
certificados con clave, keystores y archivos de configuración privados.

Si falta el secreto obligatorio o incumple su validación, el contexto de
Spring falla antes de aceptar tráfico. El mensaje identifica únicamente el
nombre de la variable y la regla incumplida; nunca incluye el valor recibido.
La validación rechaza espacios, tabulaciones, retornos de carro, saltos de línea
y cualquier otro whitespace Unicode en los extremos. Para evitar que ese
whitespace oculte un placeholder, se normalizan únicamente los extremos y se
compara en tiempo constante contra todos los placeholders prohibidos, sin
cortar la evaluación tras la primera coincidencia. El valor original nunca se
registra.

Los secretos, contraseñas, tokens, cabeceras `Authorization` y payloads
sensibles no se registran.

### Dependencias y SBOM

Se mantiene Spring Boot 4.1.0 como gestor de dependencias y se usa su propiedad
oficial `tomcat.version` para fijar Tomcat `11.0.24`. Esto alinea
`tomcat-embed-core`, `tomcat-embed-el` y `tomcat-embed-websocket` en una versión
posterior a la línea `11.0.22` afectada por CVE-2026-55956 y a las correcciones
adicionales incluidas en `11.0.24`. Una prueba de política comprueba los tres
módulos en el classpath y el empaquetado se verifica para impedir la
reintroducción de `11.0.22`.

La fase Maven `verify` genera con CycloneDX Maven Plugin 2.9.1 un inventario
CycloneDX 1.6 en `target/sbom/application.cdx.json`. Se fija el timestamp de
salida y se omite un serial aleatorio para que el artefacto sea reproducible
con el mismo código y resolución de dependencias. El SBOM documenta componentes;
no constituye un análisis de vulnerabilidades y EN-010 no afirma evidencia de
SCA ni de CI.

## Alternativas

- Permitir todas las rutas hasta implementar login: rechazada porque crea un
  bypass inseguro y favorece aperturas accidentales.
- Crear un usuario o password temporal: rechazada porque introduce una
  identidad por defecto fuera de alcance y puede persistir por accidente.
- Decidir JWT o sesiones opacas en EN-010: rechazada porque corresponde a
  BE-003 y requiere decisiones funcionales todavía pendientes.
- Añadir Vault, KMS u otro proveedor externo: rechazada por estar fuera de
  alcance y requerir ADR y aprobación propios.
- Versionar secretos de desarrollo: rechazada porque expone credenciales y
  rompe la línea base del repositorio.

## Consecuencias

- El backend no arranca sin el secreto local obligatorio.
- Toda ruta presente o futura queda protegida salvo una excepción pública
  explícita y revisada.
- Aún no existe una manera funcional de autenticarse; por diseño, las rutas
  protegidas responden `401`.
- BE-003 deberá reemplazar o especializar el material secreto y habilitar
  únicamente su endpoint contractual.
- La terminación HTTPS pertenece al entorno de despliegue y queda fuera de
  EN-010; Spring Security conserva la base para exigir transporte seguro
  cuando se defina dicho entorno.

## Riesgos

- Un desarrollador puede confundir el placeholder de `.env.example` con un
  secreto aceptable. La validación rechaza el placeholder conocido y exige
  reemplazarlo.
- Una excepción pública futura podría ampliar la superficie. Debe añadirse
  de forma explícita, con contrato y pruebas negativas de regresión.
- La variable fundacional no sustituye la gestión de secretos productiva ni
  define criptografía; usarla con esos fines sin una decisión posterior sería
  incorrecto.
- El override de Tomcat debe revisarse y elevarse cuando se publiquen nuevas
  correcciones compatibles; la prueba fija únicamente el mínimo conocido de
  esta entrega.
- El SBOM no detecta vulnerabilidades por sí mismo y deberá consumirse por una
  herramienta SCA en un incremento posterior.

## Reversión

Para revertir EN-010 se eliminan la dependencia de Spring Security, el override
`tomcat.version`, la ejecución CycloneDX, la configuración y sus pruebas, la
propiedad obligatoria y su documentación. También se revierte la variable
añadida a `.env.example` y las reglas nuevas de `.gitignore` si no son
utilizadas por otro incremento. La reversión deja el backend sin protección
HTTP, por lo que solo es segura si se revierte también cualquier endpoint
introducido después de EN-010 y el servicio no se expone.
