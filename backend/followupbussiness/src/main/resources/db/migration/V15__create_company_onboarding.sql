ALTER TABLE tenancy_company
    ADD COLUMN legal_name VARCHAR(200),
    ADD COLUMN trade_name VARCHAR(200),
    ADD COLUMN code VARCHAR(40),
    ADD COLUMN tax_id VARCHAR(30),
    ADD COLUMN version BIGINT NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX uq_tenancy_company_code ON tenancy_company (code) WHERE code IS NOT NULL;

CREATE TABLE tenancy_company_settings (
    company_id UUID PRIMARY KEY REFERENCES tenancy_company(id) ON DELETE CASCADE,
    timezone VARCHAR(100) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    geofence_radius_meters INTEGER NOT NULL CHECK (geofence_radius_meters = 100),
    tracking_interval_seconds INTEGER NOT NULL CHECK (tracking_interval_seconds = 60),
    location_retention_days INTEGER NOT NULL DEFAULT 90 CHECK (location_retention_days = 90),
    sale_edit_window_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
