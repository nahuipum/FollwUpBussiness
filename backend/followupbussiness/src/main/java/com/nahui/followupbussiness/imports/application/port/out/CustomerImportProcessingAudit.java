package com.nahui.followupbussiness.imports.application.port.out;

import java.util.UUID;

/**
 * Audit boundary deliberately carries identifiers and controlled status only.
 */
public interface CustomerImportProcessingAudit {
    void record(UUID tenantId, UUID actorId, UUID importId, UUID correlationId, String status);
}
