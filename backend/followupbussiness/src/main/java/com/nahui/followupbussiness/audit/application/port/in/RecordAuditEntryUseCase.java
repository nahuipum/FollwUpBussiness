package com.nahui.followupbussiness.audit.application.port.in;

import com.nahui.followupbussiness.audit.application.RecordAuditEntryCommand;

public interface RecordAuditEntryUseCase {
    /** Repeating the same entry id is idempotent and returns {@code false}. */
    boolean record(RecordAuditEntryCommand command);
}
