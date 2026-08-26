package com.nahui.followupbussiness.routing.application.port.out;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Atomically reserves one external matrix call for a tenant account and UTC operational day.
 */
public interface MatrixQuota {
    boolean reserve(UUID tenantId, UUID accountId, LocalDate day);
}
