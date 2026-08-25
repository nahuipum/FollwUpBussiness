ALTER TABLE audit_entry DROP CONSTRAINT ck_audit_entry_before_state_keys;
ALTER TABLE audit_entry
    ADD CONSTRAINT ck_audit_entry_before_state_keys
        CHECK ((before_state - 'status' - 'territoryIds' - 'supervisorId' - 'operation') = '{}'::jsonb);
