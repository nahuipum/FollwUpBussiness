ALTER TABLE audit_entry DROP CONSTRAINT audit_entry_action_check;
ALTER TABLE audit_entry
    ADD CONSTRAINT audit_entry_action_check
    CHECK (action IN ('AUTHENTICATION', 'RESOURCE_ACCESS', 'CRITICAL_MUTATION', 'PROVISION_INITIAL_COMPANY_ADMIN'));

ALTER TABLE audit_entry DROP CONSTRAINT audit_entry_result_check;
ALTER TABLE audit_entry
    ADD CONSTRAINT audit_entry_result_check
    CHECK (result IN ('SUCCESS', 'DENIED', 'CONFLICT', 'ERROR'));
