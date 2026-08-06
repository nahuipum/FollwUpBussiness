ALTER TABLE audit_entry
    ADD CONSTRAINT ck_audit_entry_scope_tenant
    CHECK (
        (scope = 'PLATFORM' AND tenant_id IS NULL)
        OR scope = 'ANONYMOUS_AUTH'
        OR (scope NOT IN ('PLATFORM', 'ANONYMOUS_AUTH') AND tenant_id IS NOT NULL)
    );
