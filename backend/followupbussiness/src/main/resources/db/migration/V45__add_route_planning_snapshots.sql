ALTER TABLE route_point ADD COLUMN planned_arrival_at TIMESTAMPTZ;
ALTER TABLE route_point ADD COLUMN planned_departure_at TIMESTAMPTZ;
CREATE TABLE route_planning_snapshot (
    id UUID PRIMARY KEY, tenant_id UUID NOT NULL, route_id UUID NOT NULL, base_route_version BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('CAPTURING','VALID','INCOMPLETE','FAILED','INVALIDATED','SUPERSEDED','EXPIRED','PURGED')),
    valid_until TIMESTAMPTZ NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_route_snapshot_revision UNIQUE (tenant_id, route_id, base_route_version),
    CONSTRAINT fk_route_snapshot_route FOREIGN KEY (tenant_id, route_id) REFERENCES route(tenant_id,id) ON DELETE CASCADE
);
CREATE INDEX ix_route_snapshot_lookup ON route_planning_snapshot(tenant_id, route_id, base_route_version, status);
