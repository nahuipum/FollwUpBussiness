CREATE TABLE tenancy_company (
    id UUID PRIMARY KEY,
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_tenancy_company_status CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

CREATE INDEX ix_tenancy_company_active
    ON tenancy_company (id)
    WHERE status = 'ACTIVE';

COMMENT ON TABLE tenancy_company IS
    'Tenancy-owned source of truth for company access state; onboarding fields belong to BE-001.';
