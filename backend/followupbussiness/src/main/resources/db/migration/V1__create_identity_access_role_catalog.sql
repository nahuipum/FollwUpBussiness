CREATE TABLE identity_access_role_catalog (
    code VARCHAR(64) PRIMARY KEY,
    scope VARCHAR(16) NOT NULL,
    catalog_version SMALLINT NOT NULL,
    CONSTRAINT ck_identity_access_role_catalog_code
        CHECK (code IN ('PLATFORM_SUPERADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'SELLER')),
    CONSTRAINT ck_identity_access_role_catalog_scope
        CHECK (scope IN ('PLATFORM', 'COMPANY')),
    CONSTRAINT ck_identity_access_role_catalog_scope_mapping
        CHECK (
            (code = 'PLATFORM_SUPERADMIN' AND scope = 'PLATFORM')
            OR
            (code IN ('COMPANY_ADMIN', 'SUPERVISOR', 'SELLER') AND scope = 'COMPANY')
        ),
    CONSTRAINT ck_identity_access_role_catalog_version
        CHECK (catalog_version = 1)
);

COMMENT ON TABLE identity_access_role_catalog IS
    'Server-owned catalog of stable base roles for the identityaccess domain';
COMMENT ON COLUMN identity_access_role_catalog.code IS
    'Stable server-defined role code; never accepted as client authority';
COMMENT ON COLUMN identity_access_role_catalog.scope IS
    'PLATFORM for SaaS operators or COMPANY for tenant-bound roles';
COMMENT ON COLUMN identity_access_role_catalog.catalog_version IS
    'Version of the base role catalog contract';
