CREATE TABLE customer_import (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenancy_company(id), requested_by UUID NOT NULL,
 correlation_id UUID NOT NULL, idempotency_key VARCHAR(128) NOT NULL, file_name VARCHAR(255) NOT NULL,
 content_type VARCHAR(160) NOT NULL, template_version VARCHAR(16) NOT NULL, partial_acceptance BOOLEAN NOT NULL,
 file_sha256 CHAR(64) NOT NULL, status VARCHAR(32) NOT NULL CHECK (status IN ('PENDING','PROCESSING','COMPLETED','COMPLETED_WITH_ERRORS','FAILED')),
 accepted_rows INTEGER NOT NULL DEFAULT 0 CHECK (accepted_rows >= 0), rejected_rows INTEGER NOT NULL DEFAULT 0 CHECK (rejected_rows >= 0),
 original_file BYTEA, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, terminal_at TIMESTAMPTZ,
 error_file_expires_at TIMESTAMPTZ, CONSTRAINT uq_customer_import_idempotency UNIQUE (tenant_id,requested_by,idempotency_key)
);
CREATE INDEX ix_customer_import_tenant_id ON customer_import(tenant_id,id);
CREATE TABLE customer_import_row_error (id UUID PRIMARY KEY, import_id UUID NOT NULL REFERENCES customer_import(id) ON DELETE CASCADE, row_number INTEGER NOT NULL CHECK(row_number > 0), error_code VARCHAR(80) NOT NULL, created_at TIMESTAMPTZ NOT NULL, CONSTRAINT uq_customer_import_row_error UNIQUE(import_id,row_number,error_code));
