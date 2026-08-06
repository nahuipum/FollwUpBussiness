package com.nahui.followupbussiness.audit.application.port.in;

import com.nahui.followupbussiness.audit.application.RecordCompanyDenialAuditCommand;

/** Public audit boundary for a tenant-bound denied company-creation attempt. */
public interface RecordCompanyDenialAuditUseCase { void record(RecordCompanyDenialAuditCommand command); }
