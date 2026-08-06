ALTER TABLE audit_entry DROP CONSTRAINT ck_audit_entry_scope_tenant;

ALTER TABLE audit_entry
    ADD CONSTRAINT ck_audit_entry_scope_tenant
    CHECK (
        (scope = 'PLATFORM' AND tenant_id IS NULL)
        OR (scope = 'TENANT_BOUND_DENIAL' AND tenant_id IS NOT NULL)
        OR scope = 'ANONYMOUS_AUTH'
        OR (scope = 'AUTHORIZED_RESOURCE' AND tenant_id IS NOT NULL)
    );
