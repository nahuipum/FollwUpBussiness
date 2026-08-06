package com.nahui.followupbussiness.audit.application.port.in;

import com.nahui.followupbussiness.audit.application.RecordPlatformCompanyAuditCommand;

/** Public audit boundary for the platform company-creation transaction only. */
public interface RecordPlatformCompanyAuditUseCase { void record(RecordPlatformCompanyAuditCommand command); }
