ALTER TABLE customer_import ADD COLUMN failure_reason VARCHAR(80)
    CHECK (failure_reason IS NULL OR failure_reason IN ('INVALID_TEMPLATE'));
