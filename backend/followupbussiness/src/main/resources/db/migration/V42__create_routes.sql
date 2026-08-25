CREATE TABLE route (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(160),
    operational_date DATE NOT NULL,
    seller_id UUID NOT NULL,
    start_location geometry(Point,4326),
    status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT','PUBLISHED','IN_PROGRESS','COMPLETED','CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL CHECK (version >= 1),
    CONSTRAINT uq_route_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT fk_route_seller FOREIGN KEY (tenant_id, seller_id) REFERENCES workforce_seller(tenant_id, id)
);
CREATE INDEX ix_route_tenant_date ON route(tenant_id, operational_date);
CREATE TABLE route_point (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    route_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    sequence INTEGER NOT NULL CHECK (sequence >= 1),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','VISITED','SKIPPED')),
    location geometry(Point,4326) NOT NULL,
    CONSTRAINT uq_route_point_sequence UNIQUE (tenant_id, route_id, sequence),
    CONSTRAINT fk_route_point_route FOREIGN KEY (tenant_id, route_id) REFERENCES route(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_route_point_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customer(tenant_id, id)
);
CREATE TABLE route_idempotency (
    tenant_id UUID NOT NULL,
    actor_id UUID NOT NULL,
    idempotency_key UUID NOT NULL,
    request_fingerprint VARCHAR(64) NOT NULL,
    route_id UUID,
    recorded_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','COMPLETED')),
    PRIMARY KEY (tenant_id, actor_id, idempotency_key),
    CONSTRAINT fk_route_idempotency_route FOREIGN KEY (tenant_id, route_id) REFERENCES route(tenant_id, id)
);
