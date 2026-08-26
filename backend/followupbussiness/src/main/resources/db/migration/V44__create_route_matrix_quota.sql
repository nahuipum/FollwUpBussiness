CREATE TABLE route_matrix_quota (
    tenant_id UUID NOT NULL,
    account_id UUID NOT NULL,
    operational_date DATE NOT NULL,
    used_matrices INTEGER NOT NULL CHECK (used_matrices BETWEEN 1 AND 35),
    PRIMARY KEY (tenant_id, account_id, operational_date)
);
