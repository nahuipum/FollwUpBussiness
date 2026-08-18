ALTER TABLE customer ADD COLUMN segment VARCHAR(80);
ALTER TABLE customer ADD CONSTRAINT uq_customer_tenant_id UNIQUE (tenant_id, id);
ALTER TABLE workforce_seller ADD CONSTRAINT uq_workforce_seller_tenant_id UNIQUE (tenant_id, id);
ALTER TABLE identity_access_account ADD CONSTRAINT uq_identity_access_account_company_id UNIQUE (company_id, id);

CREATE TABLE customer_portfolio_assignment (
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    effective_from DATE NOT NULL,
    assigned_by UUID NOT NULL,
    reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (tenant_id, customer_id, seller_id),
    CONSTRAINT fk_customer_portfolio_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customer(tenant_id, id),
    CONSTRAINT fk_customer_portfolio_seller FOREIGN KEY (tenant_id, seller_id) REFERENCES workforce_seller(tenant_id, id),
    CONSTRAINT fk_customer_portfolio_actor FOREIGN KEY (tenant_id, assigned_by) REFERENCES identity_access_account(company_id, id)
);
CREATE INDEX ix_customer_portfolio_seller_current ON customer_portfolio_assignment(tenant_id, seller_id, customer_id);

CREATE TABLE customer_portfolio_history (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    previous_seller_id UUID,
    new_seller_id UUID,
    actor_id UUID NOT NULL,
    effective_from DATE NOT NULL,
    reason VARCHAR(500),
    recorded_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_customer_portfolio_history_transition CHECK (previous_seller_id IS NOT NULL OR new_seller_id IS NOT NULL),
    CONSTRAINT fk_customer_portfolio_history_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customer(tenant_id, id),
    CONSTRAINT fk_customer_portfolio_history_previous_seller FOREIGN KEY (tenant_id, previous_seller_id) REFERENCES workforce_seller(tenant_id, id),
    CONSTRAINT fk_customer_portfolio_history_new_seller FOREIGN KEY (tenant_id, new_seller_id) REFERENCES workforce_seller(tenant_id, id),
    CONSTRAINT fk_customer_portfolio_history_actor FOREIGN KEY (tenant_id, actor_id) REFERENCES identity_access_account(company_id, id)
);
CREATE INDEX ix_customer_portfolio_history_customer ON customer_portfolio_history(tenant_id, customer_id, effective_from DESC, recorded_at DESC);
