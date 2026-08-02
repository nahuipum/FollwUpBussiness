ALTER TABLE identity_access_account
    ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN display_name VARCHAR(160),
    ADD COLUMN email VARCHAR(254),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD CONSTRAINT ck_identity_access_account_status CHECK (status IN ('INVITED', 'ACTIVE', 'INACTIVE', 'LOCKED'));

-- The controlled platform bootstrap predates profile capture.  Its login identifier
-- remains authoritative only as a login; provisioning must populate profile fields.
CREATE TABLE identity_access_session_family (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES identity_access_account(id),
    company_id UUID,
    channel VARCHAR(8) NOT NULL CHECK (channel IN ('WEB', 'MOBILE')),
    client_instance_digest BYTEA NOT NULL,
    refresh_token_digest BYTEA NOT NULL UNIQUE,
    csrf_token_digest BYTEA,
    revocation_ticket_digest BYTEA,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_identity_access_session_company CHECK (company_id IS NULL OR company_id <> '00000000-0000-0000-0000-000000000000')
);
CREATE INDEX ix_identity_access_session_active ON identity_access_session_family(account_id, expires_at) WHERE revoked_at IS NULL;
