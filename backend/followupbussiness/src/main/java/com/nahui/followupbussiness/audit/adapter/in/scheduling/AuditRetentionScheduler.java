package com.nahui.followupbussiness.audit.adapter.in.scheduling;

import com.nahui.followupbussiness.audit.application.PurgeAuditRetention;
import io.micrometer.core.instrument.Counter;
import org.springframework.scheduling.annotation.Scheduled;

public final class AuditRetentionScheduler {
    private final PurgeAuditRetention retention;
    private final Counter entriesCounter;
    private final Counter networkContextsCounter;

    public AuditRetentionScheduler(PurgeAuditRetention retention, Counter entriesCounter, Counter networkContextsCounter) {
        this.retention = retention;
        this.entriesCounter = entriesCounter;
        this.networkContextsCounter = networkContextsCounter;
    }

    @Scheduled(fixedDelayString = "${followupbussiness.audit.retention-delay-ms:86400000}")
    public void purgeExpiredEvidence() {
        PurgeAuditRetention.PurgeResult result = retention.purge();
        entriesCounter.increment(result.entriesDeleted());
        networkContextsCounter.increment(result.networkContextsDeleted());
    }
}
