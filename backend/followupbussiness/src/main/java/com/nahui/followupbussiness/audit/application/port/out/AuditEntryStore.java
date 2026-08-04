package com.nahui.followupbussiness.audit.application.port.out;

import com.nahui.followupbussiness.audit.domain.AuditEntry;
import java.time.Instant;

public interface AuditEntryStore {
    boolean append(AuditEntry entry);
    int deleteNetworkContextBefore(Instant before, int batchSize);
    int deleteEntriesBefore(Instant before, int batchSize);
}
