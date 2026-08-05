package com.nahui.followupbussiness.audit.application.port.in;

import com.nahui.followupbussiness.audit.application.RecordAuthenticationAuditCommand;

/** Public audit boundary for anonymous authentication with server-derived context only. */
public interface RecordAuthenticationAuditUseCase {
    void record(RecordAuthenticationAuditCommand command);
}
