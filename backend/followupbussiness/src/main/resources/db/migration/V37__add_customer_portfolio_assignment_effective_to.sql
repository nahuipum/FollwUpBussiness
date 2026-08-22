ALTER TABLE customer_portfolio_assignment
    ADD COLUMN effective_to DATE;

ALTER TABLE customer_portfolio_assignment
    DROP CONSTRAINT customer_portfolio_assignment_pkey,
    ADD PRIMARY KEY (tenant_id, customer_id, seller_id, effective_from);
