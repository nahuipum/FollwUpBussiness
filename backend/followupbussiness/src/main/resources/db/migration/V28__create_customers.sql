CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE customer (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenancy_company(id), name VARCHAR(200) NOT NULL, document_type VARCHAR(30), document_number VARCHAR(40), phone VARCHAR(30), email VARCHAR(254), address VARCHAR(300) NOT NULL, location geometry(Point,4326) NOT NULL, visit_frequency_days INTEGER, territory_id UUID REFERENCES workforce_territory(id), status VARCHAR(16) NOT NULL CHECK (status IN ('ACTIVE','INACTIVE')), created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, version BIGINT NOT NULL, CONSTRAINT ck_customer_location_srid CHECK (ST_SRID(location) = 4326), CONSTRAINT ck_customer_visit_frequency CHECK (visit_frequency_days IS NULL OR visit_frequency_days BETWEEN 1 AND 365));
CREATE INDEX ix_customer_tenant_id ON customer(tenant_id,id);
CREATE INDEX ix_customer_tenant_territory ON customer(tenant_id,territory_id,id);
CREATE INDEX ix_customer_location_gist ON customer USING GIST(location);
