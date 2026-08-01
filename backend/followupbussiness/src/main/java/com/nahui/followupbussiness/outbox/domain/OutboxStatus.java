package com.nahui.followupbussiness.outbox.domain;

public enum OutboxStatus {
    PENDING,
    CLAIMED,
    PUBLISHED,
    RETRY_SCHEDULED,
    TERMINAL
}
