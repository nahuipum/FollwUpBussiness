# FieldSales CRM Backend

EN-002 establishes the executable Spring Boot foundation, EN-010 adds the
Spring Security and local-secret baseline, EN-011 defines the persistent
base-role catalog, and EN-012 adds the controlled one-shot provisioning of the
first platform superadministrator. The application remains a single deployable
modular monolith and still contains no login, session, JWT, company-user
provisioning, administrative role assignment or resource permissions.

## Requirements

- JDK 21.
- Maven Wrapper included in this directory (Maven 3.9.16).
- Java 21 and Spring Boot 4.1.0 are defined in `pom.xml`.
- A local value for the required environment variable listed below.
- PostgreSQL 17 for application startup and Docker for the complete
  Testcontainers integration suite.

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

## Base role catalog and database

EN-011 defines exactly these server-owned role references:

| Code | Scope |
|---|---|
| `PLATFORM_SUPERADMIN` | `PLATFORM` |
| `COMPANY_ADMIN` | `COMPANY` |
| `SUPERVISOR` | `COMPANY` |
| `SELLER` | `COMPANY` |

They are immutable domain codes, not authorities supplied by a client. The
catalog table is global because it contains platform-wide reference data, not
tenant business data. Future user-role assignments must carry and enforce
tenant ownership independently.

Flyway applies `V1__create_identity_access_role_catalog.sql` and the
idempotent repeatable seed `R__seed_identity_access_base_roles.sql`. Database
constraints reject unknown codes, duplicates, invalid scopes and scope/code
mismatches.

The application reads the existing local PostgreSQL variables:

| Variable | Purpose | Required |
|---|---|---|
| `POSTGRES_PASSWORD` | Local database credential | Yes |
| `POSTGRES_HOST` | Database host; defaults to loopback | No |
| `POSTGRES_PORT` | Database port | No |
| `POSTGRES_DB` | Database name | No |
| `POSTGRES_USER` | Database user | No |

No credential is stored in `application.yaml`; `POSTGRES_PASSWORD` has no
default. After importing the ignored `.env` variables and starting PostgreSQL
with `docker compose up -d postgres`, application startup validates and applies
pending migrations automatically.

## Controlled platform superadmin bootstrap

EN-012 provisions at most one platform account with only the stable role
`PLATFORM_SUPERADMIN` and `company_id = NULL`. It is an explicit local operator
command, not an HTTP endpoint or an automatic startup task. It runs only when
all three guards are present:

1. profile `bootstrap-superadmin`;
2. `spring.main.web-application-type=none`;
3. `fieldsales.bootstrap.platform-superadmin.enabled=true`.

The operator must provide these environment variables through the process or
an ignored local file. The public `.env.example` intentionally leaves both
values empty:

| Variable | Purpose | Required only for bootstrap |
|---|---|---|
| `FIELD_SALES_BOOTSTRAP_SUPERADMIN_IDENTITY` | Canonical login identity for the first platform operator | Yes |
| `FIELD_SALES_BOOTSTRAP_SUPERADMIN_PASSWORD` | One-time input to the BCrypt hash | Yes |

The password must have at least 16 characters, occupy at most 72 bytes in
UTF-8, contain no boundary whitespace and differ from public placeholders.
Only a BCrypt cost-12 hash is persisted. Never place real values in commands,
documentation, source files or shell history.

From the repository root, create and edit the ignored local file without
printing its values:

```powershell
Copy-Item .env.example .env
# Edit .env locally and fill the two EN-012 variables plus POSTGRES_PASSWORD.
```

Import the file using the non-printing snippet in "Local security and secrets",
start PostgreSQL, verify the backend, and execute the one-shot JAR:

```powershell
docker compose up -d postgres
Set-Location backend\followupbussiness
.\mvnw.cmd clean verify
java -jar target\followupbussiness-0.0.1-SNAPSHOT.jar `
  --spring.profiles.active=bootstrap-superadmin `
  --spring.main.web-application-type=none `
  --fieldsales.bootstrap.platform-superadmin.enabled=true
```

The process closes after the result and logs only `operation`, `result` and a
server-generated `correlationId`. Expected results are `CREATED` on the first
execution and `ALREADY_PROVISIONED` when the same identity is retried. A
different identity returns a safe conflict and never creates or elevates
another account. A missing variable terminates with a nonzero status and a
message containing only the variable name and rule, never its value.

Verify without selecting identity or hash values:

```sql
SELECT id, role_code, company_id, created_at
FROM identity_access_account
WHERE role_code = 'PLATFORM_SUPERADMIN';

