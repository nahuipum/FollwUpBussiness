CREATE TABLE notification_installation (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    session_family_id UUID NOT NULL,
    revoked_at TIMESTAMPTZ
);
CREATE INDEX ix_notification_installation_session_active ON notification_installation(session_family_id, tenant_id) WHERE revoked_at IS NULL;
