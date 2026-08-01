INSERT INTO identity_access_role_catalog AS existing (code, scope, catalog_version)
VALUES
    ('PLATFORM_SUPERADMIN', 'PLATFORM', 1),
    ('COMPANY_ADMIN', 'COMPANY', 1),
    ('SUPERVISOR', 'COMPANY', 1),
    ('SELLER', 'COMPANY', 1)
ON CONFLICT (code) DO UPDATE
SET
    scope = EXCLUDED.scope,
    catalog_version = EXCLUDED.catalog_version
WHERE existing.scope IS DISTINCT FROM EXCLUDED.scope
   OR existing.catalog_version IS DISTINCT FROM EXCLUDED.catalog_version;
