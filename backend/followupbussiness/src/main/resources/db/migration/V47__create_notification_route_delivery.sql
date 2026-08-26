ALTER TABLE notification_installation ADD COLUMN user_id UUID;
ALTER TABLE notification_installation ADD COLUMN adapter_id VARCHAR(64);
ALTER TABLE notification_installation ADD COLUMN push_token_protected TEXT;
ALTER TABLE notification_installation ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX ix_notification_installation_active_recipient ON notification_installation(tenant_id,user_id,updated_at DESC) WHERE revoked_at IS NULL;

CREATE TABLE notification_route_delivery (
    tenant_id UUID NOT NULL,
    event_id UUID NOT NULL,
    recipient_technical_id UUID NOT NULL,
    notification_type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('RESERVED','RETRYABLE','DELIVERED')),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (tenant_id,event_id,recipient_technical_id,notification_type)
);
