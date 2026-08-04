CREATE TABLE audit_entry (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    actor_id UUID NOT NULL,
    action VARCHAR(64) NOT NULL CHECK (action IN ('AUTHENTICATION', 'RESOURCE_ACCESS', 'CRITICAL_MUTATION')),
    resource_type VARCHAR(120) NOT NULL,
    resource_id UUID NOT NULL,
    result VARCHAR(16) NOT NULL CHECK (result IN ('SUCCESS', 'DENIED', 'ERROR')),
    correlation_id UUID NOT NULL,
    scope VARCHAR(120) NOT NULL,
    before_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    after_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_audit_entry_before_state_keys CHECK ((before_state - 'status') = '{}'::jsonb),
    CONSTRAINT ck_audit_entry_after_state_keys CHECK ((after_state - 'status') = '{}'::jsonb)
);

ALTER TABLE audit_entry ADD CONSTRAINT uq_audit_entry_id_tenant UNIQUE (id, tenant_id);

CREATE INDEX ix_audit_entry_tenant_occurred ON audit_entry (tenant_id, occurred_at DESC);
CREATE INDEX ix_audit_entry_tenant_actor_occurred ON audit_entry (tenant_id, actor_id, occurred_at DESC);
CREATE INDEX ix_audit_entry_tenant_action_occurred ON audit_entry (tenant_id, action, occurred_at DESC);
CREATE INDEX ix_audit_entry_tenant_resource_occurred ON audit_entry (tenant_id, resource_type, resource_id, occurred_at DESC);

CREATE TABLE audit_network_context (
    id UUID PRIMARY KEY,
    audit_entry_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    ip_address INET NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_audit_network_context_entry_tenant
        FOREIGN KEY (audit_entry_id, tenant_id)
        REFERENCES audit_entry (id, tenant_id) ON DELETE CASCADE
);

CREATE INDEX ix_audit_network_context_tenant_occurred ON audit_network_context (tenant_id, occurred_at DESC);
