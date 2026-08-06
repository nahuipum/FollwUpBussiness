ALTER TABLE audit_entry
    ADD COLUMN reason VARCHAR(500),
    ADD CONSTRAINT ck_audit_entry_reason_length
        CHECK (reason IS NULL OR char_length(reason) BETWEEN 5 AND 500);
