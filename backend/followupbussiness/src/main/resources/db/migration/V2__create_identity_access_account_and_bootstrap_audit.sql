CREATE TABLE identity_access_account (
    id UUID PRIMARY KEY,
    login_identifier VARCHAR(320) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role_code VARCHAR(64) NOT NULL,
    company_id UUID,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_identity_access_account_role
        FOREIGN KEY (role_code)
        REFERENCES identity_access_role_catalog(code),
    CONSTRAINT ck_identity_access_account_login_canonical
        CHECK (
            login_identifier = LOWER(login_identifier)
            AND login_identifier = BTRIM(login_identifier)
            AND login_identifier <> ''
        ),
    CONSTRAINT ck_identity_access_account_bcrypt_12
        CHECK (password_hash ~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$'),
    CONSTRAINT ck_identity_access_account_role_company
        CHECK (
            (role_code = 'PLATFORM_SUPERADMIN' AND company_id IS NULL)
            OR
            (role_code IN ('COMPANY_ADMIN', 'SUPERVISOR', 'SELLER') AND company_id IS NOT NULL)
        )
);

CREATE UNIQUE INDEX uq_identity_access_platform_login
    ON identity_access_account(login_identifier)
    WHERE company_id IS NULL;

CREATE UNIQUE INDEX uq_identity_access_single_platform_superadmin
    ON identity_access_account(role_code)
    WHERE role_code = 'PLATFORM_SUPERADMIN';

CREATE INDEX ix_identity_access_account_company_login
    ON identity_access_account(company_id, login_identifier)
    WHERE company_id IS NOT NULL;

COMMENT ON TABLE identity_access_account IS
    'Access accounts owned by identityaccess; EN-012 creates only the first platform superadmin';
COMMENT ON COLUMN identity_access_account.login_identifier IS
    'Canonical access identity; sensitive and forbidden from bootstrap logs and audit details';
COMMENT ON COLUMN identity_access_account.password_hash IS
    'BCrypt strength-12 hash; plaintext passwords are never persisted';
COMMENT ON COLUMN identity_access_account.company_id IS
    'Null only for platform scope; company ownership is implemented by later stories';

CREATE TABLE identity_access_bootstrap_audit (
    id UUID PRIMARY KEY,
    operation VARCHAR(64) NOT NULL,
    result VARCHAR(32) NOT NULL,
    correlation_id UUID NOT NULL,
    account_id UUID,
    occurred_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_identity_access_bootstrap_audit_account
        FOREIGN KEY (account_id)
        REFERENCES identity_access_account(id),
    CONSTRAINT ck_identity_access_bootstrap_audit_operation
        CHECK (operation = 'PLATFORM_SUPERADMIN_BOOTSTRAP'),
    CONSTRAINT ck_identity_access_bootstrap_audit_result
        CHECK (result IN ('CREATED', 'ALREADY_PROVISIONED', 'CONFLICT'))
);

CREATE INDEX ix_identity_access_bootstrap_audit_correlation
    ON identity_access_bootstrap_audit(correlation_id);

COMMENT ON TABLE identity_access_bootstrap_audit IS
    'Safe technical audit of controlled EN-012 bootstrap attempts';
COMMENT ON COLUMN identity_access_bootstrap_audit.correlation_id IS
    'Server-generated correlation id; no operator identity or secret is stored';
