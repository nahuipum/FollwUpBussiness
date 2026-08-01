CREATE TABLE transactional_outbox (
    event_id UUID PRIMARY KEY,
    event_type VARCHAR(160) NOT NULL,
    event_version INTEGER NOT NULL CHECK (event_version > 0),
    occurred_at TIMESTAMPTZ NOT NULL,
    tenant_id UUID NOT NULL,
    correlation_id UUID NOT NULL,
    causation_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(24) NOT NULL CHECK (status IN ('PENDING', 'CLAIMED', 'PUBLISHED', 'RETRY_SCHEDULED', 'TERMINAL')),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0 AND attempt_count <= 8),
    next_attempt_at TIMESTAMPTZ NOT NULL,
    lease_token UUID,
    lease_expires_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    terminal_at TIMESTAMPTZ,
    failure_type VARCHAR(120),
    failure_detail VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((status = 'CLAIMED') = (lease_token IS NOT NULL AND lease_expires_at IS NOT NULL)),
    CHECK (status <> 'CLAIMED' OR published_at IS NULL),
    CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL),
    CHECK (status <> 'TERMINAL' OR terminal_at IS NOT NULL)
);

CREATE INDEX idx_transactional_outbox_claim
    ON transactional_outbox (next_attempt_at, created_at)
    WHERE status IN ('PENDING', 'RETRY_SCHEDULED');

CREATE INDEX idx_transactional_outbox_expired_lease
    ON transactional_outbox (lease_expires_at)
    WHERE status = 'CLAIMED';

CREATE INDEX idx_transactional_outbox_retention
    ON transactional_outbox (published_at, terminal_at)
    WHERE status IN ('PUBLISHED', 'TERMINAL');
