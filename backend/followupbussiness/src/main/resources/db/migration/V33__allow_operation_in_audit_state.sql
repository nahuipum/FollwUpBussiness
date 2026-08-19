ALTER TABLE audit_entry DROP CONSTRAINT ck_audit_entry_after_state_keys;
ALTER TABLE audit_entry
    ADD CONSTRAINT ck_audit_entry_after_state_keys
        CHECK ((after_state - 'status' - 'channel' - 'result' - 'reason' - 'operation') = '{}'::jsonb);
