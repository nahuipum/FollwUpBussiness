ALTER TABLE customer_import ADD COLUMN total_rows INTEGER CHECK (total_rows IS NULL OR total_rows >= 0);