SELECT operation, result, correlation_id, occurred_at
FROM identity_access_bootstrap_audit
ORDER BY occurred_at;
```

The first query must return exactly one row, role `PLATFORM_SUPERADMIN` and a
null `company_id`. After verification, remove the process variables and delete
their values from the ignored local file:

```powershell
Remove-Item Env:FIELD_SALES_BOOTSTRAP_SUPERADMIN_IDENTITY -ErrorAction SilentlyContinue
Remove-Item Env:FIELD_SALES_BOOTSTRAP_SUPERADMIN_PASSWORD -ErrorAction SilentlyContinue
```

Before the initial `CREATED`, rotate the local inputs by replacing them and
rerunning the command. After creation, a retry intentionally preserves the
original hash; persistent credential rotation belongs to BE-003 or a separately
approved operational story.

## Dependency security and SBOM

Spring Boot 4.1.0 remains the dependency-management baseline. EN-010 uses its
official `tomcat.version` override with version `11.0.24`, keeping
`tomcat-embed-core`, `tomcat-embed-el`, and `tomcat-embed-websocket` aligned on
the same patched baseline. Version `11.0.22` is not permitted by the dependency
policy test or the packaged application.

EN-011 uses the official coordinated properties
`postgresql.version=42.7.12` and `jackson-bom.version=3.1.5`. This keeps pgJDBC
outside the range affected through 42.7.11 and upgrades the complete Jackson
BOM rather than pinning only Databind. The dependency policy test requires
pgJDBC at least 42.7.12 and Jackson Databind at least 3.1.5, and explicitly
rejects 42.7.11 and 3.1.4.

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
tests, including the PostgreSQL/PostGIS migration integration through
Testcontainers. Stop `spring-boot:run` with `Ctrl+C`.

## Tests

- `FollowupbussinessApplicationTests` verifies that the Spring context starts.
- `LocalSecuritySecretsPropertiesTest` verifies successful secret injection and
  safe startup failure for missing values, every prohibited placeholder and
  boundary spaces, tabs, carriage returns or line feeds.
- `SecurityConfigurationTest` verifies deny-by-default behavior, protected
  routes—including hypothetical role mutation paths—generic `401`/`403`
  responses and the absence of a generated user.
- `BaseRoleTest` verifies the exact, unique and stable domain codes and scopes.
- `BaseRoleCatalogMigrationTest` verifies clean-database migration, repeatable
  execution, PostgreSQL constraints and absence of the database password from
  migration logs against `postgis/postgis:17-3.5`.
- `BootstrapSuperadminCredentialsReaderTest` verifies required local inputs,
  safe failures and the 16-character/72-byte BCrypt boundary, including
  multibyte UTF-8 values.
- `PlatformSuperadminBootstrapRunnerTest` verifies one-shot context closure,
  web-context rejection and sanitized failures/logs.
- `BootstrapCommandActivationTest` verifies that neither profile nor flag alone
  activates the command.
- `BootstrapPlatformSuperadminServiceTest` verifies creation, conflict and
  idempotent retry behavior without framework dependencies.
- `PlatformSuperadminBootstrapMigrationTest` verifies V2 on a clean PostgreSQL
  database, BCrypt persistence, platform-only role, null company, safe audit,
  idempotency, constraints and concurrent retry.
- `BootstrapOpenApiPolicyTest` verifies that no platform-superadmin bootstrap
  operation exists while preserving the unrelated `/mobile/bootstrap` API.
- `DependencySecurityPolicyTest` verifies at runtime that Tomcat core, EL and
  WebSocket are all at least `11.0.24`, pgJDBC is at least `42.7.12`, and
  Jackson Databind is at least `3.1.5`; the known vulnerable versions are
  explicitly rejected.
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

## Scope Of EN-011 And EN-012

EN-011 defines and persists only the four base-role references. EN-012 adds
only the controlled first `PLATFORM_SUPERADMIN` account and its technical
bootstrap audit. General user creation or modification, administrative role
assignment, custom roles, login, refresh, logout, sessions, JWT, recovery,
permissions by resource, company creation, BE-057, BE-003 and BE-007 remain
excluded. Redis, RabbitMQ and WebSocket integrations also remain outside this
increment.

## Rollback EN-012

Operational rollback is immediate: do not activate the profile/flag and remove
the two bootstrap variables from the process and ignored local file. Before V2
is applied, remove the EN-012 code, migration, tests and documentation. After
V2 reaches an environment, never edit or delete the applied migration; use a
new forward migration that preserves required audit evidence and removes the
account/audit tables only after confirming BE-003 and later stories do not
depend on them. A created privileged account is not deleted or rekeyed by
rerunning bootstrap; that requires an approved operational procedure.

## Rollback EN-011

Before deployment, remove the EN-011 domain types, Flyway migrations,
JDBC/Flyway/PostgreSQL dependencies, datasource configuration and associated
tests and documentation. After migration V1 has reached any environment, do
not edit or delete the applied migration: add a new forward Flyway migration
that first verifies no user-role relationship references the catalog, then
drops `identity_access_role_catalog`. Removing the catalog after EN-012,
BE-057, BE-003 or BE-007 depends on it requires coordinated rollback of those
increments.

## Rollback EN-010

Remove the Spring Security dependencies, Tomcat version override, CycloneDX
execution, the `identityaccess` security configuration and handlers, the
local-secret property validation and their tests. Revert the EN-010 additions
to `.env.example`, `.gitignore` and this README. This leaves HTTP unprotected,
so rollback is safe only while no business endpoint exists and the service is
not exposed.
