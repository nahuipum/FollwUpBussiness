# FieldSales CRM Backend

EN-002 establishes the executable Spring Boot foundation and EN-010 adds the
Spring Security and local-secret baseline. The application remains a single
deployable modular monolith and still contains no business behavior,
authentication flow, users, sessions, roles or permissions.

## Requirements

- JDK 21.
- Maven Wrapper included in this directory (Maven 3.9.16).
- Java 21 and Spring Boot 4.1.0 are defined in `pom.xml`.
- A local value for the required environment variable listed below.

Ensure `JAVA_HOME` points to a JDK 21 installation and `java -version` reports version 21 before running Maven. In PowerShell, a temporary session configuration is:

```powershell
$env:JAVA_HOME = '<path-to-jdk-21>'
$env:Path = "$env:JAVA_HOME\\bin;$env:Path"
```

## Local security and secrets

Spring Security protects every request with a deny-by-default rule. There are
no public endpoints in EN-010, including login, refresh, logout, health and
readiness. Because BE-003 has not implemented authentication, an unauthenticated
request receives a generic `401` response. Authenticated requests denied by the
security layer receive a generic `403`; neither response exposes exceptions,
stack traces, paths, configuration or sensitive data.

CSRF applies when an authentication context has already been established.
This keeps unauthenticated mutable requests on the `401` path and returns
`403` when an authenticated mutable request lacks its required CSRF token.
BE-003 must revisit this rule when it chooses the authentication mechanism.

The backend requires this variable:

| Variable | Purpose | Required |
|---|---|---|
| `FIELD_SALES_SECURITY_LOCAL_SECRET` | Verify local secret injection and fail-fast behavior | Yes |

The value must be local-only, nonblank, at least 32 characters, contain no
leading or trailing whitespace, and be different from every prohibited public
placeholder. Validation strips boundary Unicode whitespace only to compare the
normalized value against every prohibited placeholder using constant-time
comparisons; the original value is rejected whenever normalization would alter
it. EN-010 does not use the value as a password, signing key, token or
cryptographic key. BE-003 will decide the concrete session/token strategy and
the secrets it requires.

Create the ignored local file from the repository root:

```powershell
Copy-Item .env.example .env
```

Replace every password or secret placeholder in `.env` with a unique
development-only value. Do not commit `.env`. Spring Boot does not load `.env`
automatically; export the variables through the IDE or the shell before
starting it. This PowerShell snippet imports the simple `KEY=VALUE` lines
without printing their values:

```powershell
Get-Content ..\..\.env |
    Where-Object { $_ -match '^[A-Z0-9_]+=' } |
    ForEach-Object {
        $entry = $_ -split '=', 2
        [Environment]::SetEnvironmentVariable($entry[0], $entry[1], 'Process')
    }
```

If `FIELD_SALES_SECURITY_LOCAL_SECRET` is missing, blank, too short, has
leading/trailing whitespace, or matches a prohibited placeholder after
normalization, application startup fails before accepting traffic. The failure
identifies the variable and violated rule but never its value.

## Dependency security and SBOM

Spring Boot 4.1.0 remains the dependency-management baseline. EN-010 uses its
official `tomcat.version` override with version `11.0.24`, keeping
`tomcat-embed-core`, `tomcat-embed-el`, and `tomcat-embed-websocket` aligned on
the same patched baseline. Version `11.0.22` is not permitted by the dependency
policy test or the packaged application.

`mvn clean verify` also creates a reproducible CycloneDX 1.6 inventory at
`target/sbom/application.cdx.json`. The configuration omits a random BOM serial
number and fixes the output timestamp so identical source and resolved
dependencies produce the same file. Regenerate only the SBOM with:

```powershell
mvn cyclonedx:makeAggregateBom@default
```

The SBOM is a dependency inventory, not a vulnerability scan. EN-010 provides
no CI or SCA execution evidence; those controls remain outside this enabler.

## Structure

The base package is `com.nahui.followupbussiness`. Each domain follows the same hexagonal boundary:

```text
<domain>/
├── domain/          # Framework-independent domain model and rules
├── application/     # Use cases and input/output ports
├── adapter/         # Inbound and outbound technical adapters
└── config/          # Dependency wiring for the domain
```

Initial domains are `tenancy`, `identityaccess`, `workforce`, `customers`, `routing`, `journeys`, `tracking`, `visits`, `catalog`, `sales`, `reporting`, `imports`, `notifications`, and `audit`.

`identityaccess` is the Java package representation of the logical `identity-access` domain defined in the architecture documentation; Java package names cannot contain hyphens.

`package-info.java` files retain and document the empty layer packages until concrete use cases and adapters are introduced.

## Commands

From `backend/followupbussiness` on Windows:

```powershell
.\mvnw.cmd clean verify
.\mvnw.cmd spring-boot:run
java -jar target\followupbussiness-0.0.1-SNAPSHOT.jar
```

If the wrapper cannot start in the local shell, the equivalent commands are
`mvn clean verify` and `mvn spring-boot:run`. The first command compiles the
application and runs the context, security, repository-policy and ArchUnit
tests. Stop `spring-boot:run` with `Ctrl+C`.

## Tests

- `FollowupbussinessApplicationTests` verifies that the Spring context starts.
- `LocalSecuritySecretsPropertiesTest` verifies successful secret injection and
  safe startup failure for missing values, every prohibited placeholder and
  boundary spaces, tabs, carriage returns or line feeds.
- `SecurityConfigurationTest` verifies deny-by-default behavior, protected
  routes, generic `401`/`403` responses and the absence of a generated user.
- `DependencySecurityPolicyTest` verifies at runtime that Tomcat core, EL and
  WebSocket are all at least `11.0.24` and never `11.0.22`.
- `RepositorySecretsPolicyTest` verifies ignored/untracked secret files and
  public placeholders in `.env.example`.
- `HexagonalArchitectureTest` prevents dependencies from the domain toward frameworks or outer layers, from the application toward adapters/configuration, and from adapters toward configuration.
- `ModuleBoundaryTest` prevents any other module from depending on a module's adapters.

Run all tests with:

```powershell
.\mvnw.cmd test
```

## Adding A Domain

1. Add the domain to the architecture documentation before implementation when it changes the approved domain model.
2. Create `<domain>/domain`, `<domain>/application/port/in`, `<domain>/application/port/out`, `<domain>/adapter/in`, `<domain>/adapter/out`, and `<domain>/config`.
3. Add `package-info.java` documentation to empty packages.
4. Add the module package name to `ModuleBoundaryTest`.
5. Keep domain code free of Spring and infrastructure dependencies; expose cross-domain collaboration through application ports or documented contracts.
6. Add focused tests before adding behavior.

## Scope Of This Enabler

EN-010 configures Spring Security and local secret delivery only. Users,
login, refresh, logout, sessions, JWT, refresh tokens, functional roles,
resource permissions, business endpoints, BE-003/BE-004/BE-005/BE-006/BE-007,
production secrets, Vault/KMS, CI/CD and production deployment remain
excluded. PostgreSQL, PostGIS, Redis, RabbitMQ and WebSocket integrations also
remain outside this backend increment.

## Rollback EN-010

Remove the Spring Security dependencies, Tomcat version override, CycloneDX
execution, the `identityaccess` security configuration and handlers, the
local-secret property validation and their tests. Revert the EN-010 additions
to `.env.example`, `.gitignore` and this README. This leaves HTTP unprotected,
so rollback is safe only while no business endpoint exists and the service is
not exposed.
