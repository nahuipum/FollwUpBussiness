CREATE TABLE workforce_territory (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenancy_company(id), name VARCHAR(160) NOT NULL, code VARCHAR(40), description VARCHAR(500), status VARCHAR(16) NOT NULL CHECK (status IN ('ACTIVE','INACTIVE')), created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL);
CREATE UNIQUE INDEX uq_workforce_territory_tenant_name_ci ON workforce_territory (tenant_id, lower(name));
CREATE UNIQUE INDEX uq_workforce_territory_tenant_code_ci ON workforce_territory (tenant_id, lower(code)) WHERE code IS NOT NULL;
CREATE INDEX ix_workforce_territory_tenant_status_name ON workforce_territory (tenant_id,status,name,id);
