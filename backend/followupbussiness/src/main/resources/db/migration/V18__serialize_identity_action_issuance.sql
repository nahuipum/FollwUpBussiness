CREATE UNIQUE INDEX uq_identity_access_action_token_current
    ON identity_access_action_token(account_id, purpose)
    WHERE used_at IS NULL AND invalidated_at IS NULL;

CREATE UNIQUE INDEX uq_identity_access_notification_current
    ON identity_access_notification(account_id, purpose)
    WHERE delivered_at IS NULL AND superseded_at IS NULL;
