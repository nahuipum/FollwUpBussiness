ALTER TABLE customer_portfolio_assignment_idempotency
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED';
