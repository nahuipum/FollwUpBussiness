package com.nahui.followupbussiness.imports.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Durable, tenant-scoped import job. The original file is never exposed from this aggregate.
 */
public record CustomerImport(UUID id, UUID tenantId, UUID requestedBy, UUID correlationId, String idempotencyKey,
                             String fileName, String contentType, String templateVersion, boolean partialAcceptance,
                             String fileSha256, Status status, int acceptedRows, int rejectedRows,
                             Instant createdAt, Instant updatedAt, Instant terminalAt, Instant errorFileExpiresAt) {
    public enum Status {PENDING, PROCESSING, COMPLETED, COMPLETED_WITH_ERRORS, FAILED}
}
