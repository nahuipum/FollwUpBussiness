# PostgreSQL + PostGIS

## Contenido esperado

- Extensiones.
- Migraciones.
- Convenciones de schemas.
- Índices.
- Backup y restore.
- Datos locales.
- Pruebas de recuperación.

## Reglas

- PostGIS habilitado.
- `tenant_id` obligatorio.
- Índices compuestos por tenant.
- Índices GiST para geografía.
- Migraciones con Flyway.
- Dinero con `numeric`.
- Fechas persistidas consistentemente.
