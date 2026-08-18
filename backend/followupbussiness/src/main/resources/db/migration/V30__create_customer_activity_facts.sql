CREATE TABLE customer_activity_fact (
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    last_completed_visit_at TIMESTAMPTZ,
    last_confirmed_purchase_at TIMESTAMPTZ,
    PRIMARY KEY (tenant_id, customer_id),
    CONSTRAINT fk_customer_activity_fact_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customer(tenant_id, id)
);
