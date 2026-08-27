ALTER TABLE audit_entry DROP CONSTRAINT ck_audit_entry_before_state_keys;
ALTER TABLE audit_entry
    ADD CONSTRAINT ck_audit_entry_before_state_keys
        CHECK ((before_state - 'status' - 'territoryIds' - 'supervisorId' - 'sellerId' - 'operation' - 'version' - 'pointCount') = '{}'::jsonb);

ALTER TABLE audit_entry DROP CONSTRAINT ck_audit_entry_after_state_keys;
ALTER TABLE audit_entry
    ADD CONSTRAINT ck_audit_entry_after_state_keys
        CHECK ((after_state - 'status' - 'channel' - 'result' - 'reason' - 'operation' - 'territoryIds' - 'supervisorId' - 'sellerId' - 'version' - 'pointCount') = '{}'::jsonb);
