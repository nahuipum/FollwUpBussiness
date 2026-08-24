package com.nahui.followupbussiness.imports.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Durable, tenant-scoped import job. The original file is never exposed from this aggregate.
 */
public record CustomerImport(UUID id, UUID tenantId, UUID requestedBy, UUID correlationId, String idempotencyKey,
                             String fileName, String contentType, String templateVersion, boolean partialAcceptance,
                             String fileSha256, Status status, Integer totalRows, int acceptedRows, int rejectedRows,
                             Instant createdAt, Instant updatedAt, Instant terminalAt, Instant errorFileExpiresAt,
                             FailureReason failureReason) {
    public CustomerImport(UUID id, UUID tenantId, UUID requestedBy, UUID correlationId, String idempotencyKey,
                          String fileName, String contentType, String templateVersion, boolean partialAcceptance,
                          String fileSha256, Status status, int acceptedRows, int rejectedRows, Instant createdAt,
                          Instant updatedAt, Instant terminalAt, Instant errorFileExpiresAt) {
        this(id, tenantId, requestedBy, correlationId, idempotencyKey, fileName, contentType, templateVersion,
                partialAcceptance, fileSha256, status, null, acceptedRows, rejectedRows, createdAt, updatedAt,
                terminalAt, errorFileExpiresAt, null);
    }

    public CustomerImport(UUID id, UUID tenantId, UUID requestedBy, UUID correlationId, String idempotencyKey,
                          String fileName, String contentType, String templateVersion, boolean partialAcceptance,
                          String fileSha256, Status status, Integer totalRows, int acceptedRows, int rejectedRows,
                          Instant createdAt, Instant updatedAt, Instant terminalAt, Instant errorFileExpiresAt) {
        this(id, tenantId, requestedBy, correlationId, idempotencyKey, fileName, contentType, templateVersion,
                partialAcceptance, fileSha256, status, totalRows, acceptedRows, rejectedRows, createdAt, updatedAt,
                terminalAt, errorFileExpiresAt, null);
    }

    public enum Status {PENDING, PROCESSING, COMPLETED, COMPLETED_WITH_ERRORS, FAILED}

    /** Public, safe reason only for terminal failures that prevent parsing. */
    public enum FailureReason {INVALID_TEMPLATE}
}
