ALTER TABLE identity_access_account ADD COLUMN credential_version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE identity_access_action_token (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES identity_access_account(id),
    company_id UUID,
    purpose VARCHAR(32) NOT NULL CHECK (purpose IN ('PASSWORD_RESET','ACTIVATION')),
    token_digest BYTEA NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    invalidated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX ix_identity_access_action_token_account ON identity_access_action_token(account_id,purpose) WHERE used_at IS NULL AND invalidated_at IS NULL;

CREATE TABLE identity_access_notification (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES identity_access_account(id),
    company_id UUID,
    purpose VARCHAR(32) NOT NULL CHECK (purpose IN ('PASSWORD_RESET','ACTIVATION')),
    payload_ciphertext BYTEA NOT NULL,
    payload_digest BYTEA NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    next_attempt_at TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    delivered_at TIMESTAMPTZ,
    superseded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_identity_access_notification_dedupe UNIQUE(account_id,purpose,payload_digest)
);
CREATE INDEX ix_identity_access_notification_delivery ON identity_access_notification(next_attempt_at) WHERE delivered_at IS NULL AND superseded_at IS NULL;
