package com.nahui.followupbussiness.audit.application;

import com.nahui.followupbussiness.audit.application.port.out.AuditEntryStore;
import java.time.Clock;
import java.time.Duration;

public final class PurgeAuditRetention {
    public static final int MAX_BATCH_SIZE = 500;
    private final AuditEntryStore store;
    private final Clock clock;

    public PurgeAuditRetention(AuditEntryStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    public PurgeResult purge() {
        int networkDeleted = deleteInBatches(Duration.ofDays(90), store::deleteNetworkContextBefore);
        int entriesDeleted = deleteInBatches(Duration.ofDays(365), store::deleteEntriesBefore);
        return new PurgeResult(entriesDeleted, networkDeleted);
    }

    private int deleteInBatches(Duration retention, DeleteBatch deleteBatch) {
        int deleted = 0;
        int batch;
        do {
            batch = deleteBatch.delete(clock.instant().minus(retention), MAX_BATCH_SIZE);
            deleted += batch;
        } while (batch == MAX_BATCH_SIZE);
        return deleted;
    }

    @FunctionalInterface
    private interface DeleteBatch { int delete(java.time.Instant before, int batchSize); }

    public record PurgeResult(int entriesDeleted, int networkContextsDeleted) { }
}
