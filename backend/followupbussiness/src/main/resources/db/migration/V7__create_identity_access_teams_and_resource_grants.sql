ALTER TABLE identity_access_account ADD CONSTRAINT uq_identity_access_account_id_company UNIQUE (id, company_id);

CREATE TABLE identity_access_team (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    supervisor_id UUID NOT NULL REFERENCES identity_access_account(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    UNIQUE (tenant_id, supervisor_id, id),
    CONSTRAINT fk_identity_access_team_supervisor_tenant
        FOREIGN KEY (supervisor_id, tenant_id) REFERENCES identity_access_account(id, company_id)
);

CREATE TABLE identity_access_team_member (
    team_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    account_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, tenant_id, account_id),
    CONSTRAINT fk_identity_access_team_member_team
        FOREIGN KEY (team_id, tenant_id) REFERENCES identity_access_team(id, tenant_id),
    CONSTRAINT fk_identity_access_team_member_account_tenant
        FOREIGN KEY (account_id, tenant_id) REFERENCES identity_access_account(id, company_id)
);

CREATE TABLE identity_access_resource_grant (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    account_id UUID NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id UUID NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, account_id, resource_type, resource_id),
    CONSTRAINT fk_identity_access_resource_grant_account_tenant
        FOREIGN KEY (account_id, tenant_id) REFERENCES identity_access_account(id, company_id)
);

CREATE INDEX ix_identity_access_team_supervisor ON identity_access_team(tenant_id, supervisor_id);
CREATE INDEX ix_identity_access_resource_grant_lookup ON identity_access_resource_grant(tenant_id, account_id, resource_type, resource_id);

CREATE TABLE identity_access_access_decision_audit (
    id UUID PRIMARY KEY,
    correlation_id UUID NOT NULL,
    actor_id UUID NOT NULL REFERENCES identity_access_account(id),
    tenant_id UUID NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id UUID NOT NULL,
    result VARCHAR(8) NOT NULL CHECK (result IN ('ALLOWED', 'DENIED')),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_identity_access_access_decision_audit_correlation ON identity_access_access_decision_audit(correlation_id);
