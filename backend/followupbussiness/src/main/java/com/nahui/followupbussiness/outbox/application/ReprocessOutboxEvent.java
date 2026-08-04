package com.nahui.followupbussiness.outbox.application;

import com.nahui.followupbussiness.outbox.application.port.out.OutboxStore;

import java.time.Clock;
import java.util.Objects;
import java.util.UUID;

public final class ReprocessOutboxEvent {
    private final OutboxStore outboxStore;
    private final Clock clock;
    private final Runnable successfulReprocess;

    public ReprocessOutboxEvent(OutboxStore outboxStore, Clock clock) {
        this(outboxStore, clock, () -> { });
    }

    public ReprocessOutboxEvent(OutboxStore outboxStore, Clock clock, Runnable successfulReprocess) {
        this.outboxStore = Objects.requireNonNull(outboxStore);
        this.clock = Objects.requireNonNull(clock);
        this.successfulReprocess = Objects.requireNonNull(successfulReprocess);
    }

    public boolean execute(UUID eventId, PlatformOperator operator) {
        Objects.requireNonNull(eventId, "eventId is required");
        Objects.requireNonNull(operator, "operator is required");
        if (!operator.platformSuperadmin()) {
            throw new SecurityException("DLQ reprocessing requires PLATFORM_SUPERADMIN");
        }
        boolean reprocessed = outboxStore.reprocessFromDlq(eventId, operator.operatorId(), clock.instant());
        if (reprocessed) {
            successfulReprocess.run();
        }
        return reprocessed;
    }
}
