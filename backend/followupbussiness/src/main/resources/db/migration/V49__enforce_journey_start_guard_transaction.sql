ALTER TABLE journey_start_guard
    ADD COLUMN guard_lock_txid BIGINT NOT NULL DEFAULT 0;
