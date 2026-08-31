CREATE TABLE route_optimization_revision (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    route_id UUID NOT NULL,
    proposal_version BIGINT NOT NULL CHECK (proposal_version >= 1),
    base_route_version BIGINT NOT NULL CHECK (base_route_version >= 1),
    route_version BIGINT NOT NULL CHECK (route_version >= 1),
    origin VARCHAR(20) NOT NULL CHECK (origin = 'MANUAL_EDIT'),
    actor_id UUID NOT NULL,
    route_point_ids JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_route_optimization_revision_route_version UNIQUE (tenant_id, route_id, route_version),
    CONSTRAINT fk_route_optimization_revision_route FOREIGN KEY (tenant_id, route_id)
        REFERENCES route(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_route_optimization_revision_proposal FOREIGN KEY (tenant_id, route_id, proposal_version)
        REFERENCES route_optimization_proposal(tenant_id, route_id, proposal_version)
);

CREATE INDEX ix_route_optimization_revision_proposal
    ON route_optimization_revision(tenant_id, route_id, proposal_version);
