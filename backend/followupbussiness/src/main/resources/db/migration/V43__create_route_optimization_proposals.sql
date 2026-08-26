CREATE TABLE route_optimization_proposal (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, route_id UUID NOT NULL, actor_id UUID NOT NULL, territory_id UUID NOT NULL,
 proposal_version BIGINT NOT NULL CHECK(proposal_version>=1), base_route_version BIGINT NOT NULL, published BOOLEAN NOT NULL DEFAULT FALSE,
 result JSONB NOT NULL, input_hash VARCHAR(64) NOT NULL, matrix_hash VARCHAR(64) NOT NULL, generated_at TIMESTAMPTZ NOT NULL,
 UNIQUE(tenant_id,route_id,proposal_version), FOREIGN KEY(tenant_id,route_id) REFERENCES route(tenant_id,id));
