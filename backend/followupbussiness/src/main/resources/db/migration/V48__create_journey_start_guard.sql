CREATE TABLE journey_start_guard (
    tenant_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    business_date DATE NOT NULL,
    started_at TIMESTAMPTZ,
    PRIMARY KEY (tenant_id, seller_id, business_date)
);
