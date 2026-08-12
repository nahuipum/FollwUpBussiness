ALTER TABLE identity_access_account
    ADD COLUMN locked_from_status VARCHAR(16);

ALTER TABLE identity_access_account
    ADD CONSTRAINT ck_identity_access_account_locked_from_status
    CHECK (
        locked_from_status IS NULL
        OR locked_from_status IN ('INVITED', 'ACTIVE', 'INACTIVE')
    );

COMMENT ON COLUMN identity_access_account.locked_from_status IS
    'Status to restore when a manually locked company account is reactivated.';
