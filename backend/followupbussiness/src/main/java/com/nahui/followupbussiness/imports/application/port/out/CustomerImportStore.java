package com.nahui.followupbussiness.imports.application.port.out;

import com.nahui.followupbussiness.imports.domain.CustomerImport;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface CustomerImportStore {
    Optional<CustomerImport> findByIdempotency(UUID tenantId, UUID requesterId, String key);
    Optional<CustomerImport> findById(UUID tenantId, UUID id);
    List<RowError> findRowErrors(UUID tenantId, UUID importId);
    Optional<CustomerImport> insertIfAbsent(CustomerImport job, byte[] contents);
    Optional<ClaimedImport> claim(UUID importId, UUID tenantId);
    void complete(UUID importId, int acceptedRows, int rejectedRows, boolean failed);
    void recordRowErrors(UUID importId, List<RowError> errors);
    Optional<CustomerImport> fail(UUID importId, UUID tenantId);
    int purgeExpiredFiles();
    int purgeExpiredRowErrors();
    record ClaimedImport(CustomerImport job, byte[] contents) { }
    record RowError(int rowNumber, String code) { }
}
