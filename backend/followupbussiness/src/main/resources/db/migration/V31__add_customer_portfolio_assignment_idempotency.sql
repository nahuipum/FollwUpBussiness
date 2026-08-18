CREATE TABLE customer_portfolio_assignment_idempotency (
    tenant_id UUID NOT NULL,
    idempotency_key UUID NOT NULL,
    request_fingerprint VARCHAR(2000) NOT NULL,
    results TEXT[] NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (tenant_id, idempotency_key)
);
