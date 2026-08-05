ALTER TABLE audit_entry ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE audit_entry DROP CONSTRAINT ck_audit_entry_before_state_keys;
ALTER TABLE audit_entry DROP CONSTRAINT ck_audit_entry_after_state_keys;
ALTER TABLE audit_entry ADD CONSTRAINT ck_audit_entry_before_state_keys CHECK ((before_state - 'status') = '{}'::jsonb);
ALTER TABLE audit_entry ADD CONSTRAINT ck_audit_entry_after_state_keys CHECK ((after_state - 'status' - 'channel' - 'result' - 'reason') = '{}'::jsonb);
DO $$ BEGIN
    EXECUTE format('GRANT INSERT ON audit_entry TO %I', current_user);
END $$;
ALTER TABLE identity_access_session_family ADD COLUMN refresh_rotated_at TIMESTAMPTZ;
CREATE TABLE identity_access_consumed_refresh_token (
    refresh_token_digest BYTEA PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES identity_access_session_family(id),
    consumed_at TIMESTAMPTZ NOT NULL,
    channel VARCHAR(8) NOT NULL CHECK (channel IN ('WEB','MOBILE')),
    client_instance_digest BYTEA NOT NULL
);
CREATE INDEX ix_identity_access_consumed_refresh_family ON identity_access_consumed_refresh_token(family_id, consumed_at DESC);
