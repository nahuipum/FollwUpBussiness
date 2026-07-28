# FieldSales CRM Backend

EN-002 establishes an executable Spring Boot foundation for the FieldSales CRM backend. It is a single deployable modular monolith; it contains no business behavior or external infrastructure integrations.

## Requirements

- JDK 21.
- Maven Wrapper included in this directory (Maven 3.9.16).
- Java 21 and Spring Boot 4.1.0 are defined in `pom.xml`.

Ensure `JAVA_HOME` points to a JDK 21 installation and `java -version` reports version 21 before running Maven. In PowerShell, a temporary session configuration is:

```powershell
$env:JAVA_HOME = '<path-to-jdk-21>'
$env:Path = "$env:JAVA_HOME\\bin;$env:Path"
```

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

The first command compiles the application and runs the context and ArchUnit tests. Stop `spring-boot:run` with `Ctrl+C`.

## Tests

- `FollowupbussinessApplicationTests` verifies that the Spring context starts.
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

PostgreSQL, PostGIS, Redis, RabbitMQ, WebSocket, authentication, endpoints, migrations, and business functionality are intentionally excluded.
