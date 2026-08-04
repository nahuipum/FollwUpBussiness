CREATE TABLE transactional_outbox_dlq (
    event_id UUID PRIMARY KEY REFERENCES transactional_outbox(event_id),
    tenant_id UUID NOT NULL,
    correlation_id UUID NOT NULL,
    causation_id UUID NOT NULL,
    event_type VARCHAR(160) NOT NULL,
    event_version INTEGER NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    attempt_count INTEGER NOT NULL CHECK (attempt_count >= 1 AND attempt_count <= 8),
    failure_kind VARCHAR(16) NOT NULL CHECK (failure_kind IN ('TRANSIENT', 'PERMANENT')),
    failure_type VARCHAR(120) NOT NULL,
    failure_detail VARCHAR(500) NOT NULL,
    entered_at TIMESTAMPTZ NOT NULL,
    reprocess_count INTEGER NOT NULL DEFAULT 0 CHECK (reprocess_count >= 0 AND reprocess_count <= 3),
    last_reprocessed_by UUID,
    last_reprocessed_at TIMESTAMPTZ,
    CHECK ((last_reprocessed_by IS NULL) = (last_reprocessed_at IS NULL))
);
CREATE INDEX idx_transactional_outbox_dlq_entered_at ON transactional_outbox_dlq (entered_at);

CREATE TABLE transactional_outbox_dlq_reprocess_audit (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES transactional_outbox_dlq(event_id) ON DELETE CASCADE,
    operator_id UUID NOT NULL,
    reprocessed_at TIMESTAMPTZ NOT NULL,
    result VARCHAR(16) NOT NULL CHECK (result = 'REPROCESSED')
);
CREATE INDEX idx_transactional_outbox_dlq_reprocess_audit_event ON transactional_outbox_dlq_reprocess_audit (event_id, reprocessed_at);
