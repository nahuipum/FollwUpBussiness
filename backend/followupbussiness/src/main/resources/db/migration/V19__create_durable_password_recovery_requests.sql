CREATE TABLE identity_access_recovery_request (
    id UUID PRIMARY KEY,
    identifier_ciphertext BYTEA NOT NULL,
    identifier_digest BYTEA NOT NULL,
    next_attempt_at TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX uq_identity_access_recovery_request_pending
    ON identity_access_recovery_request(identifier_digest)
    WHERE completed_at IS NULL;
CREATE INDEX ix_identity_access_recovery_request_due
    ON identity_access_recovery_request(next_attempt_at)
    WHERE completed_at IS NULL;
